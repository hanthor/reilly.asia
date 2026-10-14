import react from "@vitest/plugin-react";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts, whose root is client/: tests live next to
// the code they cover in shared/, worker/ and client/src/.
export default defineConfig({
  plugins: [react()],
  test: {
    include: [
      "shared/**/*.test.ts",
      "worker/**/*.test.ts",
      "client/src/**/*.test.ts",
    ],
    // Use node environment by default; individual test files can override
    // with @vitest-environment jsdom for DOM/React testing
    environment: "node",
    coverage: {
      include: ["shared/**", "worker/**", "client/src/**"],
      reporter: ["text"],
      exclude: ["**/*.test.ts", "**/node_modules/**"],
    },
  },
});
