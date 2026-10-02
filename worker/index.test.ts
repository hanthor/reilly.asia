import { describe, expect, it } from "vitest";
import worker from "./index";
import { SECURITY_HEADERS } from "./security-headers";

const ctx = { waitUntil: () => undefined };

describe("Worker security headers", () => {
  it("hardens responses returned by the static asset binding", async () => {
    const env = {
      ASSETS: { fetch: async () => new Response("asset", { headers: { "Content-Type": "text/html" } }) },
    };

    const response = await worker.fetch(new Request("https://reilly.asia/"), env, ctx);

    expect(await response.text()).toBe("asset");
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });

  it("hardens Worker-generated error responses", async () => {
    const env = { ASSETS: { fetch: async () => new Response("unused") } };

    const response = await worker.fetch(new Request("https://reilly.asia/infra/api/unknown"), env, ctx);

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Security-Policy")).toBe(SECURITY_HEADERS["Content-Security-Policy"]);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
