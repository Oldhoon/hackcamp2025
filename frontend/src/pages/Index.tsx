import { useState } from "react";
import { Timer } from "../components/Timer";
import { PostureMonitor } from "../components/PostureMonitor";
import { SessionStats } from "../components/SessionStats";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Play, Settings } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { startSession, stopSession } from "../lib/api";

const Index = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [focusDuration, setFocusDuration] = useState<string>("50");
  const [breakDuration, setBreakDuration] = useState<string>("10");
  const [stats, setStats] = useState({
    completedSessions: 0,
    totalExercises: 0,
    averagePosture: 85,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSessionComplete = async () => {
    try {
      await stopSession();
    } catch (error) {
      console.error("Failed to stop posture session:", error);
    }
    setStats((prev) => ({
      ...prev,
      completedSessions: prev.completedSessions + 1,
    }));
    toast({
      title: "Focus session complete! 🎉",
      description: "Time for an active break!",
    });
    navigate(`/break?duration=${Number(breakDuration) || 10}`);
  };

  const handleStartSession = async () => {
    const focusVal = Number(focusDuration);
    const breakVal = Number(breakDuration);
    if (!focusDuration || focusVal < 1 || !breakDuration || breakVal < 1) {
      toast({
        title: "Invalid duration",
        description: "Both durations must be at least 1 minute",
        variant: "destructive",
      });
      return;
    }
    setIsStartingSession(true);
    try {
      await startSession({
        focus_seconds: focusVal * 60,
        break_seconds: breakVal * 60,
      });
      setSessionStarted(true);
      toast({
        title: "Session started! 🎯",
        description: `${focusVal} min focus, then ${breakVal} min break`,
      });
    } catch (error) {
      console.error("Failed to start posture session:", error);
      toast({
        title: "Unable to start session",
        description: "Make sure the backend server is running.",
        variant: "destructive",
      });
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleReconfigure = async () => {
    try {
      await stopSession();
    } catch (error) {
      console.error("Failed to stop posture session:", error);
    }
    setSessionStarted(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#e0f2ff,#f8fafc)" }}>
      <div className="container mx-auto" style={{ padding: "3rem 1rem" }}>
        <header className="text-center column" style={{ gap: "0.5rem", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "3.5rem", margin: 0, background: "linear-gradient(90deg,#2563eb,#22c55e)", WebkitBackgroundClip: "text", color: "transparent" }}>
            FocusFlow
          </h1>
          {!sessionStarted ? (
            <p className="muted">Configure your productivity session</p>
          ) : (
            <p className="muted">
              Current mode: <span className="emphasis" style={{ color: "#2563eb" }}>Focus Session</span>
            </p>
          )}
        </header>

        {!sessionStarted ? (
          <div className="column" style={{ gap: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
            <Card className="column" style={{ gap: "1.5rem", padding: "2rem", boxShadow: "0 18px 40px rgba(37,99,235,0.1)" }}>
              <div className="text-center column" style={{ gap: "0.5rem" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#2563eb,#60a5fa)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto",
                    boxShadow: "0 12px 30px rgba(37,99,235,0.3)",
                  }}
                >
                  <Settings color="#fff" size={32} />
                </div>
                <h2 style={{ margin: 0 }}>Setup Your Session</h2>
                <p className="muted">Customize your Pomodoro timer to fit your workflow</p>
              </div>

              <div className="column" style={{ gap: "1rem" }}>
                <div className="column" style={{ gap: "0.25rem" }}>
                  <label className="small emphasis">Focus Time (minutes)</label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(e.target.value)}
                  />
                  <p className="muted small">Recommended: 25-50 minutes for optimal focus</p>
                </div>
                <div className="column" style={{ gap: "0.25rem" }}>
                  <label className="small emphasis">Active Break (minutes)</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(e.target.value)}
                  />
                  <p className="muted small">Recommended: 5-15 minutes for exercise and movement</p>
                </div>
              </div>

              <Button onClick={handleStartSession} size="lg" className="w-full" disabled={isStartingSession}>
                <Play className="icon-left" /> Start Focus Session
              </Button>
            </Card>

            <SessionStats {...stats} />
          </div>
        ) : (
          <div className="column" style={{ gap: "1.5rem" }}>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <Button onClick={handleReconfigure} variant="outline" size="sm">
                <Settings className="icon-left" /> Reconfigure
              </Button>
            </div>

            <SessionStats {...stats} />

            <div className="split">
              <Timer sessionType="focus" duration={Number(focusDuration)} onSessionComplete={handleSessionComplete} />
              <PostureMonitor />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
