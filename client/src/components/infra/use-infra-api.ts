import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ActivityPayload, StatusPayload } from "@shared/infra";
import { INFRA_API_PATHS } from "@shared/infra-routes";
import type { FleetPayload } from "@shared/fleet";

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
    queryKey: [INFRA_API_PATHS.status],
    queryFn: () => getJson<StatusPayload>(INFRA_API_PATHS.status),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}

export function useInfraActivity() {
  return useQuery({
    queryKey: [INFRA_API_PATHS.activity],
    queryFn: () => getJson<ActivityPayload>(INFRA_API_PATHS.activity),
    staleTime: Infinity,
  });
}

export function useFleetFacts() {
  return useQuery({
    queryKey: [INFRA_API_PATHS.fleet],
    queryFn: () => getJson<FleetPayload>(INFRA_API_PATHS.fleet),
    staleTime: 5 * 60_000,
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
