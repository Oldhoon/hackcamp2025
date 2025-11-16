import { useNavigate } from "react-router-dom";
import { ExerciseCounter } from "../components/ExerciseCounter";
import { Timer } from "../components/Timer";

const Break = () => {
  const navigate = useNavigate();

  const handleBreakComplete = () => {
    navigate("/");
  };

  return (
    <div className="page break-page">
      <header className="break-header">
        <div className="layout row space-between align-center">
          <div className="row gap align-center">
            <button className="btn ghost" onClick={() => navigate("/")}>
              ← Back to Focus
            </button>
            <div>
              <h1>Active Break Time</h1>
              <p className="muted">Move your body, refresh your mind</p>
            </div>
          </div>
          <div className="align-right">
            <p className="muted small">Current Mode</p>
            <p className="emphasis">🏃 Active Break</p>
          </div>
        </div>
      </header>

      <main className="layout column gap">
        <div className="split">
          <div className="break-timer-card">
            <div className="badge badge-break">🏃 Active Break</div>
            <Timer sessionType="break" onSessionComplete={handleBreakComplete} />
          </div>
          <div className="break-counter-card">
            <ExerciseCounter />
          </div>
        </div>

        <div className="panel instructions">
          <h3 className="row gap align-center"><span>💪</span> Exercise Instructions</h3>
          <p className="muted small">
            Choose an exercise above and start moving! The camera will automatically track your repetitions.
          </p>
          <ul className="muted small">
            <li><strong>Squats:</strong> Stand with feet shoulder-width apart, lower your hips back and down.</li>
            <li><strong>Push-ups:</strong> Keep your body straight, lower chest to ground, push back up.</li>
            <li><strong>Sit-ups:</strong> Lie on your back, lift your upper body toward your knees.</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Break;
