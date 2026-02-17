"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useContexts } from "@/lib/hooks/use-contexts";
import { InboxProcessing } from "@/components/inbox/InboxProcessing";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ContextPageProps {
  params: Promise<{ id: string }>;
}

export default function ContextPage({ params }: ContextPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ contextId: id });
  const { data: contexts = [], isLoading: contextsLoading } = useContexts();

  const context = useMemo(
    () => contexts.find((c) => c.id === id),
    [contexts, id]
  );

  if (tasksLoading || contextsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">Kontext nenalezen</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Zpět
        </Button>
      </div>
    );
  }

  // If this is the Inbox system context, show inbox processing workflow
  if (context.isSystem) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {context.icon} {context.name}
          </h1>
        </div>
        <InboxProcessing />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {context.icon} {context.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {tasks.length}{" "}
            {tasks.length === 1
              ? "úkol"
              : tasks.length >= 2 && tasks.length <= 4
                ? "úkoly"
                : "úkolů"}
          </p>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg">
            V tomto kontextu nejsou žádné úkoly
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              id={task.id}
              title={task.title}
              status={task.status}
              contextName={task.context?.name}
              contextIcon={task.context?.icon}
              contextColor={task.context?.color}
              deadline={task.deadline ? new Date(task.deadline).toISOString() : null}
              estimatedMinutes={task.estimatedMinutes}
              subtaskCount={task.subtasks?.length ?? 0}
              subtaskDoneCount={task.subtasks?.filter((s: { isDone: boolean }) => s.isDone).length ?? 0}
              createdAt={new Date(task.createdAt).toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
