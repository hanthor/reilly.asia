import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  HANDBOOK_CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from "./security-headers";

function staticAssetHeaders(): Map<string, string> {
  const file = readFileSync(new URL("../client/public/_headers", import.meta.url), "utf8");
  const globalBlock = file.split("\n\n", 1)[0];
  return new Map(
    globalBlock
      .split("\n")
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        return [line.slice(0, separator), line.slice(separator + 1).trim()];
      }),
  );
}

describe("withSecurityHeaders", () => {
  it("adds the complete security policy without discarding response metadata", async () => {
    const response = withSecurityHeaders(
      new Response("not found", {
        status: 404,
        statusText: "Missing",
        headers: { "Cache-Control": "public, max-age=30" },
      }),
    );

    expect(response.status).toBe(404);
    expect(response.statusText).toBe("Missing");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=30");
    expect(await response.text()).toBe("not found");
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });

  it("preserves a route-specific content security policy", () => {
    const response = withSecurityHeaders(
      new Response(null, { headers: { "Content-Security-Policy": HANDBOOK_CONTENT_SECURITY_POLICY } }),
    );
    expect(response.headers.get("Content-Security-Policy")).toBe(HANDBOOK_CONTENT_SECURITY_POLICY);
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("keeps the static asset and Worker policies identical", () => {
    const staticHeaders = staticAssetHeaders();
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(staticHeaders.get(name)).toBe(value);
    }
  });
});
