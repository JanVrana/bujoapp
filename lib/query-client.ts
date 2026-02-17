"use client";

import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

export function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60,
          retry: 1,
          refetchOnWindowFocus: true,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }
  return queryClient;
}
