# Session state management
from typing import Union
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel


app = FastAPI()

class SessionConfig(BaseModel):
    focus_seconds: int = 50 * 60
    break_seconds: int = 10 * 60

