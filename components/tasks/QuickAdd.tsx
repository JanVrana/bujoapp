"use client";

import { useState } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { useContexts } from "@/lib/hooks/use-contexts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { TIME_ESTIMATE_OPTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuickAdd() {
  const open = useUIStore((s) => s.quickAddOpen);
  const setOpen = useUIStore((s) => s.setQuickAddOpen);
  const { data: contexts } = useContexts();
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [contextId, setContextId] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>();

  const inboxContext = contexts?.find((c) => c.isSystem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedContextId = contextId || inboxContext?.id;
    if (!selectedContextId) return;

    const isInbox = selectedContextId === inboxContext?.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    createTask.mutate(
      {
        title: title.trim(),
        contextId: selectedContextId,
        deadline: deadline?.toISOString(),
        estimatedMinutes,
        status: isInbox ? "inbox" : "today",
        scheduledDate: isInbox ? undefined : today.toISOString(),
      },
      {
        onSuccess: () => {
          setTitle("");
          setContextId("");
          setDeadline(undefined);
          setEstimatedMinutes(undefined);
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rychlé přidání úkolu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Název</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Co je třeba udělat?"
              autoFocus
            />
          </div>

          <div>
            <Label>Kontext</Label>
            <Select value={contextId} onValueChange={setContextId}>
              <SelectTrigger>
                <SelectValue placeholder={inboxContext ? `${inboxContext.icon} ${inboxContext.name}` : "Vybrat kontext"} />
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
                  className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? deadline.toLocaleDateString("cs-CZ") : "Bez deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={deadline} onSelect={setDeadline} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Časový odhad</Label>
            <div className="flex gap-2 mt-1">
              {TIME_ESTIMATE_OPTIONS.map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={estimatedMinutes === mins ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEstimatedMinutes(estimatedMinutes === mins ? undefined : mins)}
                >
                  {mins}m
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušit
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Přidat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
