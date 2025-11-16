import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = ({ value = 0, className, ...props }: ProgressProps) => {
  const clamped = Math.max(0, Math.min(value, 100));
  return (
    <div className={cn("progress", className)} {...props}>
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
};
