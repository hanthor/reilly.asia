# Deployment Guide

This guide covers how to deploy reilly.asia to production on Cloudflare Pages and configure the backend.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Build](#local-build)
- [Cloudflare Pages Setup](#cloudflare-pages-setup)
- [Environment Configuration](#environment-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)

## Prerequisites

1. **Cloudflare Account** — Free tier is sufficient for static hosting + Workers
2. **GitHub Repository** — Connected to your Cloudflare Pages
3. **Node.js 18+** — For local builds
4. **npm 9+** — For dependency management

## Local Build

### Build the Project

```bash
npm run build
```

This generates:
- `dist/client/` — Static HTML/JS/CSS for Cloudflare Pages
- `dist/server/` — Node.js server bundle (for local testing only)

**What happens:**
1. Vite bundles `client/src/` into `dist/client/`
2. esbuild bundles `server/` into `dist/server/`

### Preview Production Build Locally

```bash
npm run preview
```

This starts a local server simulating the production environment. Visit `http://localhost:4173` to test.

### Verify Types

Before deploying, ensure all TypeScript passes:

```bash
npm run check
```

### Run Tests

```bash
npm run test
```

Deployment should never proceed with failing tests.

## Cloudflare Pages Setup

### Option 1: GitHub Integration (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Select **Connect to Git** → **GitHub**
4. Authorize Cloudflare to access your GitHub account
5. Select **hanthor/reilly.asia**
6. Configure build settings:
   - **Framework preset**: None (custom)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/client`
   - **Root directory**: `/` (leave empty)
7. Click **Save and Deploy**

**Automatic deployments:**
- Every push to `main` triggers a build and deploy
- Pull requests get preview deployments
- Rollback to any previous deployment from dashboard

### Option 2: Manual Upload

```bash
npm run build
cd dist/client
# Upload dist/client/* to Cloudflare Pages via CLI or dashboard
```

This is not recommended for production as it bypasses CI/CD.

## Environment Configuration

### Build-Time Configuration

Environment variables during build (used to configure the app):

```bash
# .env.production
VITE_API_BASE_URL=https://api.reilly.asia
VITE_GITHUB_TOKEN=    # Optional, leave empty for unauthenticated requests
```

In your code:
```tsx
const apiBase = import.meta.env.VITE_API_BASE_URL
```

### Runtime Configuration (Cloudflare Workers)

Secrets used by your serverless functions:

1. Go to **Pages** → **reilly.asia** → **Settings** → **Environment variables**
2. Click **Add variable**
3. Add secrets (e.g., GitHub token for private API requests):
   ```
   Name: GITHUB_TOKEN
   Value: ghp_xxxxx
   ```

In `worker/routes.ts`:
```tsx
const token = env.GITHUB_TOKEN
```

**Important**: Use `env` in Workers, not `process.env`.

### Local Development

Create a `.env.local` file for local development:

```
VITE_API_BASE_URL=http://localhost:5173
```

This is not committed to git (added to `.gitignore`).

## CI/CD Pipeline

### GitHub Actions Workflow

When you push to `main`, the default GitHub Actions runs:

```yaml
# .github/workflows/deploy.yml (if exists)
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run check
      - run: npm run test
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: reilly-asia
          directory: dist/client
          branch: main
```

**Setup secrets:**
1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add:
   - `CLOUDFLARE_API_TOKEN` — Generate at https://dash.cloudflare.com/profile/api-tokens
   - `CLOUDFLARE_ACCOUNT_ID` — From Cloudflare Pages dashboard

### Deployment Checks

Before deploying, the CI runs:
1. ✅ **Type check** — `npm run check`
2. ✅ **Unit tests** — `npm run test`
3. ✅ **Build** — `npm run build`
4. ✅ **Upload to Cloudflare** — Static files to Pages, Workers to edge

If any step fails, the deployment is rejected.

## Production Architecture

### File Serving

```
Browser Request
    ↓
Cloudflare CDN (cached globally)
    ↓
Is it a static file (*.html, *.js, *.css, *.png)?
    ↓
YES → Serve from cache/origin
NO  → Check if it's an API route (/api/*)
    ↓
YES → Route to Cloudflare Worker
NO  → Return 404
```

### API Routing

```
/api/* requests
    ↓
Cloudflare Worker (worker/routes.ts)
    ↓
Custom API logic or GitHub API proxy
    ↓
Return JSON response
```

### Cache Headers

Configure caching in `wrangler.jsonc`:

```json
{
  "pages_build_caching": {
    "default_cache_control": "public, max-age=3600",
    "file_rules": [
      {
        "glob": "*.html",
        "cache_control": "public, max-age=300"
      },
      {
        "glob": "*.js",
        "cache_control": "public, max-age=31536000"
      },
      {
        "glob": "/api/*",
        "cache_control": "no-cache"
      }
    ]
  }
}
```

**Best practices:**
- HTML: Short cache (5 min) for fast updates
- JS/CSS: Long cache (1 year) with versioned filenames (Vite does this)
- API: No cache (or short cache with ETags)
- Images: Long cache (1 year)

## Monitoring & Troubleshooting

### Check Deployment Status

1. **Cloudflare Dashboard**:
   - Go to **Pages** → **reilly.asia** → **Deployments**
   - See build logs and deployment history

2. **GitHub Actions**:
   - Go to **Actions** → Select workflow run
   - View logs for each step

### Common Issues

#### Build Failed: "node_modules not found"

```bash
# Check build log for error
npm ci --prefer-offline --no-audit
npm run build
```

**Fix**: Ensure `package-lock.json` is committed.

#### Deployment Failed: "API token expired"

1. Generate new token at https://dash.cloudflare.com/profile/api-tokens
2. Update GitHub secret `CLOUDFLARE_API_TOKEN`
3. Re-run workflow

#### Assets Not Updating

```bash
# Hard refresh browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

Or clear cache headers and wait 5 minutes for CDN to refresh.

#### API Requests Failing

**In development:**
```bash
npm run dev
# Check browser console for errors
```

**In production:**
1. Go to Cloudflare **Workers** → **Logs**
2. Check for errors in worker execution
3. Verify API token is set if calling private GitHub endpoints

### Viewing Logs

**Cloudflare Pages Logs:**
```bash
wrangler tail --project-name reilly-asia
```

**Real-time logs from deployed Workers:**
```bash
wrangler tail --project-name reilly-asia --format pretty
```

### Rollback

If a deployment breaks production:

1. Go to **Pages** → **reilly.asia** → **Deployments**
2. Find the previous working deployment
3. Click **...** → **Rollback**

Your site is instantly restored to the previous version.

## Performance Optimization

### Monitor Performance

1. **Cloudflare Analytics** → Real User Metrics (RUM)
2. **Google PageSpeed Insights** — https://pagespeed.web.dev/?url=https://reilly.asia
3. **WebPageTest** — https://www.webpagetest.org/

### Optimize Bundle Size

```bash
npm run build
# Check dist/client/index.html size
```

If bundle is >100KB:
1. Audit dependencies: `npm list` (unused?)
2. Enable dynamic imports for heavy components
3. Check for CSS bloat (unused Tailwind?)

### Cache Strategy

- **HTML**: Cache-control: `max-age=300` (5 min) — allows quick updates
- **JS/CSS**: Cache-control: `max-age=31536000` (1 year) — Vite adds content hash
- **API**: Cache-control: `no-cache` — Always fetch fresh
- **Images**: Cache-control: `max-age=31536000` (1 year)

## Secrets Management

### Store API Keys Safely

1. **Never commit secrets** to git
2. Use GitHub Secrets for CI/CD
3. Use Cloudflare Pages Environment Variables for production
4. Use `.env.local` for local development (add to `.gitignore`)

### Rotate Secrets

1. Generate new GitHub token
2. Update `GITHUB_TOKEN` in Cloudflare
3. Wait 5 minutes for Workers to pick up new value
4. Revoke old token

## Disaster Recovery

### If Site Goes Down

1. **Check Cloudflare Status** — https://www.cloudflarestatus.com/
2. **Check GitHub Actions** — Did the deployment fail?
3. **Rollback** — Use Cloudflare dashboard to rollback last deployment
4. **Check Worker Errors** — View Cloudflare Worker logs
5. **Manual rebuild**: 
   ```bash
   npm run build
   # Upload dist/client/* to Cloudflare or re-run CI
   ```

### Backups

Cloudflare stores deployment history for 30 days. Older deployments can be re-deployed from git:

```bash
git push origin main --force-with-lease
# CI will re-build and deploy
```

## Next Steps

- Set up monitoring and alerts
- Configure custom domain (if using reilly.asia)
- Enable DDoS protection (Cloudflare defaults)
- Set up log aggregation (optional)

---

For help, check:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
