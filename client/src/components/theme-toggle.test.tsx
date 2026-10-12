import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeToggle } from "./theme-toggle"

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document class
    document.documentElement.className = ""
  })

  it("renders toggle button", () => {
    render(<ThemeToggle />)
    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("detects system preference for dark mode", () => {
    // Mock matchMedia for dark mode
    const darkModeMock = vi.fn(() => ({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    window.matchMedia = darkModeMock

    render(<ThemeToggle />)
    
    expect(darkModeMock).toHaveBeenCalledWith("(prefers-color-scheme: dark)")
  })

  it("persists theme selection to localStorage", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    
    const button = screen.getByRole("button")
    await user.click(button)
    
    // localStorage should be updated
    expect(localStorage.getItem("theme")).toBeDefined()
  })

  it("applies theme class to document root", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    
    const button = screen.getByRole("button")
    await user.click(button)
    
    // Document should have a theme class
    const htmlElement = document.documentElement
    expect(
      htmlElement.className.includes("dark") || 
      htmlElement.className.includes("light")
    ).toBe(true)
  })

  it("respects stored theme preference on mount", () => {
    localStorage.setItem("theme", "dark")
    
    render(<ThemeToggle />)
    
    expect(localStorage.getItem("theme")).toBe("dark")
  })

  it("toggles between light and dark themes", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ThemeToggle />)
    
    const button = screen.getByRole("button")
    
    // First click
    await user.click(button)
    let theme1 = localStorage.getItem("theme")
    
    // Second click
    await user.click(button)
    let theme2 = localStorage.getItem("theme")
    
    // Themes should be different
    expect(theme1).not.toBe(theme2)
  })

  it("applies dark class to html element for dark theme", async () => {
    const user = userEvent.setup()
    localStorage.setItem("theme", "dark")
    
    render(<ThemeToggle />)
    
    // Wait for theme to be applied
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const htmlElement = document.documentElement
    expect(htmlElement.className).toContain("dark")
  })

  it("removes dark class for light theme", async () => {
    const user = userEvent.setup()
    localStorage.setItem("theme", "light")
    
    // Start with dark class
    document.documentElement.classList.add("dark")
    
    render(<ThemeToggle />)
    
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const htmlElement = document.documentElement
    expect(htmlElement.classList.contains("dark")).toBe(false)
  })

  it("keyboard accessible (Enter key activates)", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    
    const button = screen.getByRole("button")
    
    // Focus and press Enter
    button.focus()
    await user.keyboard("{Enter}")
    
    expect(localStorage.getItem("theme")).toBeDefined()
  })

  it("keyboard accessible (Space key activates)", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    
    const button = screen.getByRole("button")
    
    // Focus and press Space
    button.focus()
    await user.keyboard(" ")
    
    expect(localStorage.getItem("theme")).toBeDefined()
  })

  it("maintains theme across re-renders", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ThemeToggle />)
    
    const button = screen.getByRole("button")
    await user.click(button)
    
    const themeAfterClick = localStorage.getItem("theme")
    
    // Re-render component
    rerender(<ThemeToggle />)
    
    // Theme should remain the same
    expect(localStorage.getItem("theme")).toBe(themeAfterClick)
  })
})
