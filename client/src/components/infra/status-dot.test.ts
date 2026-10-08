import { describe, it, expect } from "vitest";
import { toneFor, type DotTone } from "./status-dot";

describe("StatusDot utilities", () => {
  describe("toneFor", () => {
    it("returns 'up' when status is true", () => {
      expect(toneFor(true)).toBe("up");
    });

    it("returns 'down' when status is false", () => {
      expect(toneFor(false)).toBe("down");
    });

    it("returns 'unknown' when status is null", () => {
      expect(toneFor(null)).toBe("unknown");
    });

    it("returns 'unknown' when status is undefined", () => {
      expect(toneFor(undefined)).toBe("unknown");
    });

    it("maps all valid tones correctly", () => {
      const tones: Array<[boolean | null | undefined, DotTone]> = [
        [true, "up"],
        [false, "down"],
        [null, "unknown"],
        [undefined, "unknown"],
      ];

      tones.forEach(([input, expected]) => {
        expect(toneFor(input)).toBe(expected);
      });
    });
  });
});
