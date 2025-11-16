import { TrendingUp, Target, Zap } from "lucide-react";

interface SessionStatsProps {
  completedSessions: number;
  totalExercises: number;
  averagePosture: number;
}

export const SessionStats = ({ 
  completedSessions, 
  totalExercises, 
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
      icon: Zap,
      label: "Total Exercises",
      value: totalExercises,
      tone: "secondary",
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
          <div key={index} className="card stat-card">
            <div className="row space-between align-center">
              <div>
                <p className="muted small">{stat.label}</p>
                <div className="big-number">{stat.value}</div>
              </div>
              <div className={`icon-badge ${stat.tone}`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
