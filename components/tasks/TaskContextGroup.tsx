"use client";

import { TaskList } from "./TaskList";
import { InlineAddTask } from "./InlineAddTask";
import { Clock } from "lucide-react";
import type { Signifier } from "@/lib/types";

interface TaskData {
  id: string;
  title: string;
  signifier?: Signifier;
  contextName?: string;
  contextIcon?: string;
  contextColor?: string;
  deadline?: string | null;
  estimatedMinutes?: number | null;
  subtaskCount?: number;
  subtaskDoneCount?: number;
  createdAt?: string;
  status?: string;
}

interface TaskContextGroupProps {
  contextId: string;
  contextName: string;
  contextIcon: string;
  contextColor: string;
  tasks: TaskData[];
  showInlineAdd?: boolean;
}

export function TaskContextGroup({
  contextId,
  contextName,
  contextIcon,
  contextColor,
  tasks,
  showInlineAdd = true,
}: TaskContextGroupProps) {
  const activeTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const totalEstimate = activeTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  return (
    <div className="mb-4">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-t-md border-b-2"
        style={{ borderBottomColor: contextColor }}
      >
        <span className="text-lg">{contextIcon}</span>
        <span className="font-medium text-sm">{contextName}</span>
        <span className="text-xs text-muted-foreground">({activeTasks.length})</span>
        {totalEstimate > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto">
            <Clock className="w-3 h-3" />
            ~{totalEstimate}m
          </span>
        )}
      </div>

      <TaskList tasks={tasks} contextId={contextId} />

      {showInlineAdd && <InlineAddTask contextId={contextId} />}
    </div>
  );
}
