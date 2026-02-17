"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DayCloseInput, MigrateTaskInput } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function useDayLogOpen() {
  return useQuery({
    queryKey: ["daylog", "open"],
    queryFn: () =>
      fetchJson<{ today: unknown; unclosedDays: unknown[] }>("/api/daylogs/open", {
        method: "POST",
      }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDayLogs(skip = 0, take = 30) {
  return useQuery({
    queryKey: ["daylogs", skip, take],
    queryFn: () => fetchJson(`/api/daylogs?skip=${skip}&take=${take}`),
  });
}

export function useDayLogDetail(date: string) {
  return useQuery({
    queryKey: ["daylog", date],
    queryFn: () => fetchJson(`/api/daylogs/${date}`),
    enabled: !!date,
  });
}

interface WeeklySummaryData {
  completedCount: number;
  mostProductiveDay: string | null;
  deadlinesMet: number;
}

export function useWeeklySummary() {
  return useQuery<WeeklySummaryData>({
    queryKey: ["daylog", "weekly-summary"],
    queryFn: () => fetchJson<WeeklySummaryData>("/api/daylogs/weekly-summary"),
  });
}

export function useCloseDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DayCloseInput) =>
      fetchJson("/api/daylogs/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daylog"] });
      queryClient.invalidateQueries({ queryKey: ["daylogs"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReviewDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { migrations: MigrateTaskInput[] }) =>
      fetchJson("/api/daylogs/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daylog"] });
      queryClient.invalidateQueries({ queryKey: ["daylogs"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReorderDayLogEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, items }: { date: string; items: { id: string; sortOrder: number }[] }) =>
      fetchJson(`/api/daylogs/${date}/entries/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daylog"] });
    },
  });
}
