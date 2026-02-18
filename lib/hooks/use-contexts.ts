"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContextWithTaskCount, ReorderInput } from "@/lib/types";
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

export function useContexts() {
  return useQuery<ContextWithTaskCount[]>({
    queryKey: ["contexts"],
    queryFn: () => fetchJson("/api/contexts"),
  });
}

export function useCreateContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; icon?: string; color?: string }) => {
      try {
        return await fetchJson("/api/contexts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "create",
            endpoint: "/api/contexts",
            method: "POST",
            body: JSON.stringify(input),
          });
          useSyncStore.getState().incrementPending();
          return input;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contexts"] });
    },
  });
}

export function useUpdateContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; icon?: string; color?: string }) => {
      try {
        return await fetchJson(`/api/contexts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "update",
            endpoint: `/api/contexts/${id}`,
            method: "PATCH",
            body: JSON.stringify(input),
          });
          useSyncStore.getState().incrementPending();
          return { id, ...input };
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contexts"] });
    },
  });
}

export function useDeleteContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await fetchJson(`/api/contexts/${id}`, { method: "DELETE" });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "delete",
            endpoint: `/api/contexts/${id}`,
            method: "DELETE",
            body: JSON.stringify({}),
          });
          useSyncStore.getState().incrementPending();
          return { id };
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contexts"] });
    },
  });
}

export function useReorderContexts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderInput) => {
      try {
        return await fetchJson("/api/contexts/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
      } catch (error) {
        if (isNetworkError(error)) {
          await enqueueOperation({
            type: "update",
            endpoint: "/api/contexts/reorder",
            method: "POST",
            body: JSON.stringify(input),
          });
          useSyncStore.getState().incrementPending();
          return input;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contexts"] });
    },
  });
}
