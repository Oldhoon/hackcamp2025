# Session state management
import time
import cv2
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel

from backend.exercise_counter import SquatCounter
from backend.pose_pipeline import PosePipeline
from backend.posture_detector import PostureDetector

SHOW_PREVIEW = True

app = FastAPI()


class SessionConfig(BaseModel):
    focus_seconds: int = 50 * 60
    break_seconds: int = 10 * 60


class SessionState:
    def __init__(self):
        self.mode: str = "idle"  # idle, focus, break
        self.remaining: int = 0
        self.reps: int = 0
        self.posture_score: float = 0.0
        self.running: bool = False


session_state = SessionState()


def _next_mode(current: str) -> str:
    return "break" if current == "focus" else "focus"


def session_loop(config: SessionConfig):
    if session_state.running:
        return

    pipeline = PosePipeline()
    counter = SquatCounter()
    detector = PostureDetector()

    focus_time = max(config.focus_seconds, 1) # at least 1s on timer
    break_time = max(config.break_seconds, 1)
    mode = "focus"
    duration = focus_time
    next_switch = time.monotonic() + duration

    session_state.running = True
    session_state.mode = mode
    session_state.remaining = duration
    session_state.reps = 0
    session_state.posture_score = 0.0

    try:
        while session_state.running:
            now = time.monotonic()
            remaining = max(int(next_switch - now), 0)
            session_state.remaining = remaining

            frame, landmarks = pipeline.read()
            if frame is None:
                break

            if SHOW_PREVIEW:
                cv2.imshow("Session Preview", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    session_state.running = False
                    break

            if landmarks is not None:
                result = counter.update(landmarks)
                session_state.reps = result.reps

                posture_result = detector.analyze(landmarks)
                if posture_result is not None:
                    session_state.posture_score = posture_result.score

            if remaining <= 0:
                mode = _next_mode(mode)
                duration = break_time if mode == "break" else focus_time
                next_switch = time.monotonic() + duration
                session_state.mode = mode
                session_state.remaining = duration

            time.sleep(0.05)
    finally:
        session_state.running = False
        session_state.mode = "idle"
        session_state.remaining = 0
        pipeline.release()
        if SHOW_PREVIEW:
            cv2.destroyWindow("Session Preview")


@app.post("/session/start")
def start_session(config: SessionConfig, tasks: BackgroundTasks):
    tasks.add_task(session_loop, config)
    return {"status": "starting"}


@app.get("/session/status")
def get_status():
    return {
        "mode": session_state.mode,
        "remaining_seconds": session_state.remaining,
        "reps": session_state.reps,
        "posture_score": session_state.posture_score,
        "running": session_state.running,
    }

@app.post("/session/stop")
def stop_session():
    session_state.running = False
    return {"status": "stopping"}

