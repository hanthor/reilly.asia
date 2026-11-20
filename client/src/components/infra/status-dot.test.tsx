// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { StatusDot, toneFor, type DotTone } from "./status-dot";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(ui: React.ReactElement): HTMLElement {
  const container = document.createElement("div");
  act(() => createRoot(container).render(ui));
  return container;
}

describe("toneFor", () => {
  it("maps true to up and false to down", () => {
    expect(toneFor(true)).toBe("up");
    expect(toneFor(false)).toBe("down");
  });

  it("maps null and undefined to unknown", () => {
    expect(toneFor(null)).toBe("unknown");
    expect(toneFor(undefined)).toBe("unknown");
  });
});

describe("StatusDot", () => {
  const colours: Record<DotTone, string> = {
    up: "--ix-teal",
    down: "--ix-rust",
    unknown: "--ix-muted",
    offline: "--ix-orange",
  };

  it.each(Object.entries(colours))("colours the %s tone with %s", (tone, variable) => {
    const el = render(<StatusDot tone={tone as DotTone} />);
    const dot = el.querySelector("span > span");
    expect(dot?.className).toContain(variable);
  });

  it("is hidden from assistive technology", () => {
    const el = render(<StatusDot tone="up" />);
    expect(el.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders a single dot by default and adds a ping ring when pulsing", () => {
    expect(render(<StatusDot tone="up" />).querySelectorAll("span span")).toHaveLength(1);
    const pulsing = render(<StatusDot tone="up" pulse />);
    expect(pulsing.querySelectorAll("span span")).toHaveLength(2);
    expect(pulsing.querySelector(".ix-ping")).not.toBeNull();
  });

  it("merges a caller-supplied className onto the wrapper", () => {
    const el = render(<StatusDot tone="down" className="ml-2" />);
    expect(el.firstElementChild?.className).toContain("ml-2");
  });
});
