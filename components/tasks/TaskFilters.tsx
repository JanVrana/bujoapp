"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, CalendarDays, Clock } from "lucide-react";

export type DeadlineFilter = "all" | "overdue" | "today" | "this_week";

interface TaskFiltersProps {
  deadlineFilter: DeadlineFilter;
  onDeadlineFilterChange: (filter: DeadlineFilter) => void;
}

export function TaskFilters({ deadlineFilter, onDeadlineFilterChange }: TaskFiltersProps) {
  const filters: { value: DeadlineFilter; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: "Vše", icon: null },
    { value: "overdue", label: "Po termínu", icon: <AlertCircle className="h-3 w-3" /> },
    { value: "today", label: "Dnes", icon: <Clock className="h-3 w-3" /> },
    { value: "this_week", label: "Tento týden", icon: <CalendarDays className="h-3 w-3" /> },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {filters.map((f) => (
        <Button
          key={f.value}
          variant={deadlineFilter === f.value ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onDeadlineFilterChange(f.value)}
        >
          {f.icon && <span className="mr-1">{f.icon}</span>}
          {f.label}
        </Button>
      ))}
    </div>
  );
}

export function filterTasksByDeadline<T extends { deadline?: string | Date | null }>(
  tasks: T[],
  filter: DeadlineFilter
): T[] {
  if (filter === "all") return tasks;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  return tasks.filter((task) => {
    if (!task.deadline) return false;
    const dl = new Date(task.deadline);
    switch (filter) {
      case "overdue": return dl < now;
      case "today": return dl >= now && dl <= endOfToday;
      case "this_week": return dl >= now && dl <= endOfWeek;
      default: return true;
    }
  });
}
