import { useEffect, useState } from "react";

const EXERCISES = [
  { label: "Squats", icon: "🏋️", target: 20 },
  { label: "Push-ups", icon: "💪", target: 20 },
  { label: "Sit-ups", icon: "🔥", target: 20 },
];

export const ExerciseCounter = () => {
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState(EXERCISES[0]);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        // Replace with your backend call:
        // const response = await fetch('/api/exercise');
        // const data = await response.json();
        // setCount(data.count);
      } catch (error) {
        console.error("Failed to fetch exercise data:", error);
      }
    };

    const interval = setInterval(fetchExercise, 2000);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.min((count / selected.target) * 100, 100);

  return (
    <div className="card column gap">
      <div className="row space-between align-center">
        <h3>Exercise Counter</h3>
        <span className="pill neutral">{selected.label}</span>
      </div>

      <div className="row gap">
        {EXERCISES.map((ex) => (
          <button
            key={ex.label}
            className={`pill selectable ${selected.label === ex.label ? "active" : ""}`}
            onClick={() => { setSelected(ex); setCount(0); }}
          >
            <span>{ex.icon}</span> {ex.label}
          </button>
        ))}
      </div>

      <div className="row align-center gap">
        <span className="big-number accent">{count}</span>
        <span className="muted">/ {selected.target}</span>
      </div>
      <p className="muted small">{" "}{Math.max(selected.target - count, 0)} more to go!</p>

      <div className="progress">
        <div className="progress-fill good" style={{ width: `${progress}%` }} />
      </div>

      <div className="notice">
        <span role="img" aria-label="camera">📷</span> Camera is tracking your {selected.label.toLowerCase()}
      </div>
    </div>
  );
};
