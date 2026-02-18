"use client";

import { useState, useMemo, useId } from "react";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskItemSkeleton } from "@/components/tasks/TaskItemSkeleton";
import { cs } from "date-fns/locale";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function getNextDays(count: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date.toISOString().split("T")[0]);
  }
  return days;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Dnes";
  if (date.getTime() === tomorrow.getTime()) return "Zítra";

  return date.toLocaleDateString("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

interface SortableTaskItemProps {
  task: {
    id: string;
    title: string;
    status: string;
    context?: { name?: string; icon?: string; color?: string } | null;
    deadline?: string | Date | null;
    estimatedMinutes?: number | null;
    subtasks?: { isDone: boolean }[];
    createdAt: string | Date;
  };
}

function SortableTaskItem({ task }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem
        id={task.id}
        title={task.title}
        status={task.status}
        contextName={task.context?.name}
        contextIcon={task.context?.icon}
        contextColor={task.context?.color}
        deadline={
          task.deadline ? new Date(task.deadline).toISOString() : null
        }
        estimatedMinutes={task.estimatedMinutes}
        subtaskCount={task.subtasks?.length ?? 0}
        subtaskDoneCount={
          task.subtasks?.filter((s: { isDone: boolean }) => s.isDone).length ?? 0
        }
        createdAt={new Date(task.createdAt).toISOString()}
      />
    </div>
  );
}

function DroppableDayColumn({
  day,
  tasks,
}: {
  day: string;
  tasks: SortableTaskItemProps["task"][];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day });
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <Card
      ref={setNodeRef}
      className={isOver ? "ring-2 ring-primary ring-offset-2" : ""}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {formatDayLabel(day)}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{day}</p>
      </CardHeader>
      <CardContent>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              Žádné úkoly
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {tasks.map((task) => (
                <SortableTaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export default function UpcomingPage() {
  const [activeTab, setActiveTab] = useState("week");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const dndContextId = useId();
  const updateTask = useUpdateTask();

  const next7Days = useMemo(() => getNextDays(7), []);

  const startDate = next7Days[0];

  const { data: tasks = [], isLoading } = useTasks({
    scheduledDate: startDate,
  });

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    for (const day of next7Days) {
      grouped[day] = [];
    }
    for (const task of tasks) {
      const sd = task.scheduledDate;
      const date = sd ? (sd instanceof Date ? sd.toISOString().split("T")[0] : String(sd).split("T")[0]) : undefined;
      if (date && grouped[date]) {
        grouped[date].push(task);
      }
    }
    return grouped;
  }, [tasks, next7Days]);

  const datesWithTasks = useMemo(() => {
    return tasks
      .map((t) => {
        const sd = t.scheduledDate;
        return sd ? (sd instanceof Date ? sd.toISOString().split("T")[0] : String(sd).split("T")[0]) : undefined;
      })
      .filter((d): d is string => Boolean(d))
      .map((d) => new Date(d + "T00:00:00"));
  }, [tasks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const targetDate = String(over.id);

    // Find which date this task currently belongs to
    let sourceDate: string | null = null;
    for (const day of next7Days) {
      if (tasksByDate[day]?.some((t) => t.id === taskId)) {
        sourceDate = day;
        break;
      }
    }

    // Only update if the task was moved to a different day
    if (sourceDate && sourceDate !== targetDate && next7Days.includes(targetDate)) {
      updateTask.mutate({
        id: taskId,
        scheduledDate: new Date(targetDate + "T00:00:00").toISOString(),
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-5 w-20" />
              <TaskItemSkeleton />
              <TaskItemSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Nadcházející</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="week">Týden</TabsTrigger>
          <TabsTrigger value="month">Měsíc</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-4">
          <DndContext
            id={dndContextId}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {next7Days.map((day) => (
                <DroppableDayColumn
                  key={day}
                  day={day}
                  tasks={tasksByDate[day] ?? []}
                />
              ))}
            </div>
            <DragOverlay />
          </DndContext>
        </TabsContent>

        <TabsContent value="month" className="mt-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={cs}
                modifiers={{
                  hasTasks: datesWithTasks,
                }}
                modifiersClassNames={{
                  hasTasks: "bg-primary/20 font-bold",
                }}
                className="rounded-md border"
              />
            </div>
            <div className="flex-1">
              {selectedDate ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {selectedDate.toLocaleDateString("cs-CZ", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const dateStr = selectedDate.toISOString().split("T")[0];
                      const dayTasks = tasksByDate[dateStr] ?? [];
                      if (dayTasks.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Žádné úkoly pro tento den
                          </p>
                        );
                      }
                      return (
                        <div className="flex flex-col gap-1">
                          {dayTasks.map((task) => (
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
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Vyberte den v kalendáři pro zobrazení úkolů
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
