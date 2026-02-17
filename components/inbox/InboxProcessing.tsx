"use client";

import { useState, useEffect, useCallback } from "react";
import { useTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useContexts } from "@/lib/hooks/use-contexts";
import { ProcessDialog } from "./ProcessDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, ArrowDown, Inbox } from "lucide-react";

export function InboxProcessing() {
  const { data: tasks = [] } = useTasks({ status: "inbox" });
  const { data: contexts = [] } = useContexts();
  const updateTask = useUpdateTask();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  const currentTask = tasks[currentIndex];
  const userContexts = contexts.filter((c) => !c.isSystem && !c.isArchived);

  const handleNext = useCallback(() => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, tasks.length]);

  const handleToday = useCallback(() => {
    if (!currentTask || userContexts.length === 0) return;
    setShowDialog(true);
  }, [currentTask, userContexts.length]);

  const handleBacklog = useCallback(() => {
    if (!currentTask) return;
    updateTask.mutate(
      { id: currentTask.id, status: "backlog" },
      { onSuccess: () => setCurrentIndex((i) => Math.min(i, tasks.length - 2)) }
    );
  }, [currentTask, updateTask, tasks.length]);

  const handleProcess = (contextId: string, destination: "today" | "scheduled" | "backlog", scheduledDate?: string) => {
    if (!currentTask) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    updateTask.mutate(
      {
        id: currentTask.id,
        contextId,
        status: destination === "today" ? "today" : destination === "scheduled" ? "scheduled" : "backlog",
        scheduledDate: destination === "today" ? today.toISOString() : scheduledDate || null,
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          setCurrentIndex((i) => Math.min(i, Math.max(0, tasks.length - 2)));
        },
      }
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDialog) return;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") handleToday();
      if (e.key === "ArrowLeft" || e.key === "b" || e.key === "B") handleBacklog();
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") handleNext();
      if (e.key === "Enter") setShowDialog(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDialog, handleToday, handleBacklog, handleNext]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Všechno zpracováno!</h3>
        <p className="text-sm text-muted-foreground mt-1">Inbox je prázdný</p>
      </div>
    );
  }

  if (!currentTask) {
    setCurrentIndex(0);
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center text-sm text-muted-foreground mb-4">
        {currentIndex + 1} / {tasks.length}
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-medium text-center">{currentTask.title}</h2>
          {currentTask.description && (
            <p className="text-sm text-muted-foreground mt-2 text-center">{currentTask.description}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={handleBacklog} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Backlog
        </Button>
        <Button variant="outline" onClick={handleNext} className="gap-2">
          <ArrowDown className="h-4 w-4" /> Přeskočit
        </Button>
        <Button onClick={handleToday} className="gap-2">
          <ArrowRight className="h-4 w-4" /> Zpracovat
        </Button>
      </div>

      <div className="text-center text-xs text-muted-foreground mt-4">
        D = Zpracovat &middot; B = Backlog &middot; S = Přeskočit &middot; Enter = Dialog
      </div>

      {showDialog && (
        <ProcessDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          contexts={userContexts}
          onProcess={handleProcess}
        />
      )}
    </div>
  );
}
