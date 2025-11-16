import { useEffect, useState } from "react";

interface TimerProps {
  sessionType: "focus" | "break";
  onSessionComplete: () => void;
}

export const Timer = ({ sessionType, onSessionComplete }: TimerProps) => {
  const initialTime = sessionType === "focus" ? 1 * 60 : 10 * 60;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
  }, [sessionType, initialTime]);

  useEffect(() => {
    const interval = isRunning
      ? setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              onSessionComplete();
              return 0;
            }
            return prev - 1;
          });
        }, 1000)
      : undefined;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onSessionComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const label = sessionType === "focus" ? "Focus Session" : "Active Break";

  return (
    <div className="card column gap">
      <div className="row space-between align-center">
        <div>
          <p className="muted small">Mode</p>
          <strong>{label}</strong>
        </div>
        <div className="row gap">
          <button onClick={() => setIsRunning((v) => !v)} className="btn">
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={() => { setTimeLeft(initialTime); setIsRunning(false); }} className="btn secondary">
            Reset
          </button>
        </div>
      </div>

      <div className="timer-display">
        <span>{String(minutes).padStart(2, "0")}</span>
        <span className="muted">:</span>
        <span>{String(seconds).padStart(2, "0")}</span>
      </div>
      <p className="muted small">
        {timeLeft === initialTime && "Ready to start"}
        {isRunning && "Stay focused!"}
        {!isRunning && timeLeft !== initialTime && timeLeft > 0 && "Paused"}
        {timeLeft === 0 && "Complete!"}
      </p>
    </div>
  );
};
