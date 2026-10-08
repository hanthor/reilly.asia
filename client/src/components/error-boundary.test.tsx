import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./error-boundary";

// Mock console.error to avoid noise in test output
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

// Component that throws an error
function ThrowingComponent() {
  throw new Error("Test error");
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterEach(() => {
    // Reset error state between tests
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders error message when child component throws", () => {
    // Suppress React's error boundary warnings in the test output
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("logs errors to console", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Uncaught error:",
      expect.any(Error),
      expect.any(Object)
    );
    consoleErrorSpy.mockRestore();
  });

  it("captures error info in componentDidCatch", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Uncaught error:",
      expect.objectContaining({ message: "Test error" }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
    consoleErrorSpy.mockRestore();
  });

  it("handles multiple child elements", () => {
    render(
      <ErrorBoundary>
        <div>First child</div>
        <div>Second child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("First child")).toBeInTheDocument();
    expect(screen.getByText("Second child")).toBeInTheDocument();
  });
});
