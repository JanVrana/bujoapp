"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Context } from "@/lib/types";

interface ProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contexts: Context[];
  onProcess: (contextId: string, destination: "today" | "scheduled" | "backlog", scheduledDate?: string) => void;
}

export function ProcessDialog({ open, onOpenChange, contexts, onProcess }: ProcessDialogProps) {
  const [contextId, setContextId] = useState(contexts[0]?.id || "");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Zpracovat úkol</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Select value={contextId} onValueChange={setContextId}>
              <SelectTrigger>
                <SelectValue placeholder="Vybrat kontext" />
              </SelectTrigger>
              <SelectContent>
                {contexts.map((ctx) => (
                  <SelectItem key={ctx.id} value={ctx.id}>
                    {ctx.icon} {ctx.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => onProcess(contextId, "today")}
              disabled={!contextId}
            >
              Na dnes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onProcess(contextId, "backlog")}
              disabled={!contextId}
            >
              Backlog
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? scheduledDate.toLocaleDateString("cs-CZ") : "Naplánovat na datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={(date) => {
                    setScheduledDate(date);
                    if (date && contextId) {
                      onProcess(contextId, "scheduled", date.toISOString());
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
