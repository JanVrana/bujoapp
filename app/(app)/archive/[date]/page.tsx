"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useDayLogDetail } from "@/lib/hooks/use-daylog";
import { DayArchiveView } from "@/components/daylog/DayArchiveView";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ArchiveDatePageProps {
  params: Promise<{ date: string }>;
}

export default function ArchiveDatePage({ params }: ArchiveDatePageProps) {
  const { date } = use(params);
  const router = useRouter();
  const { data: dayLog, isLoading } = useDayLogDetail(date);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/archive")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {new Date(date + "T00:00:00").toLocaleDateString("cs-CZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h1>
        </div>
      </div>

      {/* Day Archive Content */}
      {dayLog ? (
        <DayArchiveView date={date} entries={(dayLog as { entries?: unknown[] })?.entries as { taskTitle: string; signifier: string; contextName: string; contextId: string; taskId?: string }[] ?? []} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-lg">
            Pro tento den neexistuje žádný záznam
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/archive")}
          >
            Zpět na archiv
          </Button>
        </div>
      )}
    </div>
  );
}
