"""Posture detection utilities built on top of MediaPipe Pose.

The module can be imported by the main loop or executed directly for a
webcam demo. `PostureDetector` converts pose landmarks into smoothed posture
labels plus a simple quality score.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
import math
from typing import Deque, Iterable, Optional

import cv2
import mediapipe as mp
from mediapipe.framework.formats import landmark_pb2


@dataclass
class PostureResult:
    label: str
    score: float
    neck_angle: float
    torso_angle: float
    good_frames: int
    bad_frames: int


class PostureDetector:
    def __init__(
        self,
        neck_threshold: float = 18.0,
        torso_threshold: float = 12.0,
        smoothing_window: int = 15,
    ) -> None:
        self.neck_threshold = neck_threshold
        self.torso_threshold = torso_threshold
        self.history: Deque[bool] = deque(maxlen=smoothing_window)
        self.good_frames = 0
        self.bad_frames = 0

    def analyze(
        self, landmarks: Iterable[landmark_pb2.NormalizedLandmark]
    ) -> Optional[PostureResult]:
        """Return posture metrics for the current frame."""

        try:
            lm = list(landmarks)
            left_shoulder = lm[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = lm[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
            left_hip = lm[mp.solutions.pose.PoseLandmark.LEFT_HIP]
            right_hip = lm[mp.solutions.pose.PoseLandmark.RIGHT_HIP]
            left_ear = lm[mp.solutions.pose.PoseLandmark.LEFT_EAR]
            right_ear = lm[mp.solutions.pose.PoseLandmark.RIGHT_EAR]
        except IndexError:
            return None

        shoulder = _midpoint(left_shoulder, right_shoulder)
        hip = _midpoint(left_hip, right_hip)
        ear = _choose_visible(left_ear, right_ear)
        if ear is None:
            return None

        neck_angle = _angle_with_vertical(shoulder, ear)
        torso_angle = _angle_with_vertical(hip, shoulder)

        is_good = neck_angle < self.neck_threshold and torso_angle < self.torso_threshold
        self.history.append(is_good)
        if is_good:
            self.good_frames += 1
        else:
            self.bad_frames += 1

        score = sum(self.history) / len(self.history)
        if score >= 0.75:
            label = "good"
        elif score >= 0.4:
            label = "caution"
        else:
            label = "bad"

        return PostureResult(
            label=label,
            score=score,
            neck_angle=neck_angle,
            torso_angle=torso_angle,
            good_frames=self.good_frames,
            bad_frames=self.bad_frames,
        )

    def score_only(
        self, landmarks: Iterable[landmark_pb2.NormalizedLandmark]
    ) -> Optional[float]:
        """Convenience helper that returns just the smoothed posture score."""

        result = self.analyze(landmarks)
        return result.score if result else None

    def annotate(self, frame, result: PostureResult) -> None:
        """Overlay posture data on a frame."""

        colors = {
            "good": (0, 200, 0),
            "caution": (0, 200, 255),
            "bad": (0, 0, 255),
        }
        color = colors.get(result.label, (255, 255, 255))
        text = (
            f"Posture: {result.label.upper()}  "
            f"Neck {result.neck_angle:0.1f}°  "
            f"Torso {result.torso_angle:0.1f}°  "
            f"Score {result.score:0.2f}"
        )
        cv2.putText(
            frame,
            text,
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color,
            2,
            cv2.LINE_AA,
        )


def _midpoint(a: landmark_pb2.NormalizedLandmark, b: landmark_pb2.NormalizedLandmark):
    return ((a.x + b.x) / 2, (a.y + b.y) / 2)


def _choose_visible(
    a: landmark_pb2.NormalizedLandmark, b: landmark_pb2.NormalizedLandmark
):
    if a.visibility >= 0.5 and b.visibility >= 0.5:
        return _midpoint(a, b)
    if a.visibility >= b.visibility:
        return (a.x, a.y)
    return (b.x, b.y)


def _angle_with_vertical(p1, p2):
    """Angle between the vector p1->p2 and the negative Y axis (camera up)."""

    vx = p2[0] - p1[0]
    vy = p2[1] - p1[1]
    magnitude = (vx * vx + vy * vy) ** 0.5
    if magnitude == 0:
        return 0.0
    dot = (0 * vx) + (-1 * vy)
    cosine = max(min(dot / magnitude, 1.0), -1.0)
    return abs(math.degrees(math.acos(cosine)))


def main() -> None:
    """Simple webcam demo for the posture detector."""

    detector = PostureDetector()
    mp_pose = mp.solutions.pose
    drawing_utils = mp.solutions.drawing_utils
    
    SHOW_LANDMARKS = False

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Unable to access webcam")

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = pose.process(rgb)
            rgb.flags.writeable = True

            if results.pose_landmarks:
                if SHOW_LANDMARKS:
                    drawing_utils.draw_landmarks(
                        frame,
                        results.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS,
                        drawing_utils.DrawingSpec(
                            color=(0, 255, 0), thickness=3, circle_radius=4
                        ),
                        drawing_utils.DrawingSpec(
                            color=(0, 0, 255), thickness=3, circle_radius=2
                        ),
                    )
                posture = detector.analyze(results.pose_landmarks.landmark)
                if posture:
                    detector.annotate(frame, posture)

            cv2.imshow("Posture Detector", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
