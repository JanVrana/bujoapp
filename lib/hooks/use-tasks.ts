"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskWithSubtasks, CreateTaskInput, UpdateTaskInput, ReorderInput } from "@/lib/types";
import { enqueueOperation } from "@/lib/operationQueue";
import { useSyncStore } from "@/lib/stores/sync-store";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message === "Failed to fetch" ||
      error.message === "NetworkError when attempting to fetch resource." ||
      error.message.includes("network"))
  );
}

export function useTasks(filters?: { status?: string; contextId?: string; scheduledDate?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.contextId) params.set("contextId", filters.contextId);
  if (filters?.scheduledDate) params.set("scheduledDate", filters.scheduledDate);

  return useQuery<TaskWithSubtasks[]>({
    queryKey: ["tasks", filters],
    queryFn: () => fetchJson(`/api/tasks?${params.toString()}`),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      try {
        return await fetchJson("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "create",
            endpoint: "/api/tasks",
            method: "POST",
            body: JSON.stringify(input),
          });
          useSyncStore.getState().incrementPending();
          return input; // Return the input as optimistic result
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["daylog"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTaskInput & { id: string }) => {
      try {
        return await fetchJson(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "update",
            endpoint: `/api/tasks/${id}`,
            method: "PATCH",
            body: JSON.stringify(input),
          });
          useSyncStore.getState().incrementPending();
          return { id, ...input }; // Return as optimistic result
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["daylog"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await fetchJson(`/api/tasks/${id}`, { method: "DELETE" });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "delete",
            endpoint: `/api/tasks/${id}`,
            method: "DELETE",
            body: JSON.stringify({}),
          });
          useSyncStore.getState().incrementPending();
          return { id }; // Return as optimistic result
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderInput) => {
      try {
        return await fetchJson("/api/tasks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "update",
            endpoint: "/api/tasks/reorder",
            method: "POST",
            body: JSON.stringify(input),
          });
          useSyncStore.getState().incrementPending();
          return input; // Return as optimistic result
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
