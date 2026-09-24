import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ActivityPayload, StatusPayload } from "@shared/infra";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status}`);
  const type = res.headers.get("Content-Type") ?? "";
  // The Vite dev server answers unknown paths with index.html.
  if (!type.includes("json")) throw new Error("not json");
  return (await res.json()) as T;
}

export function useInfraStatus() {
  return useQuery({
    queryKey: ["/infra/api/status"],
    queryFn: () => getJson<StatusPayload>("/infra/api/status"),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}

export function useInfraActivity() {
  return useQuery({
    queryKey: ["/infra/api/activity"],
    queryFn: () => getJson<ActivityPayload>("/infra/api/activity"),
    staleTime: Infinity,
  });
}

/** Re-render on an interval so relative times ("checked 12s ago") stay current. */
export function useNow(intervalMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
