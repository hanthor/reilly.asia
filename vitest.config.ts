import { defineConfig } from "vitest/config";

// Separate from vite.config.ts, whose root is client/: tests live next to
// the code they cover in shared/, worker/ and client/src/.
export default defineConfig({
  test: {
    include: ["shared/**/*.test.ts", "worker/**/*.test.ts", "client/src/**/*.test.ts"],
    environment: "node",
    coverage: { include: ["shared/**", "worker/**"], reporter: ["text"] },
  },
});
