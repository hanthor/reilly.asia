import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn() className merge helper", () => {
  it("merges simple class strings", () => {
    const result = cn("px-2", "py-1")
    expect(result).toBe("px-2 py-1")
  })

  it("handles empty strings", () => {
    const result = cn("px-2", "", "py-1")
    expect(result).toBe("px-2 py-1")
  })

  it("handles undefined and null values", () => {
    const result = cn("px-2", undefined, null, "py-1")
    expect(result).toBe("px-2 py-1")
  })

  it("handles boolean values", () => {
    const result = cn("px-2", false && "hidden", true && "visible", "py-1")
    expect(result).toBe("px-2 visible py-1")
  })

  it("handles arrays of class names", () => {
    const result = cn(["px-2", "py-1"], ["rounded", "bg-white"])
    expect(result).toBe("px-2 py-1 rounded bg-white")
  })

  it("handles objects with class name keys", () => {
    const result = cn(
      { "px-2": true, "py-1": false },
      { rounded: true, "bg-white": false }
    )
    expect(result).toBe("px-2 rounded")
  })

  it("resolves Tailwind CSS conflicts using twMerge", () => {
    // conflicting padding classes — twMerge keeps the last one
    const result = cn("px-2 py-1", "px-4")
    expect(result).toBe("py-1 px-4")
  })

  it("resolves Tailwind CSS color conflicts", () => {
    // conflicting text colors — twMerge keeps the last one
    const result = cn("text-red-500", "text-blue-600")
    expect(result).toBe("text-blue-600")
  })

  it("handles width and height conflicts", () => {
    const result = cn("w-full h-12", "w-1/2")
    expect(result).toBe("h-12 w-1/2")
  })

  it("preserves non-conflicting classes when resolving conflicts", () => {
    const result = cn("px-2 py-1 rounded", "px-4")
    expect(result).toBe("py-1 rounded px-4")
  })

  it("handles display and flex conflicts", () => {
    const result = cn("flex flex-row", "flex flex-col", "gap-4")
    expect(result).toBe("flex flex-col gap-4")
  })

  it("combines variant classes correctly", () => {
    const result = cn(
      "bg-white dark:bg-slate-900",
      "text-black dark:text-white"
    )
    expect(result).toContain("bg-white")
    expect(result).toContain("dark:bg-slate-900")
    expect(result).toContain("text-black")
    expect(result).toContain("dark:text-white")
  })

  it("handles responsive breakpoint classes", () => {
    const result = cn("w-full md:w-1/2 lg:w-1/3", "md:w-2/3")
    expect(result).toContain("w-full")
    expect(result).toContain("lg:w-1/3")
    expect(result).toContain("md:w-2/3")
  })

  it("handles complex real-world button example", () => {
    const baseStyles = "px-4 py-2 rounded font-medium transition"
    const variantStyles = "bg-blue-600 text-white hover:bg-blue-700"
    const overrides = "px-6"

    const result = cn(baseStyles, variantStyles, overrides)
    expect(result).toContain("py-2")
    expect(result).toContain("rounded")
    expect(result).toContain("font-medium")
    expect(result).toContain("transition")
    expect(result).toContain("bg-blue-600")
    expect(result).toContain("text-white")
    expect(result).toContain("hover:bg-blue-700")
    expect(result).toContain("px-6")
    expect(result).not.toContain("px-4")
  })

  it("handles nested conditional classes", () => {
    const isActive = true
    const isDisabled = false

    const result = cn(
      "px-4 py-2",
      isActive && "bg-blue-600 text-white",
      isDisabled && "opacity-50 cursor-not-allowed",
      !isDisabled && "cursor-pointer"
    )

    expect(result).toContain("px-4")
    expect(result).toContain("py-2")
    expect(result).toContain("bg-blue-600")
    expect(result).toContain("text-white")
    expect(result).toContain("cursor-pointer")
    expect(result).not.toContain("opacity-50")
  })

  it("handles empty input", () => {
    const result = cn()
    expect(result).toBe("")
  })

  it("handles single string input", () => {
    const result = cn("px-4 py-2 rounded")
    expect(result).toBe("px-4 py-2 rounded")
  })

  it("combines clsx behavior with twMerge resolution in one call", () => {
    // clsx handles the conditional logic, twMerge handles tailwind conflicts
    const isLarge = true
    const isPrimary = false

    const result = cn(
      "px-2 py-1",
      isLarge && "px-4 py-2",
      isPrimary && "bg-blue-600",
      !isPrimary && "bg-gray-200"
    )

    expect(result).toContain("py-2")
    expect(result).toContain("bg-gray-200")
    expect(result).not.toContain("px-2")
    expect(result).not.toContain("bg-blue-600")
  })
})
