import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate from vite.config.ts, whose root is client/: tests live next to
// the code they cover in shared/, worker/ and client/src/.
// Client tests use jsdom for DOM/React APIs; shared/ and worker/ use node.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["shared/**/*.test.ts", "worker/**/*.test.ts", "client/src/**/*.test.ts"],
    // Use jsdom for client tests (DOM + React), node for everything else
    environment: "jsdom",
    setupFiles: [],
    coverage: {
      include: ["shared/**", "worker/**", "client/src/**"],
      reporter: ["text"],
    },
    environmentOptions: {
      jsdom: {
        // Configure jsdom for React component testing
        html: '<html lang="en"><body></body></html>',
      },
    },
  },
});
