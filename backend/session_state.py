# Session state management
from typing import Union
from fastapi import FastAPI

app = FastAPI()


@app.post("/")