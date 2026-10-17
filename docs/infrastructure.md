# Infrastructure & Configuration Reference

Complete reference for environment variables, infrastructure setup, and system configuration.

## Environment Variables

### Development (`.env.local`)

Create `.env.local` in the project root (not committed to git):

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5173

# Optional: GitHub token (for higher API rate limits during development)
# VITE_GITHUB_TOKEN=ghp_xxxxx

# Optional: Enable debug logging
DEBUG=reilly:*
```

### Build-Time (`wrangler.jsonc`)

```json
{
  "env": {
    "production": {
      "vars": {
        "GITHUB_API_BASE": "https://api.github.com",
        "CACHE_TTL": "3600"
      },
      "secrets": [
        "GITHUB_TOKEN"
      ]
    },
    "development": {
      "vars": {
        "GITHUB_API_BASE": "https://api.github.com",
        "CACHE_TTL": "60"
      }
    }
  }
}
```

### Production (Cloudflare Pages)

Set in Cloudflare dashboard → **Pages** → **Settings** → **Environment variables**:

```
GITHUB_TOKEN = ghp_xxxxx          (Secret, not visible in logs)
CACHE_TTL = 3600                   (1 hour cache for API responses)
API_RATE_LIMIT = 60                (Requests per minute)
```

## Service Configuration

### GitHub API

**Endpoint**: `https://api.github.com`

**Authentication**:
- Unauthenticated: 60 requests/hour per IP
- Authenticated (with token): 5,000 requests/hour per user

**Setup authenticated requests**:

1. Generate GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Create **Fine-grained personal access token** or **Classic token**
   - Scopes needed: `public_repo` (public repositories only)

2. Add to Cloudflare:
   ```
   GITHUB_TOKEN = ghp_xxxxxxxxxxxxx
   ```

3. Use in code:
   ```tsx
   // worker/routes.ts
   const headers = {
     'Authorization': `token ${env.GITHUB_TOKEN}`,
     'Accept': 'application/vnd.github.v3+json'
   }
   ```

### Cloudflare Workers

**Runtime**: JavaScript (V8 engine)

**Constraints**:
- Max CPU time: 30 seconds (Bundled plan) or 50ms (Free plan)
- Max request size: 100 MB
- Max response size: 100 MB
- Timeout: 30 seconds

**Access credentials**:
- API Token: Generate at https://dash.cloudflare.com/profile/api-tokens
- Account ID: Available at https://dash.cloudflare.com

**Deploy Workers**:
```bash
npm run deploy
# Or use wrangler directly:
wrangler deploy
```

### Cloudflare Pages

**Runtime**: Static file hosting + Serverless Functions (Workers)

**Build Configuration** (`.wrangler.jsonc`):
```json
{
  "pages_build_caching": {
    "default_cache_control": "public, max-age=3600"
  }
}
```

**Deployment webhook**: Triggered automatically on git push to `main`

## Infrastructure Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                   │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                    HTTPS Request
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Cloudflare Edge Network (CDN)                   │
│                      (Global caching layer)                       │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                   Is cached or static file?
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
    Return from         Route to API          Not found
    cache/origin        (*/api/*)              (404)
                             │
                             ▼
        ┌─────────────────────────────────────────────────┐
        │  Cloudflare Worker (worker/routes.ts)          │
        │                                                 │
        │  ┌──────────────────────────────────────────┐  │
        │  │ Parse request & route to handler        │  │
        │  │ Apply authentication if needed          │  │
        │  │ Call external APIs if necessary         │  │
        │  └──────────────────────────────────────────┘  │
        └────────────┬──────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   GitHub API (or other APIs)    │
        │  https://api.github.com/...    │
        └────────────────────────────────┘
```

## Build & Deployment Pipeline

```
Source Code (git)
    │
    ▼ (git push to main)
GitHub Actions CI
    │
    ├─ npm ci
    ├─ npm run check (TypeScript)
    ├─ npm run test (Vitest)
    ├─ npm run build
    │   ├─ vite build → dist/client/*
    │   └─ esbuild → dist/server/* (local only)
    │
    ▼
Cloudflare Pages
    ├─ Upload dist/client/* (static assets)
    ├─ Build dist/server/* (local testing only)
    └─ Deploy worker/* (serverless functions)
    │
    ▼
Production at https://reilly.asia
```

## Performance Targets

### Load Time

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint (FCP) | <1.5s | Monitor in Cloudflare Analytics |
| Largest Contentful Paint (LCP) | <2.5s | Monitor in Cloudflare Analytics |
| Cumulative Layout Shift (CLS) | <0.1 | Monitor in PageSpeed Insights |
| Time to Interactive (TTI) | <3.5s | Monitor in WebPageTest |

### Bundle Size

| Asset | Target | Current |
|-------|--------|---------|
| HTML | <30 KB | ~10 KB |
| JavaScript | <50 KB gzipped | ~40 KB |
| CSS | <20 KB gzipped | ~10 KB |
| Total | <100 KB gzipped | ~60 KB |

### Caching

| Resource Type | Cache Duration | Policy |
|---------------|-----------------|--------|
| HTML | 5 minutes | public, max-age=300 |
| JS/CSS | 1 year | public, max-age=31536000 |
| Images | 1 year | public, max-age=31536000 |
| API responses | 1 hour | private, max-age=3600 |

## Monitoring & Observability

### Cloudflare Analytics

Dashboard → **Analytics** → **Web Analytics**:
- Requests (total, by status code)
- Bandwidth (in/out)
- Response times
- Cache hit ratio

### Real User Monitoring (RUM)

Enable in Pages settings to track:
- Core Web Vitals (CLS, FID, LCP)
- Custom events
- Performance metrics

### GitHub Actions

Monitor deployments in **Actions** tab:
- Build status
- Test results
- Deploy success/failure

### Worker Logs

```bash
# Live logs from your Workers
wrangler tail --project-name reilly-asia

# Filter by status
wrangler tail --project-name reilly-asia --status success

# Export logs
wrangler tail --project-name reilly-asia > logs.txt
```

## Troubleshooting Infrastructure

### Issue: Deployment fails in CI

**Check**:
```bash
npm run check
npm run test
npm run build
```

**Common causes**:
- TypeScript errors: Fix and commit
- Test failures: Fix and commit
- Missing dependencies: Run `npm ci` and commit `package-lock.json`

### Issue: API requests timeout

**Check**:
1. Cloudflare Worker logs: `wrangler tail`
2. GitHub API status: https://www.githubstatus.com/
3. Rate limits: `curl -H "Authorization: token <TOKEN>" https://api.github.com/rate_limit`

**Fix**:
- Add timeout handling in worker
- Implement request caching
- Use GitHub token for higher limits

### Issue: Slow page loads

**Diagnose**:
1. Run PageSpeed Insights: https://pagespeed.web.dev/?url=https://reilly.asia
2. Check Cloudflare Analytics for cache hit ratio
3. Check bundle size: `npm run build` then check `dist/client/` size

**Fix**:
- Enable caching headers
- Optimize images
- Lazy load components
- Reduce API calls

### Issue: 404 errors for API routes

**Check**:
1. Route defined in `worker/routes.ts`?
2. Function exported properly?
3. Request path matches regex?

**Test locally**:
```bash
npm run dev
curl http://localhost:5173/api/yourroute
```

## Security Configuration

### CORS Headers

Cloudflare Pages automatically sets appropriate CORS headers for API routes:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Content Security Policy (CSP)

Add CSP header in `wrangler.jsonc`:

```json
{
  "env": {
    "production": {
      "csp": {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'nonce-{RANDOM}'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "https://api.github.com"]
      }
    }
  }
}
```

### Rate Limiting

Implement in `worker/routes.ts`:

```tsx
const rateLimiter = new Map()

export async function handleRequest(request) {
  const ip = request.headers.get('cf-connecting-ip')
  const now = Date.now()
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, [])
  }
  
  const requests = rateLimiter.get(ip).filter(t => now - t < 60000)
  
  if (requests.length >= 60) {
    return new Response('Rate limited', { status: 429 })
  }
  
  requests.push(now)
  rateLimiter.set(ip, requests)
  
  // Handle request...
}
```

## Compliance & Legal

### Data Privacy

- Cloudflare Pages: GDPR compliant
- GitHub API: Review https://github.com/privacy
- No personal data stored locally

### Terms of Service

- Review Cloudflare Pages ToS
- Review GitHub API ToS
- Ensure compliance with deployed content

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub API Docs](https://docs.github.com/en/rest)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

---

For questions about infrastructure or deployment, open an issue on GitHub.
