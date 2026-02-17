"use client";

import { useMemo } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { useTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useContexts } from "@/lib/hooks/use-contexts";
import { TaskContextGroup } from "@/components/tasks/TaskContextGroup";
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

  const tasksByContext = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      const key = task.contextId ?? "uncategorized";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    }
    return grouped;
  }, [tasks]);

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg">
            Backlog je prázdný
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
