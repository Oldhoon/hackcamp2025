import { useEffect, useRef, useState } from "react";
import { Timer } from "../components/Timer";
import { PostureMonitor } from "../components/PostureMonitor";
import { SessionStats } from "../components/SessionStats";
import { CameraPreview } from "../components/CameraPreview";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Play, Settings } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { startSession, stopSession, fetchSessionStatus } from "../lib/api";

const Index = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [focusMinutes, setFocusMinutes] = useState<string>("50");
  const [focusSeconds, setFocusSeconds] = useState<string>("00");
  const [breakMinutes, setBreakMinutes] = useState<string>("10");
  const [breakSeconds, setBreakSeconds] = useState<string>("00");
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("stats");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore parse errors
      }
    }
    return { completedSessions: 0, averagePosture: 0 };
  });
  const [isStartingSession, setIsStartingSession] = useState(false);
  const postureSumRef = useRef(0);
  const postureCountRef = useRef(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const landmarkStreamUrl =
    (import.meta.env.VITE_LANDMARK_STREAM_URL as string | undefined) ||
    `${window.location.protocol}//${window.location.hostname}:8000/session/preview`;

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

  useEffect(() => {
    const stored = localStorage.getItem("sessionHistory");
    if (stored) {
      setTimeout(() => {
        try {
          setHistory(JSON.parse(stored));
        } catch {
          setHistory([]);
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("stats", JSON.stringify(stats));
  }, [stats]);

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

  const handleSessionComplete = async () => {
    try {
      await stopSession();
    } catch (error) {
      console.error("Failed to stop backend session:", error);
    }
    const sessionAvg = postureCountRef.current
      ? Math.round(postureSumRef.current / postureCountRef.current)
      : stats.averagePosture;
    localStorage.setItem("lastPostureAverage", String(sessionAvg));

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

  const handleStartSession = async () => {
    const focusSecondsTotal = toSeconds(focusMinutes, focusSeconds, 50);
    const breakSecondsTotal = toSeconds(breakMinutes, breakSeconds, 10);
    const titleTrimmed = sessionTitle.trim();

    if (focusSecondsTotal < 1 || breakSecondsTotal < 1) {
      toast({
        title: "Invalid duration",
        description: "Durations must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    const currentConfig = {
      title: titleTrimmed || undefined,
      focus: formatMMSS(focusMinutes, focusSeconds, 50),
      break: formatMMSS(breakMinutes, breakSeconds, 10),
      startedAt: Date.now(),
    };
    localStorage.setItem("currentSessionConfig", JSON.stringify(currentConfig));
    localStorage.removeItem("lastPostureAverage");

    postureSumRef.current = 0;
    postureCountRef.current = 0;
    setStats((prev) => ({ ...prev, averagePosture: 0 }));

    setIsStartingSession(true);
    try {
      await startSession({ focus_seconds: focusSecondsTotal, break_seconds: breakSecondsTotal });
      setSessionStarted(true);
      toast({
        title: "Session started! 🎯",
        description: `${Math.round(focusSecondsTotal / 60)} min focus, then ${Math.round(breakSecondsTotal / 60)} min break`,
      });
    } catch (error) {
      console.error("Failed to start backend session:", error);
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
      console.error("Failed to stop backend session:", error);
    }
    setSessionStarted(false);
  };

  // Collect posture scores during an active focus session to compute average
  useEffect(() => {
    if (!sessionStarted) {
      postureSumRef.current = 0;
      postureCountRef.current = 0;
      setStats((prev) => ({ ...prev, averagePosture: 0 }));
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const status = await fetchSessionStatus();
        if (typeof status.posture_score === "number") {
          const val = status.posture_score <= 1 ? status.posture_score * 100 : status.posture_score;
          postureSumRef.current += val;
          postureCountRef.current += 1;
          const avg = Math.round(postureSumRef.current / postureCountRef.current);
          setStats((prev) => ({ ...prev, averagePosture: avg }));
        }
      } catch {
        // ignore polling errors
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [sessionStarted]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#e0f2ff,#f8fafc)" }}>
      <div className="container mx-auto" style={{ padding: "3rem 1rem" }}>
        <header className="text-center column" style={{ gap: "0.5rem", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "3.5rem", margin: 0, background: "linear-gradient(90deg,#2563eb,#22c55e)", WebkitBackgroundClip: "text", color: "transparent" }}>
            FocusFlow
          </h1>
        </header>

        {!sessionStarted ? (
          <div className="column" style={{ gap: "1.5rem", maxWidth: "980px", margin: "0 auto" }}>
            <Card className="setup-card">
              <div className="text-center column" style={{ gap: "0.35rem", marginBottom: "1rem" }}>
                <h2 className="setup-title">Setup Your Session</h2>
                <p className="muted">Customize your Pomodoro timer to fit your workflow</p>
              </div>

              <div className="column" style={{ gap: "0.75rem" }}>
                <div className="column" style={{ gap: "0.25rem" }}>
                  <label className="small emphasis">Session Title (optional)</label>
                  <Input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="e.g., Handling Emails"
                  />
                </div>
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

              <Button onClick={handleStartSession} size="lg" className="w-full primary-cta" disabled={isStartingSession}>
                <Play className="icon-left" /> Start Focus Session
              </Button>
            </Card>

            <SessionStats {...stats} />

            <Card className="column" style={{ gap: "0.75rem" }}>
              <h3 className="emphasis" style={{ margin: 0 }}>Recent Sessions</h3>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("sessionHistory");
                  }}
                >
                  Clear History
                </Button>
              </div>
              {history.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>No session history yet.</p>
              ) : (
                <div className="column" style={{ gap: "0.5rem" }}>
                  {history.slice(-5).reverse().map((item, idx) => (
                    <div
                      key={idx}
                      className="row space-between"
                      style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "0.4rem" }}
                    >
                      <div className="column" style={{ gap: "0.15rem" }}>
                        <span className="small emphasis">{(item.title as string) || "Session"}</span>
                        <span className="muted small">
                          Focus {item.focus as string || "-"} / Break {item.break as string || "-"}
                        </span>
                        {item.postureAverage !== undefined && (
                          <span className="muted small">Posture Avg: {item.postureAverage}%</span>
                        )}
                      </div>
                      <div className="column" style={{ textAlign: "right", gap: "0.15rem" }}>
                        <span className="emphasis">{item.reps ?? 0} reps</span>
                        <span className="muted small">
                          {item.timestamp ? new Date(item.timestamp as number).toLocaleTimeString() : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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
              <div className="column" style={{ gap: "1rem" }}>
                <CameraPreview active={sessionStarted} streamUrl={landmarkStreamUrl} />
                <PostureMonitor />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
