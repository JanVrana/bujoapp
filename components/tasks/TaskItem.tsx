"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

function triggerHaptic(pattern: number | number[] = 50) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

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
  const focusedTaskId = useUIStore((s) => s.focusedTaskId);
  const setFocusedTaskId = useUIStore((s) => s.setFocusedTaskId);
  const updateTask = useUpdateTask();
  const fireConfetti = useConfetti();
  const showEncouragement = useEncouragingToast();
  const showUndo = useUndoToast();

  const isDone = signifier === "done" || status === "done";
  const isMigrated = signifier === "migrated_forward" || signifier === "migrated_backlog";
  const isCancelled = signifier === "cancelled" || status === "cancelled";
  const ageColor = createdAt ? getAgeColor(createdAt) : null;

  // Swipe gesture state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showSwipeActions, setShowSwipeActions] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const hasHapticked = useRef(false);
  const swipeEnabled = !isDone && !isCancelled;

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeEnabled) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      hasHapticked.current = false;
    },
    [swipeEnabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeEnabled) return;
      const deltaX = e.touches[0].clientX - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      // Only start swiping if horizontal movement exceeds vertical
      if (!isSwiping && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        setIsSwiping(true);
      }

      if (isSwiping || Math.abs(deltaX) > Math.abs(deltaY)) {
        const clamped = Math.max(-100, Math.min(100, deltaX));
        setSwipeX(clamped);

        // Haptic feedback when crossing threshold
        if (!hasHapticked.current && (clamped > 60 || clamped < -60)) {
          triggerHaptic(50);
          hasHapticked.current = true;
        }
        // Reset haptic flag if user swipes back within threshold
        if (hasHapticked.current && clamped > -60 && clamped < 60) {
          hasHapticked.current = false;
        }
      }
    },
    [swipeEnabled, isSwiping]
  );

  const handleComplete = useCallback(() => {
    updateTask.mutate(
      { id, status: "done" },
      {
        onSuccess: () => {
          triggerHaptic(50);
          fireConfetti(isLastTask);
          showEncouragement();
          showUndo("Úkol dokončen", () => {
            updateTask.mutate({ id, status: "today" });
          });
          onComplete?.();
        },
      }
    );
  }, [id, isLastTask, updateTask, fireConfetti, showEncouragement, showUndo, onComplete]);

  const handleMoveToTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateTask.mutate({ id, status: "scheduled", scheduledDate: tomorrow.toISOString() });
  }, [id, updateTask]);

  const handleMoveToBacklog = useCallback(() => {
    updateTask.mutate({ id, status: "backlog", scheduledDate: null });
  }, [id, updateTask]);

  const handleCancel = useCallback(() => {
    triggerHaptic(50);
    updateTask.mutate({ id, status: "cancelled" });
    showUndo("Úkol zrušen", () => {
      updateTask.mutate({ id, status: "today" });
    });
  }, [id, updateTask, showUndo]);

  const onTouchEnd = useCallback(() => {
    if (!swipeEnabled) return;
    if (swipeX > 60) {
      handleComplete();
    } else if (swipeX < -60) {
      setShowSwipeActions(true);
    }
    setSwipeX(0);
    setIsSwiping(false);
  }, [swipeEnabled, swipeX, handleComplete]);

  useEffect(() => {
    const handleFocusNav = (e: Event) => {
      const dir = e.type === "focus-task-prev" ? -1 : 1;
      const items = Array.from(document.querySelectorAll<HTMLElement>("[data-task-id]"));
      if (items.length === 0) return;
      const currentIdx = items.findIndex((el) => el.dataset.taskId === focusedTaskId);
      const nextIdx = currentIdx === -1 ? 0 : Math.max(0, Math.min(items.length - 1, currentIdx + dir));
      const nextId = items[nextIdx].dataset.taskId;
      if (nextId) setFocusedTaskId(nextId);
    };

    window.addEventListener("focus-task-prev", handleFocusNav);
    window.addEventListener("focus-task-next", handleFocusNav);
    return () => {
      window.removeEventListener("focus-task-prev", handleFocusNav);
      window.removeEventListener("focus-task-next", handleFocusNav);
    };
  }, [focusedTaskId, setFocusedTaskId]);

  return (
    <div
      data-task-id={id}
      onClick={() => setFocusedTaskId(id)}
      className={cn(
        "group relative overflow-hidden rounded-md",
        isDone && "opacity-50",
        isCancelled && "opacity-40",
        focusedTaskId === id && "ring-2 ring-primary"
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe background indicators */}
      {swipeEnabled && swipeX !== 0 && (
        <>
          {/* Green background for swipe right (complete) */}
          {swipeX > 0 && (
            <div className="absolute inset-0 flex items-center px-4 bg-green-500/20 rounded-md">
              <Check
                className={cn(
                  "h-5 w-5 text-green-600 dark:text-green-400 transition-opacity",
                  swipeX > 60 ? "opacity-100" : "opacity-50"
                )}
              />
            </div>
          )}
          {/* Red background for swipe left (actions) */}
          {swipeX < 0 && (
            <div className="absolute inset-0 flex items-center justify-end px-4 bg-red-500/20 rounded-md">
              <X
                className={cn(
                  "h-5 w-5 text-red-600 dark:text-red-400 transition-opacity",
                  swipeX < -60 ? "opacity-100" : "opacity-50"
                )}
              />
            </div>
          )}
        </>
      )}

      {/* Main sliding content */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors relative",
          !isSwiping && "transition-transform duration-200"
        )}
        style={{
          transform: swipeEnabled ? `translateX(${swipeX}px)` : undefined,
        }}
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
            <DropdownMenu
              open={showSwipeActions || undefined}
              onOpenChange={(open) => {
                if (!open) setShowSwipeActions(false);
              }}
            >
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
    </div>
  );
}
