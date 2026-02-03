"use client";

import { useQuery } from "@tanstack/react-query";
import type { Task } from "@/types";

/**
 * Fetches tasks list from API.
 * Uses React Query for caching and loading/error states.
 */
export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
}
