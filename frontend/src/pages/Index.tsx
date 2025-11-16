import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExerciseCounter } from "../components/ExerciseCounter";
import { SessionStats } from "../components/SessionStats";
import { Timer } from "../components/Timer";

const Index = () => {
  const navigate = useNavigate();
  const [sessionType, setSessionType] = useState<"focus" | "break">("focus");
  const [stats, setStats] = useState({
    completedSessions: 0,
    totalExercises: 0,
    averagePosture: 85,
  });

  const handleSessionComplete = () => {
    if (sessionType === "focus") {
      setStats((prev) => ({
        ...prev,
        completedSessions: prev.completedSessions + 1,
      }));
      setSessionType("break");
      navigate("/break");
    } else {
      setSessionType("focus");
    }
  };

  return (
    <div className="page">
      <header className="top-bar">
        <div className="layout row space-between">
          <div>
            <h1>HackCamp 2025</h1>
            <p className="muted"> yuh </p>
          </div>
          <div className="align-right">
            <p className="muted small">Current Mode</p>
            <p className="emphasis">
              {sessionType === "focus" ? "Focus" : "Active Break"}
            </p>
          </div>
        </div>
      </header>

      <main className="layout column gap">
        <SessionStats {...stats} />

        <div className="split">
          <Timer sessionType={sessionType} onSessionComplete={handleSessionComplete} />
          <ExerciseCounter />
        </div>
     </main>

    </div>
  );
};

export default Index;
