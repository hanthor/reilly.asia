// The few Workers-runtime extensions this Worker uses, declared locally so it
// typechecks (`npx tsc -p worker`) without pulling in @cloudflare/workers-types.

interface RequestInit {
  cf?: { cacheTtl?: number; cacheEverything?: boolean };
}

interface CacheStorage {
  readonly default: Cache;
}
