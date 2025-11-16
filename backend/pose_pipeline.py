# Pose detection and processing pipeline
import cv2
import mediapipe as mp


class PosePipeline:
    def __init__(
        self,
        camera_index: int = 0,
        frame_width: int = 1280,
        frame_height: int = 720,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        draw_landmarks: bool = True,
    ):
        self.camera_index = camera_index
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.draw_landmarks_flag = draw_landmarks

        self.cap = cv2.VideoCapture(self.camera_index)

        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_pose = mp.solutions.pose

        self.pose = self.mp_pose.Pose(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

        # Simple readiness check
        while True:
            ok, frame = self.cap.read()
            if ok and frame is not None:
                break
            print("Waiting for video")

    def read(self):
        """
        Reads one frame, runs pose detection, returns
        (frame_bgr, landmarks_list) or (None, None) on fatal error.
        """
        ret, frame = self.cap.read()
        if not ret or frame is None:
            print("Error reading frame")
            return None, None

        frame = cv2.resize(frame, (self.frame_width, self.frame_height))

        # convert to RGB for Mediapipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_rgb.flags.writeable = False

        result = self.pose.process(frame_rgb)
        landmarks = getattr(result.pose_landmarks, "landmark", None)

        # back to BGR for display
        frame_rgb.flags.writeable = True
        frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)

        if self.draw_landmarks_flag and result.pose_landmarks is not None:
            self.mp_drawing.draw_landmarks(
                frame_bgr,
                result.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                self.mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2),
            )

        return frame_bgr, landmarks

    def release(self):
        self.cap.release()
        self.pose.close()
