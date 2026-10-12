import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "./theme-provider"

describe("ThemeProvider", () => {
  beforeEach(() => {
    document.documentElement.className = ""
    localStorage.clear()
  })

  it("provides theme context to children", () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    )
    
    expect(getByText("Test Content")).toBeInTheDocument()
  })

  it("applies dark theme class when theme is dark", () => {
    localStorage.setItem("theme", "dark")
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("does not apply dark class for light theme", () => {
    localStorage.setItem("theme", "light")
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("detects system color scheme preference", () => {
    const matchMediaMock = vi.fn(() => ({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    window.matchMedia = matchMediaMock
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    expect(matchMediaMock).toHaveBeenCalledWith("(prefers-color-scheme: dark)")
  })

  it("uses system preference when no theme is stored", () => {
    const matchMediaMock = vi.fn(() => ({
      matches: true, // System prefers dark
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    window.matchMedia = matchMediaMock
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    // Should apply dark class based on system preference
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("prefers stored theme over system preference", () => {
    const matchMediaMock = vi.fn(() => ({
      matches: true, // System prefers dark
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    window.matchMedia = matchMediaMock
    
    // Store light theme preference
    localStorage.setItem("theme", "light")
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    // Should respect stored preference over system
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("renders nested components with theme context", () => {
    const NestedComponent = () => {
      return <span>Nested Content</span>
    }
    
    render(
      <ThemeProvider>
        <div>
          <NestedComponent />
        </div>
      </ThemeProvider>
    )
    
    expect(screen.getByText("Nested Content")).toBeInTheDocument()
  })

  it("updates when localStorage theme changes", () => {
    localStorage.setItem("theme", "light")
    
    const { rerender } = render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    
    // Change theme
    localStorage.setItem("theme", "dark")
    rerender(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("handles system preference changes", () => {
    let darkModeListener: ((e: MediaQueryListEvent) => void) | null = null
    
    const matchMediaMock = vi.fn(() => ({
      matches: false, // Initially light
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === "change") {
          darkModeListener = listener
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    window.matchMedia = matchMediaMock
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )
    
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    
    // Simulate system preference change to dark
    if (darkModeListener) {
      darkModeListener({
        matches: true,
      } as MediaQueryListEvent)
    }
    
    // Theme should update based on system preference
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("supports multiple children", () => {
    render(
      <ThemeProvider>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ThemeProvider>
    )
    
    expect(screen.getByText("Child 1")).toBeInTheDocument()
    expect(screen.getByText("Child 2")).toBeInTheDocument()
    expect(screen.getByText("Child 3")).toBeInTheDocument()
  })
})
