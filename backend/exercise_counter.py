# Exercise counting and tracking
import sys
import mediapipe as mp
import cv2
import numpy as np


def findAngle(a, b, c, minVis=0.8):
    # Finds the angle at b with endpoints a and c
    # Returns -1 if below minimum visibility threshold
    # Takes lm_arr elements

    if a.visibility > minVis and b.visibility > minVis and c.visibility > minVis:
        bc = np.array([c.x - b.x, c.y - b.y, c.z - b.z])
        ba = np.array([a.x - b.x, a.y - b.y, a.z - b.z])

        angle = np.arccos((np.dot(ba, bc)) / (np.linalg.norm(ba)
                                              * np.linalg.norm(bc))) * (180 / np.pi)

        if angle > 180:
            return 360 - angle
        else:
            return angle
    else:
        return -1


def legState(angle):
    if angle < 0:
        return 0
    elif angle < 105:
        return 1 # squat range
    elif angle < 150:
        return 2 # transition
    else:
        return 3 # upright

if __name__ == "__main__":
    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose

    if len(sys.argv) > 1:
        print("does not take in any args")

    cap = cv2.VideoCapture(0)
    while cap.read()[1] is None:
        print("Waiting for video")

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        repCount = 0
        lastState = 9

        while cap.isOpened():
            ret, frame = cap.read()
            if frame is None:
                print('Error: image not found')
            else:
                frame = cv2.resize(frame, (1024, 600))

            if ret == True:
                try:
                    # Convert frame to RGB
                    # Writeable = False forces pass by ref (faster)
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame.flags.writeable = False

                    # Detect Pose Landmarks
                    # lm used for drawing
                    # lm_arr is actually indexable with .x, .y, .z attr
                    lm = pose.process(frame).pose_landmarks
                    lm_arr = lm.landmark
                except:
                    print("Please Step Into Frame")
                    cv2.imshow("Squat Rep Counter", frame)
                    cv2.waitKey(1)
                    continue

                # Allow write, convert back to BGR
                frame.flags.writeable = True
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

                # Draw overlay with parameters:
                # (frame, landmarks, list of connected landmarks, landmark draw spec, connection draw spec)
                mp_drawing.draw_landmarks(frame, lm, mp_pose.POSE_CONNECTIONS, mp_drawing.DrawingSpec(color=(
                    0, 255, 0), thickness=2, circle_radius=2),
                                          mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2))

                # Calculate Angle
                # Hip -Knee-Foot Indices:
                # R: 24, 26, 28
                # L: 23, 25, 27
                rAngle = findAngle(lm_arr[24], lm_arr[26], lm_arr[28])
                lAngle = findAngle(lm_arr[23], lm_arr[25], lm_arr[27])

                # Calculate state
                rState = legState(rAngle)
                lState = legState(lAngle)
                state = rState * lState

                # Final state is product of two leg states
                # 0 -> One or both legs not being picked up
                # Even -> One or both legs are still transitioning
                # Odd
                #   1 -> Squatting
                #   9 -> Upright
                #   3 -> One squatting, one upright

                # Only update lastState on 1 or 9

                if state == 0:  # One or both legs not detected
                    if rState == 0:
                        print("Right Leg Not Detected")
                    if lState == 0:
                        print("Left Leg Not Detected")
                elif state % 2 == 0 or rState != lState:  # One or both legs still transitioning
                    if lastState == 1:
                        if lState == 2 or lState == 1:
                            print("Fully extend left leg")
                        if rState == 2 or lState == 1:
                            print("Fully extend right leg")
                    else:
                        if lState == 2 or lState == 3:
                            print("Fully retract left leg")
                        if rState == 2 or lState == 3:
                            print("Fully retract right leg")
                else:
                    if state == 1 or state == 9:
                        if lastState != state:
                            lastState = state
                            if lastState == 1:
                                print("GOOD!")
                                repCount += 1
                print("Squats: " + (str)(repCount))

                cv2.imshow("Squat Rep Counter", frame)
                if cv2.waitKey(1) & 0xFF == 27:
                    break
