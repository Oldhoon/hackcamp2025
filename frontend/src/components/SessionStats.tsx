import { TrendingUp, Target } from "lucide-react";

interface SessionStatsProps {
  completedSessions: number;
  averagePosture: number;
}

export const SessionStats = ({ 
  completedSessions, 
  averagePosture 
}: SessionStatsProps) => {
  const stats = [
    {
      icon: Target,
      label: "Sessions Completed",
      value: completedSessions,
      tone: "primary",
    },
    {
      icon: TrendingUp,
      label: "Avg. Posture Score",
      value: `${averagePosture}%`,
      tone: "accent",
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="card stat-card" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "0.5rem" }}>
            <div className="column" style={{ gap: "0.15rem" }}>
              <p className="muted small">{stat.label}</p>
              <div className="big-number">{stat.value}</div>
            </div>
            <div className={`icon-badge ${stat.tone}`}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
