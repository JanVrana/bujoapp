"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ArrowRightLeft, XCircle } from "lucide-react";
import { SignifierIcon } from "@/components/daylog/SignifierIcon";
import { useUIStore } from "@/lib/stores/ui-store";

interface ArchiveEntry {
  taskTitle: string;
  signifier: string;
  contextName: string;
  contextId: string;
  taskId?: string;
}

interface DayArchiveViewProps {
  date: string;
  entries: ArchiveEntry[];
}

export function DayArchiveView({ date, entries }: DayArchiveViewProps) {
  const setTaskDetailId = useUIStore((s) => s.setTaskDetailId);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, ArchiveEntry[]> = {};
    for (const entry of entries) {
      const key = entry.contextName || "Bez kontextu";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    }
    return groups;
  }, [entries]);

  const stats = useMemo(() => {
    let done = 0;
    let migrated = 0;
    let cancelled = 0;

    for (const entry of entries) {
      switch (entry.signifier) {
        case "done":
          done++;
          break;
        case "migrated_forward":
        case "migrated_backlog":
          migrated++;
          break;
        case "cancelled":
          cancelled++;
          break;
      }
    }

    return { done, migrated, cancelled };
  }, [entries]);

  const formattedDate = new Date(date).toLocaleDateString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{formattedDate}</h2>

      {Object.entries(groupedEntries).map(([contextName, contextEntries]) => (
        <Card key={contextName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{contextName}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {contextEntries.map((entry, index) => (
                <li key={index} className="flex items-center gap-2">
                  <SignifierIcon signifier={entry.signifier as "dot" | "done" | "migrated_forward" | "migrated_backlog" | "cancelled"} />
                  {entry.taskId ? (
                    <button
                      className="text-left hover:underline cursor-pointer text-sm"
                      onClick={() => setTaskDetailId(entry.taskId!)}
                    >
                      {entry.taskTitle}
                    </button>
                  ) : (
                    <span className="text-sm">{entry.taskTitle}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Separator />

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>{stats.done} hotovo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          <span>{stats.migrated} migrováno</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-red-600" />
          <span>{stats.cancelled} zrušeno</span>
        </div>
      </div>
    </div>
  );
}
