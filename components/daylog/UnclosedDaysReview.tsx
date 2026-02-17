"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, ArrowRight, Archive, X } from "lucide-react";
import { useReviewDays } from "@/lib/hooks/use-daylog";
import { WeeklySummary } from "@/components/daylog/WeeklySummary";

interface UnclosedEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  signifier: string;
  contextName: string;
}

interface UnclosedDay {
  id: string;
  date: string;
  entries: UnclosedEntry[];
}

type Destination = "today" | "backlog" | "cancel";

interface Migration {
  taskId: string;
  destination: Destination;
}

interface UnclosedDaysReviewProps {
  unclosedDays: UnclosedDay[];
  onComplete: () => void;
}

export function UnclosedDaysReview({
  unclosedDays,
  onComplete,
}: UnclosedDaysReviewProps) {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const reviewDays = useReviewDays();
  const isMonday = new Date().getDay() === 1;

  const incompleteDays = unclosedDays.map((day) => ({
    ...day,
    entries: day.entries.filter((entry) => entry.signifier === "dot"),
  }));

  const getMigration = (taskId: string): Destination | undefined => {
    return migrations.find((m) => m.taskId === taskId)?.destination;
  };

  const setMigration = (taskId: string, destination: Destination) => {
    setMigrations((prev) => {
      const filtered = prev.filter((m) => m.taskId !== taskId);
      return [...filtered, { taskId, destination }];
    });
  };

  const setAllToday = (entries: UnclosedEntry[]) => {
    setMigrations((prev) => {
      const taskIds = new Set(entries.map((e) => e.taskId));
      const filtered = prev.filter((m) => !taskIds.has(m.taskId));
      const newMigrations = entries.map((e) => ({
        taskId: e.taskId,
        destination: "today" as Destination,
      }));
      return [...filtered, ...newMigrations];
    });
  };

  const allTasksAssigned = incompleteDays.every((day) =>
    day.entries.every((entry) => getMigration(entry.taskId) !== undefined)
  );

  const handleSubmit = async () => {
    const destinationMap: Record<Destination, "tomorrow" | "backlog" | "cancelled" | "scheduled"> = {
      today: "tomorrow",
      backlog: "backlog",
      cancel: "cancelled",
    };
    const mappedMigrations = migrations.map((m) => ({
      taskId: m.taskId,
      destination: destinationMap[m.destination],
    }));
    await reviewDays.mutateAsync({ migrations: mappedMigrations });
    onComplete();
  };

  return (
    <Dialog open={true} modal={true}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarClock className="h-5 w-5" />
            Nezavřené dny ke zpracování
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isMonday && <WeeklySummary />}

          {incompleteDays.map((day) => (
            <div key={day.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {new Date(day.date).toLocaleDateString("cs-CZ", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                {day.entries.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllToday(day.entries)}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Vše na dnes
                  </Button>
                )}
              </div>

              {day.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Žádné nedokončené úkoly.
                </p>
              ) : (
                <div className="space-y-2">
                  {day.entries.map((entry) => {
                    const migration = getMigration(entry.taskId);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {entry.taskTitle}
                          </p>
                          {entry.contextName && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {entry.contextName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-3 shrink-0">
                          <Button
                            variant={
                              migration === "today" ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() =>
                              setMigration(entry.taskId, "today")
                            }
                            title="Na dnes"
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Na dnes
                          </Button>
                          <Button
                            variant={
                              migration === "backlog" ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() =>
                              setMigration(entry.taskId, "backlog")
                            }
                            title="Backlog"
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Backlog
                          </Button>
                          <Button
                            variant={
                              migration === "cancel"
                                ? "destructive"
                                : "ghost"
                            }
                            size="sm"
                            onClick={() =>
                              setMigration(entry.taskId, "cancel")
                            }
                            title="Zrušit"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Zrušit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!allTasksAssigned || reviewDays.isPending}
          >
            {reviewDays.isPending ? "Ukládám..." : "Potvrdit a pokračovat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
