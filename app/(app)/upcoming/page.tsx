"use client";

import { useState, useMemo } from "react";
import { useTasks } from "@/lib/hooks/use-tasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskItem } from "@/components/tasks/TaskItem";
import { cs } from "date-fns/locale";

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

export default function UpcomingPage() {
  const [activeTab, setActiveTab] = useState("week");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {next7Days.map((day) => (
              <Card key={day}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {formatDayLabel(day)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{day}</p>
                </CardHeader>
                <CardContent>
                  {tasksByDate[day]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      Žádné úkoly
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {tasksByDate[day]?.map((task) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
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
