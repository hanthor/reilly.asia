import { describe, expect, it } from "vitest";
import { FACT_HOSTS } from "../../../../shared/fleet";
import { DIAGRAM_HOSTS, FLEET, hostAnchor } from "./data";

const cards = FLEET.flatMap((g) => g.hosts);

describe("fleet roster", () => {
  it("has one card per fact host", () => {
    expect(cards.map((h) => h.name).sort()).toEqual([...FACT_HOSTS].sort());
  });

  it("gives every card a unique anchor", () => {
    const anchors = cards.map(hostAnchor);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("draws every fact host in the architecture diagram exactly once", () => {
    expect(DIAGRAM_HOSTS.map(([name]) => name).sort()).toEqual([...FACT_HOSTS].sort());
  });

  it("keeps the diagram grid order and captions", () => {
    expect(DIAGRAM_HOSTS).toEqual([
      ["himachal", "laptop"],
      ["kanpur", "laptop"],
      ["dilli", "desktop"],
      ["kerala", "postmarketOS"],
      ["mumbai", "phone VM"],
      ["termux", "android"],
      ["goa", "Pi 5 · powered off"],
      ["punjab", "agent VM"],
    ]);
  });
});
