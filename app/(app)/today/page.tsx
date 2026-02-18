"use client";

import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { useTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import type { TaskWithSubtasks } from "@/lib/types";
import { useContexts } from "@/lib/hooks/use-contexts";
import { ProgressBar } from "@/components/feedback/ProgressBar";
import { TaskContextGroup } from "@/components/tasks/TaskContextGroup";
import { TaskFilters, filterTasksByDeadline, type DeadlineFilter } from "@/components/tasks/TaskFilters";
import { FocusMode } from "@/components/focus/FocusMode";
import { DayEndReview } from "@/components/daylog/DayEndReview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskListSkeleton } from "@/components/tasks/TaskItemSkeleton";
import { Focus, Sun, Plus } from "lucide-react";

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatCzechDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function mapTasksForGroup(tasks: TaskWithSubtasks[]) {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    contextName: t.context?.name,
    contextIcon: t.context?.icon,
    contextColor: t.context?.color,
    deadline: t.deadline ? new Date(t.deadline).toISOString() : null,
    estimatedMinutes: t.estimatedMinutes,
    subtaskCount: t.subtasks?.length ?? 0,
    subtaskDoneCount: t.subtasks?.filter((s) => s.isDone).length ?? 0,
    createdAt: new Date(t.createdAt).toISOString(),
  }));
}

export default function TodayPage() {
  const todayISO = getTodayISO();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    status: "today",
    scheduledDate: todayISO,
  });
  const { data: contexts = [], isLoading: contextsLoading } = useContexts();
  const updateTask = useUpdateTask();

  const [focusModeActive, setFocusModeActive] = useState(false);
  const [dayEndOpen, setDayEndOpen] = useState(false);
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");

  const filteredTasks = useMemo(
    () => filterTasksByDeadline(tasks, deadlineFilter),
    [tasks, deadlineFilter]
  );

  const tasksByContext = useMemo(() => {
    const grouped: Record<string, typeof filteredTasks> = {};
    for (const task of filteredTasks) {
      const key = task.contextId ?? "uncategorized";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    }
    return grouped;
  }, [filteredTasks]);

  const completedCount = tasks.filter(
    (t) => t.status === "done" || t.status === "completed"
  ).length;
  const totalCount = tasks.length;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overContextId = over.data?.current?.contextId as string | undefined;

    if (!overContextId) return;

    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (activeTask && activeTask.contextId !== overContextId) {
      updateTask.mutate({ id: activeTaskId, contextId: overContextId });
    }
  }

  if (tasksLoading || contextsLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full rounded" />
        <TaskListSkeleton groups={3} />
      </div>
    );
  }

  if (focusModeActive) {
    return (
      <FocusMode
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          contextId: t.contextId,
          contextName: t.context?.name,
          contextIcon: t.context?.icon,
          contextColor: t.context?.color,
          estimatedMinutes: t.estimatedMinutes,
        }))}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dnes</h1>
          <p className="text-muted-foreground text-sm">
            {formatCzechDate(todayISO)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFocusModeActive(true)}
          >
            <Focus className="h-4 w-4 mr-1" />
            Focus m&oacute;d
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setDayEndOpen(true)}
          >
            <Sun className="h-4 w-4 mr-1" />
            Ukončit den
          </Button>
        </div>
      </div>

      {/* Deadline Filters */}
      <TaskFilters deadlineFilter={deadlineFilter} onDeadlineFilterChange={setDeadlineFilter} />

      {/* Progress */}
      <ProgressBar completed={completedCount} total={totalCount} />

      {/* Tasks */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg mb-4">
            {deadlineFilter === "all" ? "Žádné úkoly na dnes" : "Žádné úkoly odpovídající filtru"}
          </p>
          {deadlineFilter === "all" && (
            <Button asChild>
              <a href="/backlog">
                <Plus className="h-4 w-4 mr-1" />
                Přidat úkol
              </a>
            </Button>
          )}
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-4">
            {contexts
              .filter((ctx) => tasksByContext[ctx.id]?.length > 0)
              .map((ctx) => (
                <TaskContextGroup
                  key={ctx.id}
                  contextId={ctx.id}
                  contextName={ctx.name}
                  contextIcon={ctx.icon}
                  contextColor={ctx.color}
                  tasks={mapTasksForGroup(tasksByContext[ctx.id])}
                />
              ))}
            {tasksByContext["uncategorized"]?.length > 0 && (
              <TaskContextGroup
                key="uncategorized"
                contextId="uncategorized"
                contextName="Bez kontextu"
                contextIcon="📋"
                contextColor="#888"
                tasks={mapTasksForGroup(tasksByContext["uncategorized"])}
              />
            )}
          </div>
        </DndContext>
      )}

      {/* Day End Review Dialog */}
      <DayEndReview
        open={dayEndOpen}
        onOpenChange={setDayEndOpen}
        tasks={tasks
          .filter((t) => t.status !== "done" && t.status !== "cancelled")
          .map((t) => ({ id: t.id, taskId: t.id, taskTitle: t.title }))}
      />
    </div>
  );
}
