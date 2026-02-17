"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  if (total === 0) return null;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <Progress value={percentage} className="flex-1 h-2" />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {completed}/{total} ✕
      </span>
    </div>
  );
}
