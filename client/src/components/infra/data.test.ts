import { describe, expect, it } from "vitest";
import {
  CLUSTER_NODES,
  FLEET,
  HANDBOOK,
  MECHANISMS,
  PIPELINE,
  STACK,
  handbook,
  hostAnchor,
  type Host,
} from "./data";

const allHosts: Host[] = [...FLEET, ...CLUSTER_NODES].flatMap((g) => g.hosts);
const allHrefs = [
  ...allHosts.map((h) => h.href),
  ...MECHANISMS.map((m) => m.href),
  ...STACK.map((s) => s.href),
].filter((h): h is string => h !== undefined);

describe("handbook / hostAnchor", () => {
  it("prefixes handbook pages with the handbook root", () => {
    expect(handbook("automation.html")).toBe(`${HANDBOOK}automation.html`);
  });

  it("anchors on the host name by default", () => {
    expect(hostAnchor({ name: "bihar" })).toBe("host-bihar");
  });

  it("prefers an explicit slug over the name", () => {
    expect(hostAnchor({ name: "pixel", slug: "phone" })).toBe("host-phone");
  });
});

describe("static infra content", () => {
  it("has unique group ids across fleet and cluster nodes", () => {
    const ids = [...FLEET, ...CLUSTER_NODES].map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every group at least one host", () => {
    for (const g of [...FLEET, ...CLUSTER_NODES]) expect(g.hosts.length, g.id).toBeGreaterThan(0);
  });

  it("gives every host a unique anchor so #host-<slug> links resolve to one element", () => {
    const anchors = allHosts.map(hostAnchor);
    expect(new Set(anchors).size).toBe(anchors.length);
    for (const a of anchors) expect(a).toMatch(/^host-[a-z0-9-]+$/);
  });

  it("uses only known host states and fills every required field", () => {
    for (const h of allHosts) {
      expect(["active", "offline", "retired"], h.name).toContain(h.state);
      expect(h.kind, h.name).not.toBe("");
      expect(h.role, h.name).not.toBe("");
      expect(h.tags.length, h.name).toBeGreaterThan(0);
    }
  });

  it("keeps handbook links relative to the handbook root and other links https", () => {
    for (const href of allHrefs) {
      expect(href.startsWith(HANDBOOK) || href.startsWith("https://"), href).toBe(true);
    }
  });

  it("fills every mechanism, stack item and pipeline step", () => {
    for (const m of MECHANISMS) {
      expect(m.title).not.toBe("");
      expect(m.body).not.toBe("");
    }
    for (const s of STACK) {
      expect(s.name).not.toBe("");
      expect(s.what).not.toBe("");
    }
    expect(PIPELINE.length).toBeGreaterThan(0);
    for (const step of PIPELINE) expect(step).not.toBe("");
  });

  // data.ts promises "no addresses, ports, instance IDs or allowlists"; the
  // page is public, so guard that promise against an accidental paste.
  it("contains no IP addresses or AWS instance ids", () => {
    const text = JSON.stringify({ FLEET, CLUSTER_NODES, MECHANISMS, STACK, PIPELINE });
    expect(text).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
    expect(text).not.toMatch(/\bi-[0-9a-f]{8,17}\b/);
  });
});
