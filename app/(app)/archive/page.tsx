"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDayLogs } from "@/lib/hooks/use-daylog";
import { DayCalendarNav } from "@/components/daylog/DayCalendarNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRightLeft, XCircle } from "lucide-react";

export default function ArchivePage() {
  const router = useRouter();
  const { data: dayLogs, isLoading } = useDayLogs() as { data: Array<{ id: string; date: string; note?: string; doneCount?: number; migratedCount?: number; cancelledCount?: number }> | undefined; isLoading: boolean };

  const sortedLogs = useMemo(() => {
    return [...(dayLogs ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [dayLogs]);

  function handleDateSelect(date: string) {
    router.push(`/archive/${date}`);
  }

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
        <h1 className="text-2xl font-bold">Archiv dnů</h1>
        <p className="text-muted-foreground text-sm">
          Přehled vašich minulých dnů
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar Navigation */}
        <div className="shrink-0">
          <DayCalendarNav
            selectedDate={undefined}
            onSelect={(date) => {
              if (date) {
                const dateStr = date.toISOString().split("T")[0];
                handleDateSelect(dateStr);
              }
            }}
          />
        </div>

        {/* Day Logs List */}
        <div className="flex-1 flex flex-col gap-3">
          {sortedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-lg">
                Zatím žádné záznamy
              </p>
            </div>
          ) : (
            sortedLogs.map((log) => (
              <Card
                key={log.id ?? log.date}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`/archive/${log.date}`)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">
                      {new Date(log.date + "T00:00:00").toLocaleDateString("cs-CZ", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {log.note && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {log.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {log.doneCount ?? 0}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ArrowRightLeft className="h-3 w-3 text-blue-600" />
                      {log.migratedCount ?? 0}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-600" />
                      {log.cancelledCount ?? 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
