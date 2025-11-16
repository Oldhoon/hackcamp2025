"""Minimal FastAPI server to stream MediaPipe landmarks and expose session controls."""
from typing import Optional
import asyncio

import cv2
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.pose_pipeline import PosePipeline
from backend.exercise_counter import SquatCounter


class SessionParams(BaseModel):
    focus_seconds: int
    break_seconds: int
    mode: str = "focus"


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline: Optional[PosePipeline] = None
counter: Optional[SquatCounter] = None
running = False
mode = "idle"
posture_score = 0.0
reps = 0
smoothed_posture = 0.0


def compute_posture_score(landmarks) -> float:
    """
    Compute a 0-100 posture score based on:
    - landmark visibility
    - head/torso forward tilt (nose vs shoulder midpoint)
    - shoulder/hip level alignment
    - spine verticality (shoulder-to-hip vector vs vertical axis)
    """
    if not landmarks:
        return 0.0

    # Visibility/presence score
    visibilities = [lm.visibility for lm in landmarks]
    present = [v for v in visibilities if v > 0.5]
    presence_score = len(present) / len(landmarks)  # 0-1

    try:
        # MediaPipe indices: nose=0, shoulders=11/12, hips=23/24
        l_sh, r_sh = landmarks[11], landmarks[12]
        l_hip, r_hip = landmarks[23], landmarks[24]
        nose = landmarks[0]

        # Shoulder/hip level alignment (penalize tilt)
        shoulder_tilt = abs(l_sh.y - r_sh.y)
        hip_tilt = abs(l_hip.y - r_hip.y)
        alignment_score = max(0.0, 1.0 - (shoulder_tilt + hip_tilt) * 5)

        # Head/torso forward tilt: vertical distance nose -> shoulder midpoint
        shoulder_mid = ((l_sh.x + r_sh.x) / 2, (l_sh.y + r_sh.y) / 2)
        head_tilt = abs(shoulder_mid[1] - nose.y)
        head_tilt_score = max(0.0, 1.0 - head_tilt * 6)

        # Spine verticality: angle between shoulder->hip vector and vertical axis
        spine_vec_y = (l_hip.y + r_hip.y) / 2 - (l_sh.y + r_sh.y) / 2
        spine_vec_x = (l_hip.x + r_hip.x) / 2 - (l_sh.x + r_sh.x) / 2
        # Smaller x deviation => closer to vertical
        spine_score = max(0.0, 1.0 - abs(spine_vec_x) * 8)
    except Exception:
        alignment_score = 0.5
        head_tilt_score = 0.5
        spine_score = 0.5

    raw = (
        0.4 * presence_score
        + 0.25 * alignment_score
        + 0.2 * head_tilt_score
        + 0.15 * spine_score
    )
    return max(0.0, min(raw * 100, 100.0))


@app.post("/session/start")
async def start_session(params: SessionParams):
    """Start a session and reset counters."""
    global pipeline, counter, running, mode, posture_score, reps
    if pipeline is None:
        pipeline = PosePipeline()
    if counter is None:
        counter = SquatCounter()
    else:
        counter.rep_count = 0
    running = True
    mode = params.mode
    posture_score = 0.0
    reps = 0
    return {
        "status": "started",
        "focus_seconds": params.focus_seconds,
        "break_seconds": params.break_seconds,
        "mode": mode,
    }


@app.post("/session/stop")
async def stop_session():
    global running, mode
    running = False
    mode = "idle"
    return {"status": "stopped"}


@app.get("/session/status")
async def session_status():
    # Just return the latest computed values. The preview stream updates posture_score.
    return {
        "mode": mode,
        "running": running,
        "posture_score": posture_score,
        "reps": reps,
    }


async def frame_generator():
    """Continuous MJPEG stream; updates posture_score/reps when landmarks present."""
    global posture_score, smoothed_posture, reps, counter
    if pipeline is None:
        return
    if counter is None:
        counter = SquatCounter()
    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
    while True:
        frame, landmarks = pipeline.read()
        if frame is None:
            await asyncio.sleep(0)
            continue
        if landmarks:
            raw_score = compute_posture_score(landmarks)
            smoothed_posture = 0.8 * smoothed_posture + 0.2 * raw_score
            posture_score = smoothed_posture
            try:
                exercise_result = counter.update(landmarks)
                reps = exercise_result.reps
            except Exception:
                pass
        ret, encoded = cv2.imencode(".jpg", frame, encode_params)
        if not ret:
            await asyncio.sleep(0)
            continue
        jpg_bytes = encoded.tobytes()
        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + jpg_bytes + b"\r\n")
        await asyncio.sleep(0)


@app.get("/session/preview")
async def session_preview():
    global pipeline, running, mode
    if pipeline is None:
        pipeline = PosePipeline()
    # ensure streaming even if running flag wasn't set yet
    if not running:
        running = True
        mode = "break"
    return StreamingResponse(frame_generator(), media_type="multipart/x-mixed-replace; boundary=frame")
