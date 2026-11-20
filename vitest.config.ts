import path from "node:path";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts, whose root is client/: tests live next to
// the code they cover in shared/, worker/ and client/src/. Component tests
// (*.test.tsx) opt into jsdom with a `// @vitest-environment jsdom` docblock.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    include: ["shared/**/*.test.ts", "worker/**/*.test.ts", "client/src/**/*.test.ts", "client/src/**/*.test.tsx"],
    environment: "node",
    coverage: { include: ["shared/**", "worker/**"], reporter: ["text"] },
  },
});
