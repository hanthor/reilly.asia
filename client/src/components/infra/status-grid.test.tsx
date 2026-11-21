import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_ENDPOINTS, type EndpointStatus, type StatusPayload } from "@shared/infra";

type StatusQuery = {
  data: StatusPayload | undefined;
  isPending: boolean;
  isFetching: boolean;
  refetch: () => void;
};

const query: StatusQuery = { data: undefined, isPending: true, isFetching: true, refetch: () => {} };
const NOW = Date.parse("2026-01-01T00:10:00Z");

vi.mock("./use-infra-api", () => ({
  useInfraStatus: () => query,
  useNow: () => NOW,
}));

import { StatusGrid } from "./status-grid";

function payload(up: (boolean | null)[]): StatusPayload {
  const endpoints: EndpointStatus[] = PUBLIC_ENDPOINTS.map((p, i) => ({
    name: p.name,
    label: p.label,
    group: p.group,
    up: up[i % up.length],
    latencyMs: up[i % up.length] === null ? null : 120,
  }));
  return { checkedAt: "2026-01-01T00:07:00Z", endpoints, hive: { latestRelease: null, releaseUrl: null } } as StatusPayload;
}

function render(): string {
  return renderToStaticMarkup(<StatusGrid />);
}

beforeEach(() => {
  query.data = undefined;
  query.isPending = true;
  query.isFetching = true;
});

describe("StatusGrid", () => {
  it("shows every public endpoint as checking before data arrives", () => {
    const html = render();
    expect(html).toContain("Checking services…");
    expect(html).toContain("checking…");
    for (const p of PUBLIC_ENDPOINTS) expect(html).toContain(p.label);
    expect(html.split("Checking<").length - 1).toBe(PUBLIC_ENDPOINTS.length);
    expect(html).toMatch(/<button[^>]* disabled=""/);
  });

  it("reports all systems operational without a count when everything is up", () => {
    query.data = payload([true]);
    query.isPending = false;
    query.isFetching = false;
    const html = render();
    expect(html).toContain("All systems operational");
    expect(html).not.toContain(`${PUBLIC_ENDPOINTS.length}/${PUBLIC_ENDPOINTS.length}`);
    expect(html).toContain("checked 3m ago");
    expect(html).toContain("120 ms");
    expect(html).not.toMatch(/<button[^>]* disabled=""/);
  });

  it("reports partial degradation with an up/total count", () => {
    query.data = payload([true, false]);
    query.isPending = false;
    query.isFetching = false;
    const up = Math.ceil(PUBLIC_ENDPOINTS.length / 2);
    const html = render();
    expect(html).toContain("Partially degraded");
    expect(html).toContain(`${up}/${PUBLIC_ENDPOINTS.length}`);
    expect(html).toContain("Up");
    expect(html).toContain("Down");
  });

  it("reports services unreachable when every endpoint is down", () => {
    query.data = payload([false]);
    query.isPending = false;
    query.isFetching = false;
    const html = render();
    expect(html).toContain("Services unreachable");
    expect(html).toContain(`0/${PUBLIC_ENDPOINTS.length}`);
  });

  it("reports unknown state when probes returned no verdict", () => {
    query.data = payload([null]);
    query.isPending = false;
    query.isFetching = false;
    const html = render();
    expect(html).toContain("Status unknown");
    expect(html).toContain("Unknown");
  });

  it("offers a retry when the request failed", () => {
    query.isPending = false;
    query.isFetching = false;
    const html = render();
    expect(html).toContain("unavailable, retry");
    expect(html).toContain("Status unknown");
  });

  it("groups endpoints under the hive and matrix headings", () => {
    const html = render();
    expect(html).toContain("Hive agent fleet");
    expect(html).toContain("Matrix");
    expect(html.indexOf("Hive agent fleet")).toBeLessThan(html.indexOf("school.tunaos.org"));
    expect(html.indexOf("matrix.reilly.asia")).toBeGreaterThan(html.indexOf("Hive agent fleet"));
  });
});
