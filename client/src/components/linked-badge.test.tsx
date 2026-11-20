// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { LinkedBadge } from "./linked-badge";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(ui: React.ReactElement): HTMLElement {
  const container = document.createElement("div");
  act(() => createRoot(container).render(ui));
  return container;
}

describe("LinkedBadge", () => {
  const links = { Go: "https://go.dev" };

  it("wraps the badge in an external link when the tag has a URL", () => {
    const el = render(<LinkedBadge tag="Go" links={links} className="x" />);
    const a = el.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://go.dev");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(a?.textContent).toBe("Go");
  });

  it("renders a plain badge with no anchor when the tag has no URL", () => {
    const el = render(<LinkedBadge tag="Rust" links={links} className="x" />);
    expect(el.querySelector("a")).toBeNull();
    expect(el.textContent).toBe("Rust");
  });

  it("passes className to the badge", () => {
    const el = render(<LinkedBadge tag="Rust" links={links} className="custom-cls" />);
    expect(el.firstElementChild?.className).toContain("custom-cls");
  });
});
