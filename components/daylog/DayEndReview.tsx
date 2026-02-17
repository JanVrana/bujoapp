"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Archive,
  X,
  CalendarDays,
  Moon,
} from "lucide-react";
import { useCloseDay } from "@/lib/hooks/use-daylog";

type Destination = "tomorrow" | "backlog" | "cancel" | "schedule";

interface TaskEntry {
  id: string;
  taskId: string;
  taskTitle: string;
}

interface TaskDecision {
  taskId: string;
  destination: Destination;
  scheduledDate?: Date;
}

interface DayEndReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskEntry[];
}

export function DayEndReview({ open, onOpenChange, tasks }: DayEndReviewProps) {
  const [decisions, setDecisions] = useState<TaskDecision[]>(() =>
    tasks.map((t) => ({ taskId: t.taskId, destination: "tomorrow" }))
  );
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const closeDay = useCloseDay();

  const getDecision = (taskId: string): TaskDecision | undefined => {
    return decisions.find((d) => d.taskId === taskId);
  };

  const setDecision = (
    taskId: string,
    destination: Destination,
    scheduledDate?: Date
  ) => {
    setDecisions((prev) => {
      const filtered = prev.filter((d) => d.taskId !== taskId);
      return [...filtered, { taskId, destination, scheduledDate }];
    });
  };

  const setAllTomorrow = () => {
    setDecisions(
      tasks.map((t) => ({ taskId: t.taskId, destination: "tomorrow" }))
    );
  };

  const handleScheduleDate = (taskId: string, date: Date | undefined) => {
    if (date) {
      setDecision(taskId, "schedule", date);
    }
    setSchedulingTaskId(null);
  };

  const summary = useMemo(() => {
    const counts = { tomorrow: 0, backlog: 0, cancel: 0, schedule: 0 };
    for (const d of decisions) {
      counts[d.destination]++;
    }
    return counts;
  }, [decisions]);

  const summaryParts: string[] = [];
  if (summary.tomorrow > 0)
    summaryParts.push(`${summary.tomorrow} na zítra`);
  if (summary.backlog > 0)
    summaryParts.push(`${summary.backlog} do backlogu`);
  if (summary.cancel > 0)
    summaryParts.push(`${summary.cancel} zrušeno`);
  if (summary.schedule > 0)
    summaryParts.push(`${summary.schedule} naplánováno`);

  const allDecided = tasks.every((t) =>
    decisions.some((d) => d.taskId === t.taskId)
  );

  const handleConfirm = async () => {
    const destinationMap: Record<Destination, "tomorrow" | "backlog" | "cancelled" | "scheduled"> = {
      tomorrow: "tomorrow",
      backlog: "backlog",
      cancel: "cancelled",
      schedule: "scheduled",
    };
    const migrations = decisions.map((d) => ({
      taskId: d.taskId,
      destination: destinationMap[d.destination],
      ...(d.scheduledDate && { scheduledDate: d.scheduledDate.toISOString() }),
    }));
    await closeDay.mutateAsync({ migrations });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Moon className="h-5 w-5" />
            Ukončení dne
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {tasks.length} nedokončených úkolů
            </p>
            <Button variant="outline" size="sm" onClick={setAllTomorrow}>
              <ArrowRight className="h-4 w-4 mr-1" />
              Vše na zítřek
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            {tasks.map((task) => {
              const decision = getDecision(task.taskId);
              const dest = decision?.destination;

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.taskTitle}</p>
                    {dest === "schedule" && decision?.scheduledDate && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {decision.scheduledDate.toLocaleDateString("cs-CZ")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <Button
                      variant={dest === "tomorrow" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDecision(task.taskId, "tomorrow")}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Na zítra
                    </Button>
                    <Button
                      variant={dest === "backlog" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDecision(task.taskId, "backlog")}
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Backlog
                    </Button>
                    <Button
                      variant={dest === "cancel" ? "destructive" : "ghost"}
                      size="sm"
                      onClick={() => setDecision(task.taskId, "cancel")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Zrušit
                    </Button>
                    <Popover
                      open={schedulingTaskId === task.taskId}
                      onOpenChange={(isOpen) =>
                        setSchedulingTaskId(isOpen ? task.taskId : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant={dest === "schedule" ? "default" : "ghost"}
                          size="sm"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={decision?.scheduledDate}
                          onSelect={(date) =>
                            handleScheduleDate(task.taskId, date)
                          }
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}
          </div>

          {summaryParts.length > 0 && (
            <>
              <Separator />
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">
                  Souhrn: {summaryParts.join(", ")}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allDecided || closeDay.isPending}
          >
            {closeDay.isPending ? "Ukládám..." : "Potvrdit a ukončit den"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
