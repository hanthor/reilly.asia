import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusDot, toneFor, type DotTone } from "./status-dot"

describe("StatusDot component", () => {
  it("renders a span with inline-flex display", () => {
    const { container } = render(<StatusDot tone="up" />)
    const span = container.querySelector("span")
    expect(span).toHaveClass("relative", "inline-flex", "h-2.5", "w-2.5", "shrink-0")
  })

  it("renders with aria-hidden=true", () => {
    const { container } = render(<StatusDot tone="up" />)
    const span = container.querySelector("span")
    expect(span).toHaveAttribute("aria-hidden", "true")
  })

  describe("tone prop", () => {
    it("applies up tone class when tone is 'up'", () => {
      const { container } = render(<StatusDot tone="up" />)
      const dot = container.querySelector(".bg-\\[color\\:var\\(--ix-teal\\)\\]")
      expect(dot).toBeTruthy()
    })

    it("applies down tone class when tone is 'down'", () => {
      const { container } = render(<StatusDot tone="down" />)
      const dot = container.querySelector(".bg-\\[color\\:var\\(--ix-rust\\)\\]")
      expect(dot).toBeTruthy()
    })

    it("applies unknown tone class when tone is 'unknown'", () => {
      const { container } = render(<StatusDot tone="unknown" />)
      const dot = container.querySelector(".opacity-60")
      expect(dot).toBeTruthy()
    })

    it("applies offline tone class when tone is 'offline'", () => {
      const { container } = render(<StatusDot tone="offline" />)
      const dot = container.querySelector(".bg-\\[color\\:var\\(--ix-orange\\)\\]")
      expect(dot).toBeTruthy()
    })
  })

  describe("pulse prop", () => {
    it("does not render pulse span when pulse is false", () => {
      const { container } = render(<StatusDot tone="up" pulse={false} />)
      const pulseSpan = container.querySelector(".ix-ping")
      expect(pulseSpan).toBeNull()
    })

    it("renders pulse span when pulse is true", () => {
      const { container } = render(<StatusDot tone="up" pulse={true} />)
      const pulseSpan = container.querySelector(".ix-ping")
      expect(pulseSpan).toBeTruthy()
      expect(pulseSpan).toHaveClass("absolute", "inset-0", "rounded-full")
    })

    it("applies correct tone class to pulse span", () => {
      const { container } = render(<StatusDot tone="down" pulse={true} />)
      const pulseSpan = container.querySelector(".ix-ping")
      expect(pulseSpan).toBeTruthy()
    })

    it("renders static dot span always", () => {
      const { container } = render(<StatusDot tone="up" pulse={false} />)
      const staticSpans = container.querySelectorAll(".rounded-full")
      expect(staticSpans.length).toBeGreaterThan(0)
    })
  })

  describe("className prop", () => {
    it("merges custom className with default classes", () => {
      const { container } = render(<StatusDot tone="up" className="custom-class" />)
      const span = container.querySelector("span")
      expect(span).toHaveClass("custom-class", "relative", "inline-flex")
    })

    it("allows overriding default sizing via className", () => {
      const { container } = render(<StatusDot tone="up" className="h-4 w-4" />)
      const span = container.querySelector("span")
      expect(span).toHaveClass("h-4", "w-4")
    })
  })

  describe("toneFor helper function", () => {
    it("returns 'up' when passed true", () => {
      const result = toneFor(true)
      expect(result).toBe("up")
    })

    it("returns 'down' when passed false", () => {
      const result = toneFor(false)
      expect(result).toBe("down")
    })

    it("returns 'unknown' when passed undefined", () => {
      const result = toneFor(undefined)
      expect(result).toBe("unknown")
    })

    it("returns 'unknown' when passed null", () => {
      const result = toneFor(null)
      expect(result).toBe("unknown")
    })
  })

  describe("layout and structure", () => {
    it("renders two nested spans (pulse + static dot)", () => {
      const { container } = render(<StatusDot tone="up" pulse={true} />)
      const spans = container.querySelectorAll("span > span")
      expect(spans.length).toBe(1) // pulse span
    })

    it("renders one nested span when pulse is false", () => {
      const { container } = render(<StatusDot tone="up" pulse={false} />)
      const allSpans = container.querySelectorAll("span")
      // One outer wrapper span + one static dot span
      expect(allSpans.length).toBe(2)
    })
  })

  describe("accessibility", () => {
    it("hides decorative element with aria-hidden", () => {
      const { container } = render(<StatusDot tone="up" />)
      const span = container.querySelector("span")
      expect(span).toHaveAttribute("aria-hidden", "true")
    })

    it("maintains aria-hidden=true even with pulse", () => {
      const { container } = render(<StatusDot tone="up" pulse={true} />)
      const span = container.querySelector("span")
      expect(span).toHaveAttribute("aria-hidden", "true")
    })
  })

  describe("all tone combinations with pulse", () => {
    const tones: DotTone[] = ["up", "down", "unknown", "offline"]

    tones.forEach((tone) => {
      it(`renders ${tone} tone with pulse correctly`, () => {
        const { container } = render(<StatusDot tone={tone} pulse={true} />)
        expect(container.querySelector(".ix-ping")).toBeTruthy()
        expect(container.querySelector("span")).toHaveAttribute("aria-hidden", "true")
      })

      it(`renders ${tone} tone without pulse correctly`, () => {
        const { container } = render(<StatusDot tone={tone} pulse={false} />)
        expect(container.querySelector("span")).toHaveAttribute("aria-hidden", "true")
        expect(container.querySelector(".relative")).toBeTruthy()
      })
    })
  })
})
