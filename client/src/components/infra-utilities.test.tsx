import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./error-boundary";
import { StatusDot, toneFor, type DotTone } from "./infra/status-dot";

describe("error-boundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error message when child component throws", () => {
    const ThrowComponent = () => {
      throw new Error("Test error");
    };

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("maintains error state after error occurs", () => {
    const ThrowComponent = () => {
      throw new Error("Test error");
    };

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

    // Even after rerender, error message should persist
    rerender(
      <ErrorBoundary>
        <div>New content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("logs error and errorInfo to console", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const testError = new Error("Test error");

    const ThrowComponent = () => {
      throw testError;
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("StatusDot component", () => {
  it("renders with up tone", () => {
    const { container } = render(<StatusDot tone="up" />);
    const dot = container.querySelector("span.relative");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("bg-[color:var(--ix-teal)]");
  });

  it("renders with down tone", () => {
    const { container } = render(<StatusDot tone="down" />);
    const dot = container.querySelector("span.relative");
    expect(dot).toHaveClass("bg-[color:var(--ix-rust)]");
  });

  it("renders with unknown tone", () => {
    const { container } = render(<StatusDot tone="unknown" />);
    const dot = container.querySelector("span.relative");
    expect(dot).toHaveClass("opacity-60");
    expect(dot).toHaveClass("bg-[color:var(--ix-muted)]");
  });

  it("renders with offline tone", () => {
    const { container } = render(<StatusDot tone="offline" />);
    const dot = container.querySelector("span.relative");
    expect(dot).toHaveClass("bg-[color:var(--ix-orange)]");
  });

  it("renders pulse element when pulse=true", () => {
    const { container } = render(<StatusDot tone="up" pulse={true} />);
    const pulse = container.querySelector(".ix-ping");
    expect(pulse).toBeInTheDocument();
    expect(pulse).toHaveClass("bg-[color:var(--ix-teal)]");
  });

  it("does not render pulse element when pulse=false", () => {
    const { container } = render(<StatusDot tone="up" pulse={false} />);
    const pulse = container.querySelector(".ix-ping");
    expect(pulse).not.toBeInTheDocument();
  });

  it("does not render pulse element by default", () => {
    const { container } = render(<StatusDot tone="up" />);
    const pulse = container.querySelector(".ix-ping");
    expect(pulse).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<StatusDot tone="up" className="custom-class" />);
    const wrapper = container.querySelector("span.relative.inline-flex");
    expect(wrapper).toHaveClass("custom-class");
  });

  it("has aria-hidden attribute for accessibility", () => {
    const { container } = render(<StatusDot tone="up" />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
  });

  it("has correct base size classes", () => {
    const { container } = render(<StatusDot tone="up" />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("h-2.5");
    expect(wrapper).toHaveClass("w-2.5");
  });
});

describe("toneFor helper function", () => {
  it("returns 'up' when status is true", () => {
    expect(toneFor(true)).toBe("up");
  });

  it("returns 'down' when status is false", () => {
    expect(toneFor(false)).toBe("down");
  });

  it("returns 'unknown' when status is null", () => {
    expect(toneFor(null)).toBe("unknown");
  });

  it("returns 'unknown' when status is undefined", () => {
    expect(toneFor(undefined)).toBe("unknown");
  });

  it("handles all valid DotTone outputs", () => {
    const validTones: Array<DotTone> = ["up", "down", "unknown", "offline"];
    
    expect(toneFor(true)).toMatch(/^(up|down|unknown|offline)$/);
    expect(toneFor(false)).toMatch(/^(up|down|unknown|offline)$/);
    expect(toneFor(null)).toMatch(/^(up|down|unknown|offline)$/);
  });
});
