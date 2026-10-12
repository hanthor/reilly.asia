import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LinkedBadge } from "./linked-badge"

describe("LinkedBadge", () => {
  it("renders badge without link when URL not in links map", () => {
    const { container } = render(
      <LinkedBadge
        tag="typescript"
        links={{}}
        className="bg-blue-100"
      />
    )
    
    expect(screen.getByText("typescript")).toBeInTheDocument()
    const link = container.querySelector("a")
    expect(link).not.toBeInTheDocument()
  })

  it("renders badge with link when URL exists in links map", () => {
    const { container } = render(
      <LinkedBadge
        tag="react"
        links={{ react: "https://react.dev" }}
        className="bg-blue-100"
      />
    )
    
    expect(screen.getByText("react")).toBeInTheDocument()
    const link = container.querySelector("a")
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://react.dev")
  })

  it("applies security attributes to external link", () => {
    const { container } = render(
      <LinkedBadge
        tag="nodejs"
        links={{ nodejs: "https://nodejs.org" }}
        className="bg-green-100"
      />
    )
    
    const link = container.querySelector("a")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("applies custom className to badge", () => {
    const { container } = render(
      <LinkedBadge
        tag="rust"
        links={{}}
        className="text-red-700 bg-red-100"
      />
    )
    
    const badge = container.querySelector("div[class*='badge']")
    expect(badge).toHaveClass("text-red-700")
  })

  it("preserves link color with inline style", () => {
    const { container } = render(
      <LinkedBadge
        tag="python"
        links={{ python: "https://python.org" }}
        className="bg-yellow-100"
      />
    )
    
    const link = container.querySelector("a")
    expect(link).toHaveStyle({ color: "inherit" })
  })

  it("applies focus and hover styles to link", () => {
    const { container } = render(
      <LinkedBadge
        tag="go"
        links={{ go: "https://golang.org" }}
        className="bg-cyan-100"
      />
    )
    
    const link = container.querySelector("a")
    const className = link?.className
    expect(className).toContain("focus-visible:ring-2")
    expect(className).toContain("hover:opacity-80")
    expect(className).toContain("transition-opacity")
  })

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <LinkedBadge
        tag="ruby"
        links={{ ruby: "https://ruby-lang.org" }}
        className="bg-red-900"
      />
    )
    
    const link = container.querySelector("a") as HTMLAnchorElement
    expect(link).toBeInTheDocument()
    
    await user.tab()
    expect(link).toHaveFocus()
  })

  it("renders badge with outline variant", () => {
    render(
      <LinkedBadge
        tag="c++"
        links={{}}
        className="border-2 border-gray-300"
      />
    )
    
    expect(screen.getByText("c++")).toBeInTheDocument()
  })

  it("supports multiple tags in links configuration", () => {
    const { container } = render(
      <LinkedBadge
        tag="kotlin"
        links={{
          java: "https://java.com",
          kotlin: "https://kotlinlang.org",
          scala: "https://scala-lang.org",
        }}
        className="bg-purple-100"
      />
    )
    
    const link = container.querySelector("a")
    expect(link).toHaveAttribute("href", "https://kotlinlang.org")
  })

  it("renders badge text correctly in both linked and unlinked states", () => {
    const { rerender } = render(
      <LinkedBadge
        tag="svelte"
        links={{}}
        className="bg-orange-100"
      />
    )
    
    expect(screen.getByText("svelte")).toBeInTheDocument()
    
    rerender(
      <LinkedBadge
        tag="svelte"
        links={{ svelte: "https://svelte.dev" }}
        className="bg-orange-100"
      />
    )
    
    expect(screen.getByText("svelte")).toBeInTheDocument()
  })
})
