import { defineConfig, type Plugin } from "vite";
import fs from "fs";
import react from "@vitejs/plugin-react";
import path from "path";
import { featuredRepos, type RepoStats } from "./shared/featured-repos";

// Fetch star/fork counts once per build so visitors' browsers never call the
// GitHub API. Best-effort: any failure just yields no counts for that repo.
async function fetchRepoStats(): Promise<RepoStats> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const entries = await Promise.all(
    featuredRepos.map(async (repo) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { stargazers_count: number; forks_count: number };
        return [repo.toLowerCase(), { stars: data.stargazers_count, forks: data.forks_count }] as const;
      } catch {
        return null;
      }
    }),
  );
  const stats = Object.fromEntries(entries.filter((e) => e !== null));
  console.log(`[github-stats] fetched ${Object.keys(stats).length}/${featuredRepos.length} repos`);
  return stats;
}

// Workers Static Assets serves 404.html (with a 404 status) for unknown paths
// when wrangler.jsonc sets not_found_handling: "404-page". It is the SPA shell,
// so the client router renders the NotFound page.
function spa404(): Plugin {
  let outDir = "";
  return {
    name: "spa-404-page",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      fs.copyFileSync(path.join(outDir, "index.html"), path.join(outDir, "404.html"));
    },
  };
}

export default defineConfig(async () => ({
  plugins: [react(), spa404()],
  define: {
    __GITHUB_STATS__: JSON.stringify(await fetchRepoStats()),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: [".env", ".env.*", "*.{crt,pem}"],
    },
  },
}));
