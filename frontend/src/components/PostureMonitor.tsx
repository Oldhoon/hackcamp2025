import { useEffect, useMemo, useState } from "react";
import { fetchSessionStatus } from "../lib/api";
import type { SessionStatus } from "../lib/api";
import { Card } from "./ui/card";

const POLL_INTERVAL_MS = 2000;

const labelCopy = {
  good: { title: "✨ good", message: "Excellent posture!" },
  caution: { title: "⚠️ adjust", message: "Let's straighten up a bit." },
  bad: { title: "🙌 reset", message: "Time for a posture reset." },
};

export const PostureMonitor = () => {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let interval: number;

    const poll = async () => {
      try {
        const controller = new AbortController();
        const data = await fetchSessionStatus(controller.signal);
        if (mounted) {
          setStatus(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError("Unable to reach posture tracker");
        }
      }
    };

    poll();
    interval = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const { scoreOutOf100, badge } = useMemo(() => {
    const raw = status?.posture_score ?? 0;
    const normalized = Math.round(raw * 100);
    let badge: keyof typeof labelCopy = "bad";
    if (normalized >= 75) {
      badge = "good";
    } else if (normalized >= 40) {
      badge = "caution";
    }
    return { scoreOutOf100: normalized, badge };
  }, [status?.posture_score]);

  const isActive = Boolean(status?.running && status?.mode === "focus");

  return (
    <Card
      className="column"
      style={{
        gap: "1.25rem",
        padding: "2rem",
        background: "linear-gradient(180deg,#f0fdf4,#ecfeff)",
        border: "1px solid #bbf7d0",
        boxShadow: "0 18px 45px rgba(34,197,94,0.15)",
      }}
    >
      <div className="row space-between align-center">
        <div>
          <p className="muted small" style={{ letterSpacing: "0.08em" }}>
            LIVE STATUS
          </p>
          <h3 style={{ margin: 0 }}>Posture Monitor</h3>
        </div>
        <span
          className="pill"
          style={{
            textTransform: "uppercase",
            fontSize: "0.75rem",
            background: "#ecfccb",
            color: "#166534",
          }}
        >
          {labelCopy[badge].title}
        </span>
      </div>

      <div className="column align-center" style={{ gap: "0.5rem" }}>
        <span
          style={{
            fontSize: "4rem",
            fontWeight: 800,
            color: "#16a34a",
            lineHeight: 1,
          }}
        >
          {isActive ? scoreOutOf100 : "--"}
        </span>
        <p className="muted" style={{ margin: 0, letterSpacing: "0.08em" }}>
          POSTURE SCORE
        </p>
        <div
          className="card"
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "12px",
            textAlign: "center",
            background: "#fff",
            border: "1px solid #dcfce7",
          }}
        >
          <strong>{error ? error : labelCopy[badge].message}</strong>
        </div>
      </div>

      <div className="column" style={{ gap: "0.75rem" }}>
        <p className="small muted" style={{ letterSpacing: "0.1em" }}>
          QUICK TIPS
        </p>
        {[
          "Keep your back straight",
          "Relax shoulders down and back",
          "Align screen at eye level",
          "Keep both feet planted",
        ].map((tip) => (
          <div key={tip} className="row" style={{ alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "#22c55e" }}>•</span>
            <span className="small">{tip}</span>
          </div>
        ))}
      </div>

      {!isActive && !error && (
        <p className="muted small" style={{ margin: 0 }}>
          Start a focus session to activate live posture tracking.
        </p>
      )}
    </Card>
  );
};
