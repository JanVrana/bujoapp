"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, TrendingUp, CalendarCheck } from "lucide-react";
import { useWeeklySummary } from "@/lib/hooks/use-daylog";

export function WeeklySummary() {
  const { data: summary, isLoading } = useWeeklySummary();

  if (isLoading || !summary) {
    return null;
  }

  const { completedCount, mostProductiveDay, deadlinesMet } = summary;

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-green-700 dark:text-green-300 text-lg">
          Shrnutí minulého týdne
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-green-800 dark:text-green-200">
              Minulý týden:{" "}
              <span className="font-semibold">{completedCount} úkolů</span>{" "}
              dokončeno
            </span>
          </div>

          {mostProductiveDay && (
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-green-800 dark:text-green-200">
                Nejproduktivnější den:{" "}
                <span className="font-semibold">{mostProductiveDay}</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-green-800 dark:text-green-200">
              Splněné deadliny:{" "}
              <span className="font-semibold">{deadlinesMet}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
