"use client";

import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { useTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useContexts } from "@/lib/hooks/use-contexts";
import { TaskContextGroup } from "@/components/tasks/TaskContextGroup";
import { TaskFilters, filterTasksByDeadline, type DeadlineFilter } from "@/components/tasks/TaskFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskListSkeleton } from "@/components/tasks/TaskItemSkeleton";
import type { TaskWithSubtasks } from "@/lib/types";

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

export default function BacklogPage() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    status: "backlog",
  });
  const { data: contexts = [], isLoading: contextsLoading } = useContexts();
  const updateTask = useUpdateTask();
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
        <Skeleton className="h-4 w-24" />
        <TaskListSkeleton groups={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Backlog</h1>
        <p className="text-muted-foreground text-sm">
          {tasks.length} {tasks.length === 1 ? "úkol" : tasks.length >= 2 && tasks.length <= 4 ? "úkoly" : "úkolů"}
        </p>
      </div>

      {/* Deadline Filters */}
      <TaskFilters deadlineFilter={deadlineFilter} onDeadlineFilterChange={setDeadlineFilter} />

      {/* Tasks */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg">
            {deadlineFilter === "all" ? "Backlog je prázdný" : "Žádné úkoly odpovídající filtru"}
          </p>
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
    </div>
  );
}
