# main.py
import sys
import cv2
from exercise_counter import SquatCounter
from pose_pipeline import PosePipeline


def main():
    if len(sys.argv) > 1:
        print("This script does not take any arguments")

    pipeline = PosePipeline()
    counter = SquatCounter()

    window_name = "posture detector"

    while True:
        frame, landmarks = pipeline.read()
        if frame is None:
            break

        if landmarks is None:
            print("Please step into frame")
        else:
            exercise_result = counter.update(landmarks)
            for msg in exercise_result.messages:
                print(msg)
            print(f"Squats: {exercise_result.reps}")

        cv2.imshow(window_name, frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break

    pipeline.release()


if __name__ == "__main__":
    main()