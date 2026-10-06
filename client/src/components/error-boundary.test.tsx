import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import ErrorBoundary from "./error-boundary"

// Mock console.error to avoid noise in test output
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

// Test component that throws an error
const ThrowingComponent = () => {
  throw new Error("Test error")
}

// Test component that renders normally
const WorkingComponent = () => <div>Working content</div>

describe("ErrorBoundary component", () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear()
  })

  describe("rendering normal children", () => {
    it("renders children when no error is thrown", () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )
      expect(screen.getByText("Working content")).toBeTruthy()
    })

    it("renders multiple children correctly", () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      )
      expect(screen.getByText("Child 1")).toBeTruthy()
      expect(screen.getByText("Child 2")).toBeTruthy()
    })

    it("renders text nodes as children", () => {
      render(<ErrorBoundary>Plain text content</ErrorBoundary>)
      expect(screen.getByText("Plain text content")).toBeTruthy()
    })

    it("renders complex component trees", () => {
      render(
        <ErrorBoundary>
          <div>
            <section>
              <article>Deep content</article>
            </section>
          </div>
        </ErrorBoundary>
      )
      expect(screen.getByText("Deep content")).toBeTruthy()
    })
  })

  describe("error handling", () => {
    it("catches errors from child components", () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowingComponent />
          </ErrorBoundary>
        )
      }).not.toThrow()
    })

    it("displays error message when child throws", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      expect(screen.getByText("Something went wrong.")).toBeTruthy()
    })

    it("logs error to console.error when caught", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Uncaught error:",
        expect.any(Error),
        expect.any(Object)
      )
    })

    it("includes error message in console output", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      const error = consoleErrorSpy.mock.calls[0][1] as Error
      expect(error.message).toBe("Test error")
    })

    it("includes errorInfo in console output", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      const errorInfo = consoleErrorSpy.mock.calls[0][2]
      expect(errorInfo).toHaveProperty("componentStack")
    })
  })

  describe("state management", () => {
    it("initializes with hasError false", () => {
      const { container } = render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )
      expect(container.textContent).not.toContain("Something went wrong")
    })

    it("sets hasError to true when error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      expect(screen.getByText("Something went wrong.")).toBeTruthy()
    })

    it("renders error message as h1", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      const heading = screen.getByRole("heading", { level: 1 })
      expect(heading.textContent).toBe("Something went wrong.")
    })
  })

  describe("getDerivedStateFromError", () => {
    it("updates state from error when thrown", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      // If state wasn't updated, we'd see children rendered, not error message
      expect(screen.queryByText("Working content")).toBeNull()
      expect(screen.getByText("Something went wrong.")).toBeTruthy()
    })

    it("works with different error types", () => {
      const ComponentWithCustomError = () => {
        throw new Error("Custom error message")
      }

      render(
        <ErrorBoundary>
          <ComponentWithCustomError />
        </ErrorBoundary>
      )
      expect(screen.getByText("Something went wrong.")).toBeTruthy()
    })
  })

  describe("componentDidCatch", () => {
    it("is called when error is caught", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it("is not called when no error occurs", () => {
      consoleErrorSpy.mockClear()
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it("receives errorInfo with componentStack", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      const errorInfo = consoleErrorSpy.mock.calls[0][2]
      expect(errorInfo.componentStack).toBeTruthy()
      expect(typeof errorInfo.componentStack).toBe("string")
    })
  })

  describe("rendering logic", () => {
    it("renders error message h1 when hasError is true", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      const h1 = container.querySelector("h1")
      expect(h1?.textContent).toBe("Something went wrong.")
    })

    it("renders children when hasError is false", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Content</div>
        </ErrorBoundary>
      )
      expect(screen.getByTestId("child")).toBeTruthy()
    })

    it("does not render both error message and children", () => {
      const { container } = render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )
      const h1 = container.querySelector("h1")
      expect(h1).toBeNull()
      expect(screen.getByText("Working content")).toBeTruthy()
    })
  })

  describe("multiple error boundaries", () => {
    it("handles multiple error boundaries independently", () => {
      const { container } = render(
        <div>
          <ErrorBoundary>
            <WorkingComponent />
          </ErrorBoundary>
          <ErrorBoundary>
            <ThrowingComponent />
          </ErrorBoundary>
        </div>
      )
      expect(screen.getByText("Working content")).toBeTruthy()
      const h1Elements = container.querySelectorAll("h1")
      expect(h1Elements.length).toBe(1)
      expect(h1Elements[0].textContent).toBe("Something went wrong.")
    })
  })

  describe("edge cases", () => {
    it("handles null children", () => {
      const { container } = render(<ErrorBoundary>{null}</ErrorBoundary>)
      expect(container).toBeTruthy()
    })

    it("handles undefined children", () => {
      const { container } = render(<ErrorBoundary>{undefined}</ErrorBoundary>)
      expect(container).toBeTruthy()
    })

    it("handles empty fragment as children", () => {
      const { container } = render(
        <ErrorBoundary>
          <>
            <WorkingComponent />
          </>
        </ErrorBoundary>
      )
      expect(screen.getByText("Working content")).toBeTruthy()
    })

    it("handles React.Fragment as children", () => {
      render(
        <ErrorBoundary>
          <div>Content 1</div>
          <div>Content 2</div>
        </ErrorBoundary>
      )
      expect(screen.getByText("Content 1")).toBeTruthy()
      expect(screen.getByText("Content 2")).toBeTruthy()
    })
  })

  describe("accessibility", () => {
    it("renders error message as semantic heading", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )
      const heading = screen.getByRole("heading", { level: 1 })
      expect(heading).toBeTruthy()
    })

    it("preserves semantic structure of children", () => {
      render(
        <ErrorBoundary>
          <main>
            <h2>Main content</h2>
            <p>Paragraph</p>
          </main>
        </ErrorBoundary>
      )
      expect(screen.getByRole("heading", { level: 2 })).toBeTruthy()
      expect(screen.getByText("Paragraph")).toBeTruthy()
    })
  })
})
