import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Activity, CheckCircle2, Clock, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Timer } from "../components/Timer";
import { fetchExerciseResults, fetchSessionStatus } from "../lib/api";

type ExerciseType = "squats" | "pushups" | "situps" | string;

interface ExerciseResultsResponse {
  exerciseType?: ExerciseType;
  exercise_type?: ExerciseType;
  count: number;
  goal: number;
  duration: number | string;
  completed: boolean;
}

const formatDuration = (duration: number | string) => {
  if (typeof duration === "string") return duration;
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  return `${mins}m ${secs}s`;
};

const Break = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const breakDuration = searchParams.get("duration") || "10";

  const [breakComplete, setBreakComplete] = useState(false);
  const [results, setResults] = useState<ExerciseResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveReps, setLiveReps] = useState(0);

  const handleBreakComplete = async () => {
    setBreakComplete(true);
    setLoading(true);
    try {
      const data = await fetchExerciseResults();
      setResults(data as unknown as ExerciseResultsResponse);
      persistHistory(data as unknown as ExerciseResultsResponse);
    } catch (error) {
      console.error("Failed to fetch exercise results:", error);
      const parsedDuration = (() => {
        if (/^\d+:\d{1,2}$/.test(breakDuration.trim())) {
          const [m, s] = breakDuration.trim().split(":").map(Number);
          return m * 60 + s;
        }
        const num = Number(breakDuration);
        return Number.isNaN(num) ? 10 * 60 : num * 60;
      })();

      setResults({
        exercise_type: "squats",
        count: liveReps,
        goal: 20,
        duration: parsedDuration,
        completed: liveReps >= 20,
      });
      persistHistory({
        exerciseType: "squats",
        count: liveReps,
        goal: 20,
        duration: parsedDuration,
        completed: liveReps >= 20,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: number | undefined;
    if (!breakComplete) {
      interval = window.setInterval(async () => {
        try {
          const status = await fetchSessionStatus();
          if (typeof status.reps === "number") setLiveReps(status.reps);
        } catch (err) {
          console.warn("Session status fetch failed", err);
        }
      }, 2000);
    }
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [breakComplete]);

  if (loading) {
    return (
      <div className="min-h-screen flex align-center" style={{ justifyContent: "center", background: "linear-gradient(135deg,#fff7ed,#f9fafb)" }}>
        <div className="column" style={{ gap: "1rem", textAlign: "center" }}>
          <div className="spinner" />
          <p className="emphasis">Loading results...</p>
        </div>
      </div>
    );
  }

  const exerciseType = results?.exerciseType || results?.exercise_type || "exercise";
  const countValue = results?.count ?? liveReps;
  const progress = results ? Math.min((countValue / results.goal) * 100, 100) : 0;

  const persistHistory = (entry: ExerciseResultsResponse) => {
    const stored = localStorage.getItem("sessionHistory");
    let parsed: Array<Record<string, unknown>> = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch {
        parsed = [];
      }
    }

    let config: Record<string, unknown> = {};
    const cfg = localStorage.getItem("currentSessionConfig");
    if (cfg) {
      try {
        config = JSON.parse(cfg);
      } catch {
        config = {};
      }
    }

    parsed.push({
      ...config,
      title: config.title || undefined,
      exerciseType: exerciseType || "exercise",
      reps: entry.count,
      goal: entry.goal,
      duration: entry.duration,
      completed: entry.completed,
      timestamp: Date.now(),
    });

    localStorage.setItem("sessionHistory", JSON.stringify(parsed));
  };
  const goHomeAndIncrement = () => {
    localStorage.setItem("completedSessionsIncrement", "1");
    navigate("/");
  };

  if (!breakComplete) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#fff7ed,#f8fafc)" }}>
        <div className="container" style={{ padding: "3rem 1rem" }}>
          <header className="text-center column" style={{ gap: "0.5rem", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "3rem", margin: 0, color: "#f97316" }}>Active Break</h1>
            <p className="muted">Time to move and energize! 💪</p>
          </header>

          <div style={{ maxWidth: "900px", margin: "0 auto 2rem" }}>
            <Timer sessionType="break" duration={breakDuration} onSessionComplete={handleBreakComplete} />
            <p className="muted small" style={{ textAlign: "center", marginTop: "0.5rem" }}>
              Live reps recorded: {liveReps}
            </p>
          </div>

          <Card
            className="column"
            style={{
              gap: "1.5rem",
              padding: "2rem",
              maxWidth: "900px",
              margin: "0 auto",
              background: "linear-gradient(135deg,#fff,#fdf2e9)",
              border: "2px solid #fcd34d55",
            }}
          >
            <h2 className="emphasis" style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <Activity /> Exercise Instructions
            </h2>
            <div className="row" style={{ gap: "1rem", flexWrap: "wrap" }}>
              {[
                { icon: "🦵", title: "Squats", desc: "Lower body strength and endurance" },
                { icon: "💪", title: "Push-ups", desc: "Upper body and core strength" },
                { icon: "🏋️", title: "Sit-ups", desc: "Core strength and stability" },
              ].map((item) => (
                <Card
                  key={item.title}
                  className="column"
                  style={{
                    flex: "1 1 200px",
                    alignItems: "center",
                    padding: "1rem",
                    gap: "0.5rem",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "2rem" }}>{item.icon}</div>
                  <strong>{item.title}</strong>
                  <p className="muted small" style={{ textAlign: "center" }}>
                    {item.desc}
                  </p>
                </Card>
              ))}
            </div>
            <p className="muted small" style={{ textAlign: "center", margin: 0 }}>
              Your webcam is tracking your exercise count automatically. Keep going until the timer ends!
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="min-h-screen flex align-center" style={{ justifyContent: "center", padding: "3rem 1rem", background: "linear-gradient(135deg,#fff7ed,#f8fafc)" }}>
      <Card
        className="column"
        style={{
          gap: "1.5rem",
          maxWidth: "700px",
          width: "100%",
          padding: "2.5rem",
          border: "2px solid #f97316",
          boxShadow: "0 18px 50px rgba(249,115,22,0.15)",
          background: "linear-gradient(180deg,#fff,#fdf2e9)",
        }}
      >
        <div className="text-center column" style={{ gap: "0.4rem" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#f97316,#fb923c)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto",
              boxShadow: "0 12px 30px rgba(249,115,22,0.3)",
            }}
          >
            <Activity color="#fff" size={32} />
          </div>
          <h1 style={{ margin: 0 }}>Active Break Complete!</h1>
          <p className="muted">Great job on your exercise session</p>
        </div>

        <div
          className="column"
          style={{
            gap: "0.75rem",
            padding: "1.5rem",
            borderRadius: "16px",
            background: "linear-gradient(135deg,#fff,#fff7ed)",
            border: "1px solid #fde68a",
          }}
        >
          <p className="small muted" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", color: "#f97316" }}>
            {String(exerciseType).toUpperCase()}
          </p>
          <div className="row align-center" style={{ gap: "0.5rem" }}>
            <span style={{ fontSize: "3rem", fontWeight: 800, color: "#f97316" }}>{countValue}</span>
            <span className="muted" style={{ fontSize: "1.5rem" }}>/ {results.goal}</span>
          </div>
          <div className="row align-center" style={{ gap: "0.5rem", color: "#475467" }}>
            <Clock size={16} />
            <span className="small">Duration: {formatDuration(results.duration)}</span>
          </div>
        </div>

        <div className="column" style={{ gap: "0.5rem" }}>
          <div className="row space-between small">
            <span className="muted">Progress</span>
            <span className="emphasis">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-4" />
        </div>

        <div
          className="row"
          style={{
            gap: "1rem",
            alignItems: "flex-start",
            padding: "1rem",
            borderRadius: "14px",
            background: results.completed ? "#ecfdf3" : "#fff7ed",
            border: results.completed ? "1px solid #bbf7d0" : "1px solid #fed7aa",
          }}
        >
          {results.completed ? <CheckCircle2 color="#22c55e" /> : <TrendingUp color="#f97316" />}
          <div className="column" style={{ gap: "0.25rem" }}>
            <p className="emphasis" style={{ margin: 0 }}>
              {results.completed ? "Goal Achieved! 🎉" : "Keep it up!"}
            </p>
            <p className="muted small" style={{ margin: 0 }}>
              {results.completed
                ? "You've completed your exercise goal for this break. Your body thanks you!"
                : `You're ${Math.max(results.goal - results.count, 0)} reps away from your goal. Every rep counts!`}
            </p>
          </div>
        </div>

        <Button onClick={goHomeAndIncrement} size="lg" className="w-full">
          <RefreshCw className="icon-left" /> Start New Focus Session
        </Button>
      </Card>
    </div>
  );
};

export default Break;
