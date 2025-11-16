# Session state management
from typing import Union
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel


app = FastAPI()

class SessionConfig(BaseModel):
    focus_seconds: int = 50 * 60
    break_seconds: int = 10 * 60

@app.post("/session/start")
def start_session(config: SessionConfig, tasks: BackgroundTasks):
    tasks.add_task(session_loop, config)
    return {"status": "ok"}

@app.get("/session/status")
def get_status():
