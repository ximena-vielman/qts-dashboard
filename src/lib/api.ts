/**
 * API client setup for QTS Dashboard.
 * Centralizes base URL and fetch configuration for backend calls.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface ApiConfig extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Base fetch wrapper with JSON handling and error handling.
 * @param endpoint - API path (e.g. "/routes")
 * @param config - Optional fetch config and query params
 * @returns Parsed JSON response
 */
export async function apiClient<T>(
  endpoint: string,
  config: ApiConfig = {}
): Promise<T> {
  const { params, ...init } = config;
  const url = new URL(endpoint, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    );
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
