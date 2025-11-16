import { useEffect, useState } from "react";
import { Timer } from "../components/Timer";
import { PostureMonitor } from "../components/PostureMonitor";
import { SessionStats } from "../components/SessionStats";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Play, Settings } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState<string>("50");
  const [focusSeconds, setFocusSeconds] = useState<string>("00");
  const [breakMinutes, setBreakMinutes] = useState<string>("10");
  const [breakSeconds, setBreakSeconds] = useState<string>("00");
  const [stats, setStats] = useState({
    completedSessions: 0,
    totalExercises: 0,
    averagePosture: 85,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const queued = Number(localStorage.getItem("completedSessionsIncrement") || "0");
    if (queued > 0) {
      setTimeout(() => {
        setStats((prev) => ({
          ...prev,
          completedSessions: prev.completedSessions + queued,
        }));
        localStorage.removeItem("completedSessionsIncrement");
      }, 0);
    }
  }, []);

  const toSeconds = (mins: string, secs: string, fallbackMinutes: number) => {
    const m = Number(mins);
    const s = Number(secs);
    const validM = Number.isNaN(m) ? fallbackMinutes : m;
    const validS = Number.isNaN(s) ? 0 : s;
    return validM * 60 + Math.min(Math.max(validS, 0), 59);
  };

  const formatMMSS = (mins: string, secs: string, fallbackMinutes: number) => {
    const m = Number.isNaN(Number(mins)) ? fallbackMinutes : Math.max(Number(mins), 0);
    const s = Number.isNaN(Number(secs)) ? 0 : Math.min(Math.max(Number(secs), 0), 59);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSessionComplete = () => {
    setStats((prev) => ({
      ...prev,
      completedSessions: prev.completedSessions + 1,
    }));
    toast({
      title: "Focus session complete! 🎉",
      description: "Time for an active break!",
    });
    const breakParam = formatMMSS(breakMinutes, breakSeconds, 10);
    navigate(`/break?duration=${encodeURIComponent(breakParam)}`);
  };

  const handleStartSession = () => {
    const focusSecondsTotal = toSeconds(focusMinutes, focusSeconds, 50);
    const breakSecondsTotal = toSeconds(breakMinutes, breakSeconds, 10);

    if (focusSecondsTotal < 1 || breakSecondsTotal < 1) {
      toast({
        title: "Invalid duration",
        description: "Durations must be greater than zero",
        variant: "destructive",
      });
      return;
    }
    setSessionStarted(true);
    toast({
      title: "Session started! 🎯",
      description: `${Math.round(focusSecondsTotal / 60)} min focus, then ${Math.round(breakSecondsTotal / 60)} min break`,
    });
  };

  const handleReconfigure = () => {
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
          <div className="column" style={{ gap: "1.5rem", maxWidth: "980px", margin: "0 auto" }}>
            <Card className="setup-card">
              <div className="setup-badge">
                <Settings color="#fff" size={28} />
              </div>
              <div className="text-center column" style={{ gap: "0.35rem", marginBottom: "1rem" }}>
                <h2 className="setup-title">Setup Your Session</h2>
                <p className="muted">Customize your Pomodoro timer to fit your workflow</p>
              </div>

              <div className="grid two-cols">
                <div className="column" style={{ gap: "0.35rem" }}>
                  <label className="small emphasis">Focus Time</label>
                  <div className="row time-inputs">
                    <Input
                      type="text"
                      value={focusMinutes}
                      onChange={(e) => setFocusMinutes(e.target.value)}
                      placeholder="MM"
                    />
                    <span className="emphasis">:</span>
                    <Input
                      type="text"
                      value={focusSeconds}
                      onChange={(e) => setFocusSeconds(e.target.value)}
                      placeholder="SS"
                    />
                  </div>
                  <p className="muted small">Enter minutes and seconds (e.g., 25 : 30)</p>
                </div>

                <div className="column" style={{ gap: "0.35rem" }}>
                  <label className="small emphasis">Active Break</label>
                  <div className="row time-inputs">
                    <Input
                      type="text"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(e.target.value)}
                      placeholder="MM"
                    />
                    <span className="emphasis">:</span>
                    <Input
                      type="text"
                      value={breakSeconds}
                      onChange={(e) => setBreakSeconds(e.target.value)}
                      placeholder="SS"
                    />
                  </div>
                  <p className="muted small">Enter minutes and seconds (e.g., 10 : 30)</p>
                </div>
              </div>

              <Button onClick={handleStartSession} size="lg" className="w-full primary-cta">
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
              <Timer
                sessionType="focus"
                duration={formatMMSS(focusMinutes, focusSeconds, 50)}
                onSessionComplete={handleSessionComplete}
              />
              <PostureMonitor />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
