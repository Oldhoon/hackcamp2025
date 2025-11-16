/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface TimerProps {
  sessionType: "focus" | "break";
  duration?: number | string; // minutes
  onSessionComplete: () => void;
}

export const Timer = ({ sessionType, duration, onSessionComplete }: TimerProps) => {
  const defaultDuration = sessionType === "focus" ? 50 : 10;
  const parsedDuration = typeof duration === "string" ? Number(duration) : duration;
  const initialTime = (parsedDuration || defaultDuration) * 60;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
  }, [sessionType, initialTime]);

  useEffect(() => {
    const interval: number | undefined = isRunning
      ? window.setInterval(() => {
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
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [isRunning, onSessionComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((initialTime - timeLeft) / initialTime) * 100;
  const isBreak = sessionType === "break";

  const gradient = isBreak
    ? "linear-gradient(135deg, #fff7ed, #fef3c7)"
    : "linear-gradient(135deg, #e0f2ff, #eff6ff)";

  return (
    <Card
      className="timer-shell"
      style={{
        padding: "2.5rem",
        position: "relative",
        overflow: "hidden",
        background: gradient,
        border: `2px solid ${isBreak ? "#f97316" : "#2563eb"}`,
        boxShadow: isBreak
          ? "0 12px 40px rgba(249,115,22,0.2)"
          : "0 12px 40px rgba(37,99,235,0.2)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          background: isBreak
            ? "radial-gradient(circle at 50% 120%, rgba(249,115,22,0.15), transparent 65%)"
            : "radial-gradient(circle at 50% 120%, rgba(37,99,235,0.15), transparent 65%)",
        }}
      />

      <div className="column" style={{ gap: "1.5rem", position: "relative" }}>
        <div className="text-center column" style={{ gap: "0.5rem" }}>
          <div
            className="pill selectable active"
            style={{
              borderColor: isBreak ? "#f97316" : "#2563eb",
              color: isBreak ? "#c2410c" : "#1d4ed8",
              alignSelf: "center",
            }}
          >
            {isBreak ? "⚡ Active Break" : "🎯 Focus Session"}
          </div>
          <p className="muted">
            {isBreak ? "Time to move and energize!" : "Stay focused and maintain good posture"}
          </p>
        </div>

        <div className="column" style={{ gap: "1rem", alignItems: "center" }}>
          <div className="timer-display" style={{ color: isBreak ? "#f97316" : "#2563eb" }}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          {isRunning && (
            <div
              style={{
                width: "180px",
                height: "180px",
                position: "absolute",
                filter: "blur(55px)",
                background: isBreak ? "#fb923c55" : "#60a5fa55",
                zIndex: -1,
              }}
            />
          )}

          <div className="column" style={{ gap: "0.35rem", width: "100%" }}>
            <div className="row space-between" style={{ fontSize: "0.9rem" }}>
              <span className="muted">Progress</span>
              <span className="muted">{progress.toFixed(0)}%</span>
            </div>
            <div className="progress" style={{ height: "14px" }}>
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: isBreak ? "linear-gradient(90deg,#fb923c,#f97316)" : "linear-gradient(90deg,#60a5fa,#2563eb)",
                }}
              />
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: "0.75rem" }}>
          <Button
            onClick={() => setIsRunning((v) => !v)}
            size="lg"
            variant={isRunning ? "secondary" : "default"}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Pause className="icon-left" />
                Pause
              </>
            ) : (
              <>
                <Play className="icon-left" />
                Start
              </>
            )}
          </Button>
          <Button onClick={() => { setTimeLeft(initialTime); setIsRunning(false); }} size="lg" variant="outline">
            <RotateCcw />
          </Button>
        </div>

        <div className="text-center muted small">
          {isRunning ? "Timer is running..." : "Click start to begin"}
        </div>
      </div>
    </Card>
  );
};
