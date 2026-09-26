import { describe, expect, it } from "vitest";
import { FACT_HOSTS } from "@shared/fleet";
import {
  CLUSTER_NODES,
  DIAGRAM_HOSTS,
  FLEET,
  hostAnchor,
  hostsMissingCards,
  hostsMissingDiagramNodes,
} from "./data";

// The fleet roster lives in shared/fleet.ts (FACT_HOSTS) and is presented twice
// on /infra: as host cards (FLEET) and as nodes in the architecture diagram
// (DIAGRAM_HOSTS). These tests fail when the three drift apart, which otherwise
// costs a machine its live device facts or its diagram node with no error.

const cardNames = FLEET.flatMap((g) => g.hosts).map((h) => h.name);

describe("fleet roster", () => {
  it("gives every fact-publishing host a card", () => {
    expect(hostsMissingCards()).toEqual([]);
  });

  it("draws every fact-publishing host in the diagram", () => {
    expect(hostsMissingDiagramNodes()).toEqual([]);
  });

  it("presents exactly the FACT_HOSTS roster, with no extra machines", () => {
    expect([...cardNames].sort()).toEqual([...FACT_HOSTS].sort());
    expect(DIAGRAM_HOSTS.map((h) => h.name).sort()).toEqual([...FACT_HOSTS].sort());
  });

  it("names each host once", () => {
    expect(new Set(cardNames).size).toBe(cardNames.length);
    const drawn = DIAGRAM_HOSTS.map((h) => h.name);
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  it("orders diagram nodes by their declared position", () => {
    const orders = FLEET.flatMap((g) => g.hosts)
      .map((h) => h.diagram?.order)
      .filter((o): o is number => o !== undefined);
    expect([...orders].sort((a, b) => a - b)).toEqual([...new Set(orders)].sort((a, b) => a - b));
    expect(DIAGRAM_HOSTS).toHaveLength(orders.length);
  });

  it("gives every host card a unique anchor, including cluster nodes", () => {
    const anchors = [...FLEET, ...CLUSTER_NODES].flatMap((g) => g.hosts).map(hostAnchor);
    expect(new Set(anchors).size).toBe(anchors.length);
    // The diagram links to #host-<name> for fleet machines, so those anchors
    // must be exactly the plain name.
    for (const h of DIAGRAM_HOSTS) expect(anchors).toContain(`host-${h.name}`);
  });
});
