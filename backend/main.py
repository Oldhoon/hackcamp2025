# main.py
import sys
import time
import cv2
from exercise_counter import SquatCounter
from pose_pipeline import PosePipeline


try:
    import winsound

    def play_rep_sound():
        winsound.Beep(880, 150)

except ImportError:

    def play_rep_sound():
        print("\a", end="")


def main():
    if len(sys.argv) > 1:
        print("This script does not take any arguments")

    pipeline = PosePipeline()
    counter = SquatCounter()
    last_reps = -1
    last_log_time = 0.0
    log_interval = 0.5  # seconds between passive updates

    window_name = "posture detector"

    while True:
        frame, landmarks = pipeline.read()
        if frame is None:
            break

        if landmarks is None:
            print("Please step into frame")
        else:
            exercise_result = counter.update(landmarks)
            now = time.time()
            should_log = (
                exercise_result.messages
                or exercise_result.reps != last_reps
                or now - last_log_time >= log_interval
            )
            if should_log:
                if exercise_result.reps > last_reps:
                    play_rep_sound()
                for msg in exercise_result.messages:
                    print(msg)
                print(f"Squats: {exercise_result.reps}")
                last_reps = exercise_result.reps
                last_log_time = now

        cv2.imshow(window_name, frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break

    pipeline.release()


if __name__ == "__main__":
    main()
