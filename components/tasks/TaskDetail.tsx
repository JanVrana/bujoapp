"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { useContexts } from "@/lib/hooks/use-contexts";
import { SubtaskList } from "./SubtaskList";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Repeat } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TIME_ESTIMATE_OPTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface TaskDetailData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  contextId: string;
  deadline?: string | null;
  estimatedMinutes?: number | null;
  scheduledDate?: string | null;
  isRecurring: boolean;
  recurringRule?: string | null;
  createdAt: string;
}

const RECURRENCE_OPTIONS = {
  daily: "FREQ=DAILY",
  weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  weekly: "FREQ=WEEKLY",
  biweekly: "FREQ=WEEKLY;INTERVAL=2",
  monthly: "FREQ=MONTHLY",
} as const;

const RRULE_TO_KEY: Record<string, keyof typeof RECURRENCE_OPTIONS> = Object.fromEntries(
  Object.entries(RECURRENCE_OPTIONS).map(([key, rule]) => [rule, key as keyof typeof RECURRENCE_OPTIONS])
) as Record<string, keyof typeof RECURRENCE_OPTIONS>;

function rruleToKey(rule: string | null): string {
  if (!rule) return "daily";
  return RRULE_TO_KEY[rule] ?? "daily";
}

export function TaskDetail({ taskId }: { taskId: string }) {
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId);
  const updateTask = useUpdateTask();
  const { data: contexts } = useContexts();

  const { data: task } = useQuery<TaskDetailData>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contextId, setContextId] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringRule, setRecurringRule] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setContextId(task.contextId);
      setDeadline(task.deadline ? new Date(task.deadline) : undefined);
      setEstimatedMinutes(task.estimatedMinutes ?? undefined);
      setIsRecurring(task.isRecurring);
      setRecurringRule(task.recurringRule ?? null);
    }
  }, [task]);

  const handleSave = () => {
    updateTask.mutate({
      id: taskId,
      title,
      description: description || undefined,
      contextId,
      deadline: deadline?.toISOString() ?? null,
      estimatedMinutes: estimatedMinutes ?? null,
    });
  };

  const handleBlurTitle = () => {
    if (task && title !== task.title) handleSave();
  };

  return (
    <Sheet open onOpenChange={() => setTaskDetailId(null)}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detail úkolu</SheetTitle>
        </SheetHeader>

        {task && (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Název</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlurTitle}
                className="text-lg font-medium"
              />
            </div>

            <div>
              <Label>Popis</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                placeholder="Markdown poznámky..."
                rows={4}
              />
            </div>

            <div>
              <Label>Kontext</Label>
              <Select
                value={contextId}
                onValueChange={(val) => {
                  setContextId(val);
                  updateTask.mutate({ id: taskId, contextId: val });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contexts?.map((ctx) => (
                    <SelectItem key={ctx.id} value={ctx.id}>
                      {ctx.icon} {ctx.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? deadline.toLocaleDateString("cs-CZ") : "Bez deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => {
                      setDeadline(date);
                      updateTask.mutate({
                        id: taskId,
                        deadline: date?.toISOString() ?? null,
                      });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Časový odhad</Label>
              <div className="flex gap-2 mt-1">
                {TIME_ESTIMATE_OPTIONS.map((mins) => (
                  <Button
                    key={mins}
                    variant={estimatedMinutes === mins ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const val = estimatedMinutes === mins ? undefined : mins;
                      setEstimatedMinutes(val);
                      updateTask.mutate({ id: taskId, estimatedMinutes: val ?? null });
                    }}
                  >
                    {mins}m
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Opakování
              </Label>
              <div className="flex items-center gap-3 mt-1">
                <Switch
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setIsRecurring(checked);
                    if (!checked) {
                      setRecurringRule(null);
                      updateTask.mutate({ id: taskId, isRecurring: false, recurringRule: null });
                    } else {
                      const defaultRule = "FREQ=DAILY";
                      setRecurringRule(defaultRule);
                      updateTask.mutate({ id: taskId, isRecurring: true, recurringRule: defaultRule });
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {isRecurring ? "Zapnuto" : "Vypnuto"}
                </span>
              </div>
              {isRecurring && (
                <Select
                  value={rruleToKey(recurringRule)}
                  onValueChange={(val) => {
                    const rule = RECURRENCE_OPTIONS[val as keyof typeof RECURRENCE_OPTIONS];
                    setRecurringRule(rule);
                    updateTask.mutate({ id: taskId, isRecurring: true, recurringRule: rule });
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Denně</SelectItem>
                    <SelectItem value="weekdays">Pracovní dny</SelectItem>
                    <SelectItem value="weekly">Týdně</SelectItem>
                    <SelectItem value="biweekly">Každé 2 týdny</SelectItem>
                    <SelectItem value="monthly">Měsíčně</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Podúkoly</Label>
              <SubtaskList taskId={taskId} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
