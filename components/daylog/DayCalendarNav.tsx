"use client";

import { Calendar } from "@/components/ui/calendar";

interface DayCalendarNavProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export function DayCalendarNav({ selectedDate, onSelect }: DayCalendarNavProps) {
  return (
    <div className="rounded-md border p-3">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        className="w-full"
        initialFocus
      />
    </div>
  );
}
