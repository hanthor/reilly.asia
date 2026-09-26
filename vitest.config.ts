import path from "path";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts, whose root is client/: tests live next to
// the code they cover in shared/, worker/ and client/src/.
export default defineConfig({
  // The same aliases vite.config.ts and tsconfig.json use, so a client module
  // that imports "@shared/…" or "@/…" resolves under test too.
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    include: ["shared/**/*.test.ts", "worker/**/*.test.ts", "client/src/**/*.test.ts"],
    environment: "node",
    coverage: { include: ["shared/**", "worker/**"], reporter: ["text"] },
  },
});
