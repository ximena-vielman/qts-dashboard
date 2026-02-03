"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "@/types";

/**
 * Fetches routes list from API.
 * Uses React Query for caching and loading/error states.
 */
export function useRoutes() {
  return useQuery<Route[]>({
    queryKey: ["routes"],
    queryFn: async () => {
      const res = await fetch("/api/routes");
      if (!res.ok) throw new Error("Failed to fetch routes");
      return res.json();
    },
  });
}
