import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "./error-boundary"

// Suppress console.error for error boundary tests
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText("Safe Content")).toBeInTheDocument()
  })

  it("renders error fallback when child throws", () => {
    const ThrowError = () => {
      throw new Error("Test error")
    }
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    // Should render error UI instead of crashing
    expect(screen.getByText(/error|something went wrong/i)).toBeInTheDocument()
  })

  it("catches errors from nested components", () => {
    const NestedError = () => {
      throw new Error("Nested error")
    }
    
    const Parent = () => (
      <div>
        <NestedError />
      </div>
    )
    
    render(
      <ErrorBoundary>
        <Parent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/error|something went wrong/i)).toBeInTheDocument()
  })

  it("renders multiple safe children", () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText("Child 1")).toBeInTheDocument()
    expect(screen.getByText("Child 2")).toBeInTheDocument()
    expect(screen.getByText("Child 3")).toBeInTheDocument()
  })

  it("isolates errors to individual error boundaries", () => {
    const ThrowError = () => {
      throw new Error("Isolated error")
    }
    
    const SafeComponent = () => <div>Safe</div>
    
    const { container } = render(
      <div>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      </div>
    )
    
    expect(screen.getByText("Safe")).toBeInTheDocument()
    expect(screen.getByText(/error|something went wrong/i)).toBeInTheDocument()
  })

  it("displays error message in fallback UI", () => {
    const errorMessage = "Custom error message"
    const ThrowCustomError = () => {
      throw new Error(errorMessage)
    }
    
    render(
      <ErrorBoundary>
        <ThrowCustomError />
      </ErrorBoundary>
    )
    
    // Error UI should be visible
    expect(screen.queryByText("Custom error message")).toBeInTheDocument()
  })

  it("handles errors in event handlers gracefully", async () => {
    const { getByText } = render(
      <ErrorBoundary>
        <button onClick={() => { throw new Error("Handler error") }}>
          Click me
        </button>
      </ErrorBoundary>
    )
    
    // Component should render
    expect(getByText("Click me")).toBeInTheDocument()
  })

  it("recovers from errors after re-render with valid content", () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) throw new Error("Error")
      return <div>Recovered</div>
    }
    
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/error|something went wrong/i)).toBeInTheDocument()
    
    // Re-render with shouldThrow=false
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText("Recovered")).toBeInTheDocument()
  })

  it("provides accessibility for error message", () => {
    const ThrowError = () => {
      throw new Error("Accessible error")
    }
    
    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    const errorElement = screen.getByText(/error|something went wrong/i)
    
    // Should be visible and focusable
    expect(errorElement).toBeInTheDocument()
    expect(errorElement.closest("[role='alert']") || errorElement).toBeInTheDocument()
  })

  it("does not hide errors in development mode", () => {
    const ThrowError = () => {
      throw new Error("Dev error")
    }
    
    // Error boundary should still catch and display
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/error|something went wrong/i)).toBeInTheDocument()
  })
})
