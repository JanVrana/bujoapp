"use client";

import { useState, useMemo, useCallback } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { useContexts } from "@/lib/hooks/use-contexts";
import { useConfetti } from "@/components/feedback/ConfettiAnimation";
import { useEncouragingToast } from "@/components/feedback/EncouragingToast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, SkipForward, X } from "lucide-react";
import type { Signifier } from "@/lib/types";

interface FocusTask {
  id: string;
  title: string;
  contextId: string;
  contextName?: string;
  contextIcon?: string;
  contextColor?: string;
  estimatedMinutes?: number | null;
  signifier?: Signifier;
}

interface FocusModeProps {
  tasks: FocusTask[];
}

export function FocusMode({ tasks }: FocusModeProps) {
  const setFocusModeActive = useUIStore((s) => s.setFocusModeActive);
  const contextFilter = useUIStore((s) => s.focusModeContextFilter);
  const setContextFilter = useUIStore((s) => s.setFocusModeContextFilter);
  const { data: contexts } = useContexts();
  const updateTask = useUpdateTask();
  const fireConfetti = useConfetti();
  const showEncouragement = useEncouragingToast();

  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const filteredTasks = useMemo(() => {
    let t = tasks.filter(
      (task) =>
        task.signifier !== "done" &&
        task.signifier !== "cancelled" &&
        !completedIds.has(task.id)
    );
    if (contextFilter) {
      t = t.filter((task) => task.contextId === contextFilter);
    }
    return t;
  }, [tasks, contextFilter, completedIds]);

  const queue = useMemo(() => {
    const notSkipped = filteredTasks.filter((t) => !skippedIds.has(t.id));
    if (notSkipped.length > 0) return notSkipped;
    return [];
  }, [filteredTasks, skippedIds]);

  const currentTask = queue[0];
  const allSkipped = filteredTasks.length > 0 && queue.length === 0;

  const handleComplete = useCallback(() => {
    if (!currentTask) return;
    const isLast = queue.length === 1;
    updateTask.mutate(
      { id: currentTask.id, status: "done" },
      {
        onSuccess: () => {
          setCompletedIds((prev) => new Set(prev).add(currentTask.id));
          fireConfetti(isLast);
          showEncouragement();
        },
      }
    );
  }, [currentTask, queue.length, updateTask, fireConfetti, showEncouragement]);

  const handleSkip = useCallback(() => {
    if (!currentTask) return;
    setSkippedIds((prev) => new Set(prev).add(currentTask.id));
  }, [currentTask]);

  const handleResetQueue = () => {
    setSkippedIds(new Set());
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <Select
          value={contextFilter || "all"}
          onValueChange={(val) => setContextFilter(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Všechny kontexty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny kontexty</SelectItem>
            {contexts
              ?.filter((c) => !c.isSystem && !c.isArchived)
              .map((ctx) => (
                <SelectItem key={ctx.id} value={ctx.id}>
                  {ctx.icon} {ctx.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => setFocusModeActive(false)}>
          <X className="h-4 w-4 mr-2" /> Ukončit
        </Button>
      </div>

      {allSkipped ? (
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4">Všechny úkoly přeskočeny</h2>
          <div className="flex gap-3">
            <Button onClick={handleResetQueue}>Začít znovu</Button>
            <Button variant="outline" onClick={() => setFocusModeActive(false)}>
              Ukončit focus mód
            </Button>
          </div>
        </div>
      ) : currentTask ? (
        <div className="text-center max-w-lg">
          <div className="text-sm text-muted-foreground mb-2">
            {currentTask.contextIcon} {currentTask.contextName}
          </div>
          <h1 className="text-3xl font-medium mb-2">{currentTask.title}</h1>
          {currentTask.estimatedMinutes && (
            <p className="text-muted-foreground mb-8">~{currentTask.estimatedMinutes} min</p>
          )}

          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={handleComplete} className="gap-2 px-8">
              <Check className="h-5 w-5" /> Hotovo
            </Button>
            <Button size="lg" variant="outline" onClick={handleSkip} className="gap-2">
              <SkipForward className="h-5 w-5" /> Přeskočit
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Zbývá {queue.length} z {filteredTasks.length} úkolů
          </p>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-2">Všechno hotovo!</h2>
          <p className="text-muted-foreground mb-4">Skvělá práce!</p>
          <Button onClick={() => setFocusModeActive(false)}>Zavřít</Button>
        </div>
      )}
    </div>
  );
}
