#https://github.com/Careless-Caramel/squat-counter/blob/main/MAIN.py
from dataclasses import dataclass
from typing import List, Dict, Any
from backend.pose_utils import find_angle, leg_state



@dataclass
class ExerciseResult:
    reps: int
    messages: list[str]


class SquatCounter:
    def __init__(self):
        self.rep_count = 0
        self.last_state = 9  # start as upright

    def update(self, landmarks: List[Any]) -> ExerciseResult:
        messages: list[str] = []

        # hip knee ankle indices
        r_angle = find_angle(landmarks[24], landmarks[26], landmarks[28])
        l_angle = find_angle(landmarks[23], landmarks[25], landmarks[27])

        r_state = leg_state(r_angle)
        l_state = leg_state(l_angle)
        state = r_state * l_state

        if state == 0:
            if r_state == 0:
                messages.append("Right leg not detected")
            if l_state == 0:
                messages.append("Left leg not detected")

        elif state % 2 == 0 or r_state != l_state:
            if self.last_state == 1:
                if l_state in (1, 2):
                    messages.append("Fully extend left leg")
                if r_state in (1, 2):
                    messages.append("Fully extend right leg")
            else:
                if l_state in (2, 3):
                    messages.append("Fully retract left leg")
                if r_state in (2, 3):
                    messages.append("Fully retract right leg")

        else:
            if state in (1, 9) and self.last_state != state:
                self.last_state = state
                if self.last_state == 1:
                    self.rep_count += 1
                    messages.append("Good rep")

        return ExerciseResult(reps=self.rep_count, messages=messages)
