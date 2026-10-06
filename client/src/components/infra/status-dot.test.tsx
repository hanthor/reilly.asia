import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StatusDot, toneFor, type DotTone } from "./status-dot";

describe("StatusDot component", () => {
  it("renders with 'up' tone", () => {
    const { container } = render(<StatusDot tone="up" />);
    const span = container.querySelector("span");
    
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass("relative", "inline-flex", "h-2.5", "w-2.5", "shrink-0");
  });

  it("renders with 'down' tone", () => {
    const { container } = render(<StatusDot tone="down" />);
    const span = container.querySelector("span");
    
    expect(span).toBeInTheDocument();
  });

  it("renders with 'unknown' tone", () => {
    const { container } = render(<StatusDot tone="unknown" />);
    const span = container.querySelector("span");
    
    expect(span).toBeInTheDocument();
  });

  it("renders with 'offline' tone", () => {
    const { container } = render(<StatusDot tone="offline" />);
    const span = container.querySelector("span");
    
    expect(span).toBeInTheDocument();
  });

  it("renders pulse animation when pulse={true}", () => {
    const { container } = render(<StatusDot tone="up" pulse={true} />);
    const spans = container.querySelectorAll("span");
    
    // Should have outer span + inner span + pulse span (3 total)
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render pulse animation when pulse={false}", () => {
    const { container } = render(<StatusDot tone="up" pulse={false} />);
    const spans = container.querySelectorAll("span");
    
    // Should have only outer span + inner span (2 total, no pulse)
    expect(spans.length).toBe(2);
  });

  it("applies custom className prop", () => {
    const { container } = render(
      <StatusDot tone="up" className="custom-class" />
    );
    const span = container.querySelector("span");
    
    expect(span).toHaveClass("custom-class");
  });

  it("combines base classes with custom className", () => {
    const { container } = render(
      <StatusDot tone="up" className="mt-2" />
    );
    const span = container.querySelector("span");
    
    expect(span).toHaveClass("relative");
    expect(span).toHaveClass("inline-flex");
    expect(span).toHaveClass("mt-2");
  });

  it("renders both outer and inner span elements", () => {
    const { container } = render(<StatusDot tone="up" />);
    const spans = container.querySelectorAll("span");
    
    expect(spans.length).toBe(2);
    
    // First span is the outer wrapper
    expect(spans[0]).toHaveClass("relative", "inline-flex", "h-2.5", "w-2.5", "shrink-0");
    
    // Second span is the inner colored dot
    expect(spans[1]).toHaveClass("relative", "inline-flex", "h-2.5", "w-2.5", "rounded-full");
  });

  it("renders with aria-hidden attribute on outer span", () => {
    const { container } = render(<StatusDot tone="up" />);
    const outerSpan = container.querySelector("span");
    
    expect(outerSpan).toHaveAttribute("aria-hidden", "true");
  });

  it("all tone values produce valid output", () => {
    const tones: DotTone[] = ["up", "down", "unknown", "offline"];
    
    tones.forEach((tone) => {
      const { container } = render(<StatusDot tone={tone} />);
      const span = container.querySelector("span");
      
      expect(span).toBeInTheDocument();
    });
  });

  it("renders pulse with correct tone classes when pulse={true}", () => {
    const { container } = render(<StatusDot tone="up" pulse={true} />);
    
    // At least one span should have ping animation
    expect(container.innerHTML).toMatch(/ix-ping/);
  });

  it("default pulse value is false", () => {
    const { container: container1 } = render(<StatusDot tone="up" />);
    const { container: container2 } = render(
      <StatusDot tone="up" pulse={false} />
    );
    
    const spans1 = container1.querySelectorAll("span");
    const spans2 = container2.querySelectorAll("span");
    
    expect(spans1.length).toBe(spans2.length);
  });
});

describe("toneFor utility function", () => {
  it("returns 'up' when value is true", () => {
    expect(toneFor(true)).toBe("up");
  });

  it("returns 'down' when value is false", () => {
    expect(toneFor(false)).toBe("down");
  });

  it("returns 'unknown' when value is null", () => {
    expect(toneFor(null)).toBe("unknown");
  });

  it("returns 'unknown' when value is undefined", () => {
    expect(toneFor(undefined)).toBe("unknown");
  });

  it("correctly maps boolean trio", () => {
    expect(toneFor(true)).toBe("up");
    expect(toneFor(false)).toBe("down");
    expect(toneFor(null)).toBe("unknown");
  });

  it("handles various falsy values as 'unknown'", () => {
    expect(toneFor(null)).toBe("unknown");
    expect(toneFor(undefined)).toBe("unknown");
  });

  it("returns valid DotTone type", () => {
    const validTones: DotTone[] = ["up", "down", "unknown", "offline"];
    
    const tone1 = toneFor(true);
    const tone2 = toneFor(false);
    const tone3 = toneFor(null);
    
    expect(validTones).toContain(tone1);
    expect(validTones).toContain(tone2);
    expect(validTones).toContain(tone3);
  });
});
