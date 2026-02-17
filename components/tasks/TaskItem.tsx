"use client";

import { cn } from "@/lib/utils";
import { SignifierIcon } from "@/components/daylog/SignifierIcon";
import { ContextBadge } from "@/components/contexts/ContextBadge";
import { useUIStore } from "@/lib/stores/ui-store";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { useConfetti } from "@/components/feedback/ConfettiAnimation";
import { useEncouragingToast } from "@/components/feedback/EncouragingToast";
import { useUndoToast } from "@/components/feedback/UndoToast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Check, ArrowRight, Archive, X, Clock, AlertCircle } from "lucide-react";
import type { Signifier } from "@/lib/types";

interface TaskItemProps {
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
  isLastTask?: boolean;
  onComplete?: () => void;
}

function getDeadlineColor(deadline: string): string {
  const now = new Date();
  const dl = new Date(deadline);
  const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "text-red-600 dark:text-red-400 animate-pulse";
  if (diffDays === 0) return "text-red-600 dark:text-red-400";
  if (diffDays <= 3) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

function getAgeColor(createdAt: string): string | null {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days > 30) return "bg-red-500";
  if (days > 14) return "bg-orange-500";
  if (days > 7) return "bg-yellow-500";
  return null;
}

export function TaskItem({
  id,
  title,
  signifier = "dot",
  contextName,
  contextIcon,
  contextColor,
  deadline,
  estimatedMinutes,
  subtaskCount = 0,
  subtaskDoneCount = 0,
  createdAt,
  status,
  isLastTask = false,
  onComplete,
}: TaskItemProps) {
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId);
  const updateTask = useUpdateTask();
  const fireConfetti = useConfetti();
  const showEncouragement = useEncouragingToast();
  const showUndo = useUndoToast();

  const isDone = signifier === "done" || status === "done";
  const isMigrated = signifier === "migrated_forward" || signifier === "migrated_backlog";
  const isCancelled = signifier === "cancelled" || status === "cancelled";
  const ageColor = createdAt ? getAgeColor(createdAt) : null;

  const handleComplete = () => {
    updateTask.mutate(
      { id, status: "done" },
      {
        onSuccess: () => {
          fireConfetti(isLastTask);
          showEncouragement();
          showUndo("Úkol dokončen", () => {
            updateTask.mutate({ id, status: "today" });
          });
          onComplete?.();
        },
      }
    );
  };

  const handleMoveToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateTask.mutate({ id, status: "scheduled", scheduledDate: tomorrow.toISOString() });
  };

  const handleMoveToBacklog = () => {
    updateTask.mutate({ id, status: "backlog", scheduledDate: null });
  };

  const handleCancel = () => {
    updateTask.mutate({ id, status: "cancelled" });
    showUndo("Úkol zrušen", () => {
      updateTask.mutate({ id, status: "today" });
    });
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors relative",
        isDone && "opacity-50",
        isCancelled && "opacity-40"
      )}
    >
      {ageColor && !isDone && (
        <div className={cn("absolute left-0 top-1 bottom-1 w-0.5 rounded-full", ageColor)} />
      )}

      <button
        onClick={isDone ? undefined : handleComplete}
        className="shrink-0"
        disabled={isDone || isMigrated || isCancelled}
      >
        <SignifierIcon signifier={signifier} />
      </button>

      <button
        onClick={() => setTaskDetailId(id)}
        className={cn(
          "flex-1 text-left text-sm truncate",
          isDone && "line-through",
          isCancelled && "line-through"
        )}
      >
        {title}
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        {subtaskCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {subtaskDoneCount}/{subtaskCount}
          </span>
        )}

        {estimatedMinutes && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-3 h-3" />~{estimatedMinutes}m
          </span>
        )}

        {deadline && (
          <span className={cn("text-xs flex items-center gap-0.5", getDeadlineColor(deadline))}>
            <AlertCircle className="w-3 h-3" />
            {new Date(deadline).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}
          </span>
        )}

        {contextName && (
          <ContextBadge name={contextName} icon={contextIcon} color={contextColor} />
        )}

        {!isDone && !isCancelled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleComplete}>
                <Check className="mr-2 h-4 w-4" /> Dokončit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMoveToTomorrow}>
                <ArrowRight className="mr-2 h-4 w-4" /> Na zítra
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMoveToBacklog}>
                <Archive className="mr-2 h-4 w-4" /> Do backlogu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCancel} className="text-destructive">
                <X className="mr-2 h-4 w-4" /> Zrušit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
