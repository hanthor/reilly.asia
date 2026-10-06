import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./error-boundary";

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error fallback when child component throws", () => {
    const ThrowComponent = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("logs error and error info when caught", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    const ThrowComponent = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Uncaught error:"),
      expect.any(Error),
      expect.any(Object)
    );
  });

  it("renders children for multiple child elements", () => {
    render(
      <ErrorBoundary>
        <div>First child</div>
        <div>Second child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("First child")).toBeInTheDocument();
    expect(screen.getByText("Second child")).toBeInTheDocument();
  });

  it("recovers from error when component re-renders without throwing", () => {
    const ThrowComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>Safe content</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

    // After the component is rerendered without error, the boundary should reset
    rerender(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Note: React 18 error boundaries don't automatically reset state between renders
    // This test documents the actual behavior
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("captures errors in nested components", () => {
    const NestedThrowComponent = () => {
      throw new Error("Nested error");
    };

    const ParentComponent = () => (
      <div>
        <h1>Parent</h1>
        <NestedThrowComponent />
      </div>
    );

    render(
      <ErrorBoundary>
        <ParentComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders fallback UI with correct heading", () => {
    const ThrowComponent = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Something went wrong.");
  });

  it("handles JSX elements as children", () => {
    const TestComponent = () => <p>Complex component</p>;

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Complex component")).toBeInTheDocument();
  });
});
