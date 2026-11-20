// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./error-boundary";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Boom(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    // React and the boundary both log caught errors; keep test output clean
    // while still letting tests assert on the boundary's own call.
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    errorSpy.mockRestore();
  });

  it("renders its children when nothing throws", () => {
    act(() => root.render(<ErrorBoundary><p>fine</p></ErrorBoundary>));
    expect(container.innerHTML).toBe("<p>fine</p>");
  });

  it("replaces a throwing child with the fallback heading", () => {
    act(() => root.render(<ErrorBoundary><Boom /></ErrorBoundary>));
    expect(container.innerHTML).toBe("<h1>Something went wrong.</h1>");
  });

  it("logs the caught error with its component stack", () => {
    act(() => root.render(<ErrorBoundary><Boom /></ErrorBoundary>));
    const call = errorSpy.mock.calls.find((args) => args[0] === "Uncaught error:");
    expect(call).toBeDefined();
    expect((call![1] as Error).message).toBe("boom");
    expect(call![2]).toHaveProperty("componentStack");
  });

  it("derives error state from getDerivedStateFromError", () => {
    const Cls = ErrorBoundary as unknown as {
      getDerivedStateFromError(e: Error): { hasError: boolean };
    };
    expect(Cls.getDerivedStateFromError(new Error("x"))).toEqual({ hasError: true });
  });

  it("stays in the fallback state after a later re-render of the same boundary", () => {
    act(() => root.render(<ErrorBoundary><Boom /></ErrorBoundary>));
    act(() => root.render(<ErrorBoundary><p>fine</p></ErrorBoundary>));
    expect(container.innerHTML).toBe("<h1>Something went wrong.</h1>");
  });
});
