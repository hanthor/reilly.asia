import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
  describe("basic string joining", () => {
    it("joins multiple class strings", () => {
      expect(cn("px-2", "py-3")).toBe("px-2 py-3");
    });

    it("joins three or more classes", () => {
      expect(cn("text-sm", "font-bold", "text-red-500")).toBe(
        "text-sm font-bold text-red-500"
      );
    });

    it("handles empty input", () => {
      expect(cn()).toBe("");
    });

    it("handles single class", () => {
      expect(cn("px-4")).toBe("px-4");
    });
  });

  describe("falsy value filtering", () => {
    it("filters out undefined", () => {
      expect(cn("px-2", undefined, "py-3")).toBe("px-2 py-3");
    });

    it("filters out null", () => {
      expect(cn("px-2", null, "py-3")).toBe("px-2 py-3");
    });

    it("filters out false", () => {
      expect(cn("px-2", false, "py-3")).toBe("px-2 py-3");
    });

    it("filters out empty strings", () => {
      expect(cn("px-2", "", "py-3")).toBe("px-2 py-3");
    });

    it("filters out 0 (falsy number)", () => {
      expect(cn("px-2", 0, "py-3")).toBe("px-2 py-3");
    });

    it("handles all falsy values together", () => {
      expect(cn("px-2", undefined, null, false, "", 0, "py-3")).toBe(
        "px-2 py-3"
      );
    });

    it("preserves true as truthy (though not a class)", () => {
      // clsx behavior: true is filtered out as a non-string
      expect(cn("px-2", true, "py-3")).toBe("px-2 py-3");
    });
  });

  describe("conditional class objects", () => {
    it("includes classes when condition is true", () => {
      expect(cn({ "px-2": true, "py-3": false })).toBe("px-2");
    });

    it("excludes classes when condition is false", () => {
      expect(cn({ "text-red-500": false, "text-blue-500": true })).toBe(
        "text-blue-500"
      );
    });

    it("handles mixed object and string inputs", () => {
      expect(
        cn("px-2", { "py-3": true, "py-4": false }, "text-sm")
      ).toBe("px-2 py-3 text-sm");
    });

    it("handles objects with all false conditions", () => {
      expect(cn("px-2", { "py-3": false, "py-4": false })).toBe("px-2");
    });

    it("handles objects with all true conditions", () => {
      expect(cn({ "px-2": true, "py-3": true })).toBe("px-2 py-3");
    });
  });

  describe("array flattening", () => {
    it("flattens single-level arrays", () => {
      expect(cn(["px-2", "py-3"], "text-sm")).toBe("px-2 py-3 text-sm");
    });

    it("flattens nested arrays", () => {
      expect(cn([["px-2", "py-3"], "text-sm"])).toBe("px-2 py-3 text-sm");
    });

    it("flattens arrays with falsy values", () => {
      expect(cn(["px-2", undefined, "py-3"])).toBe("px-2 py-3");
    });

    it("flattens arrays with conditional objects", () => {
      expect(
        cn(["px-2", { "py-3": true, "py-4": false }])
      ).toBe("px-2 py-3");
    });

    it("handles mixed arrays and non-arrays", () => {
      expect(cn(["px-2", "py-3"], "text-sm", ["font-bold"])).toBe(
        "px-2 py-3 text-sm font-bold"
      );
    });
  });

  describe("tailwind-merge: conflict resolution", () => {
    it("resolves padding conflicts (last wins)", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("resolves text color conflicts", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("resolves background color conflicts", () => {
      expect(cn("bg-red-100", "bg-blue-100")).toBe("bg-blue-100");
    });

    it("resolves display conflicts", () => {
      expect(cn("block", "inline-block")).toBe("inline-block");
    });

    it("resolves width conflicts", () => {
      expect(cn("w-full", "w-1/2")).toBe("w-1/2");
    });

    it("resolves height conflicts", () => {
      expect(cn("h-screen", "h-32")).toBe("h-32");
    });

    it("resolves margin conflicts", () => {
      expect(cn("m-4", "m-8")).toBe("m-8");
    });

    it("handles abbreviated vs expanded padding", () => {
      // px and py conflict with p
      expect(cn("p-2", "px-4")).toBe("p-2 px-4");
    });

    it("resolves with modifier variants", () => {
      expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe(
        "hover:bg-blue-500"
      );
    });

    it("resolves dark mode variants", () => {
      expect(cn("dark:text-white", "dark:text-gray-200")).toBe(
        "dark:text-gray-200"
      );
    });
  });

  describe("non-conflicting utilities merge", () => {
    it("preserves non-conflicting classes", () => {
      expect(cn("px-2", "py-3", "text-sm")).toBe("px-2 py-3 text-sm");
    });

    it("merges text styling with spacing", () => {
      expect(cn("text-lg", "font-bold", "p-4")).toBe(
        "p-4 text-lg font-bold"
      );
    });

    it("merges layout with colors", () => {
      expect(cn("flex", "gap-4", "text-red-500", "bg-white")).toBe(
        "flex gap-4 bg-white text-red-500"
      );
    });

    it("handles complex non-conflicting combinations", () => {
      expect(
        cn(
          "flex",
          "flex-col",
          "gap-2",
          "p-4",
          "text-sm",
          "text-gray-700",
          "bg-white",
          "rounded-lg",
          "shadow"
        )
      ).toContain("flex");
      expect(
        cn(
          "flex",
          "flex-col",
          "gap-2",
          "p-4",
          "text-sm",
          "text-gray-700",
          "bg-white",
          "rounded-lg",
          "shadow"
        )
      ).toContain("gap-2");
      expect(
        cn(
          "flex",
          "flex-col",
          "gap-2",
          "p-4",
          "text-sm",
          "text-gray-700",
          "bg-white",
          "rounded-lg",
          "shadow"
        )
      ).toContain("text-gray-700");
    });
  });

  describe("non-tailwind classes passthrough", () => {
    it("preserves custom CSS class names", () => {
      expect(cn("custom-class", "px-2")).toContain("custom-class");
      expect(cn("custom-class", "px-2")).toContain("px-2");
    });

    it("handles custom classes with hyphens", () => {
      expect(cn("my-custom-utility", "text-sm")).toContain("my-custom-utility");
      expect(cn("my-custom-utility", "text-sm")).toContain("text-sm");
    });

    it("preserves arbitrary values", () => {
      // tailwind-merge preserves arbitrary values like [color:red]
      expect(cn("[color:red]", "px-2")).toContain("[color:red]");
    });

    it("handles mixed tailwind and custom classes", () => {
      const result = cn(
        "px-2",
        "my-custom-style",
        "py-3",
        "another-custom"
      );
      expect(result).toContain("px-2");
      expect(result).toContain("my-custom-style");
      expect(result).toContain("py-3");
      expect(result).toContain("another-custom");
    });
  });

  describe("real-world ui component patterns", () => {
    it("base button with conditional variants", () => {
      const base = "px-4 py-2 rounded font-semibold";
      const variant = { "bg-blue-500 text-white": true, "bg-gray-200": false };
      const size = { "text-sm": true, "text-lg": false };
      expect(cn(base, variant, size)).toContain("px-4");
      expect(cn(base, variant, size)).toContain("bg-blue-500");
      expect(cn(base, variant, size)).toContain("text-white");
      expect(cn(base, variant, size)).toContain("text-sm");
    });

    it("card with optional styling", () => {
      const baseCard = "rounded-lg p-4 bg-white";
      const optional = [
        "shadow" ? "shadow-md" : undefined,
        "border" ? "border border-gray-200" : undefined,
      ];
      const result = cn(baseCard, ...optional);
      expect(result).toContain("rounded-lg");
      expect(result).toContain("p-4");
      expect(result).toContain("bg-white");
    });

    it("input with state-based styling", () => {
      const error = true;
      const disabled = false;
      const baseInput =
        "px-3 py-2 border rounded focus:outline-none focus:ring-2";
      const stateClass = {
        "border-red-500 focus:ring-red-500": error,
        "border-gray-300 focus:ring-blue-500": !error,
        "opacity-50 cursor-not-allowed": disabled,
      };
      const result = cn(baseInput, stateClass);
      expect(result).toContain("px-3");
      expect(result).toContain("border-red-500");
      expect(result).toContain("focus:ring-red-500");
    });
  });

  describe("edge cases", () => {
    it("handles very long class strings", () => {
      const longClass =
        "flex flex-col gap-2 p-4 text-sm text-gray-700 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200";
      expect(cn(longClass)).toBe(longClass);
    });

    it("handles many inputs", () => {
      const result = cn(
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j"
      );
      expect(result).toContain("a");
      expect(result).toContain("j");
    });

    it("handles deeply nested structures", () => {
      expect(cn([[[["px-2"], "py-3"]], "text-sm"])).toBe(
        "px-2 py-3 text-sm"
      );
    });

    it("handles whitespace-only strings gracefully", () => {
      expect(cn("px-2", "  ", "py-3")).toBe("px-2 py-3");
    });
  });
});
