# Deployment and Content Strategy

This document describes the content ownership model, data refresh strategy, deployment procedures, and operational guidelines for reilly.asia.

## Content Strategy

### Sections and Ownership

| Section | Content | Owner | Refresh | Live Data |
|---------|---------|-------|---------|-----------|
| **Home** | Bio, featured work, social links | Manual | As needed | No |
| **/infra** | Fleet infrastructure status, machines, metrics | Manual + GitHub API | Daily | Yes (GitHub) |
| **Projects** | GitHub repositories, descriptions, activity | GitHub API | Real-time | Yes |
| **Articles** | Blog posts or writing | Manual | Monthly or less | No |
| **Contact** | Email and social channels | Manual | As needed | No |

### Refresh Cadence

- **Manual sections** (home, articles, contact): Updated on-demand via git commits
- **GitHub API sections** (/infra): Fetched on every page load in production
- **GitHub projects list**: Fetched on every page load (real-time via GitHub API)

### Data Freshness Trade-offs

**Live GitHub data pros:**
- Always current (no stale data)
- Demonstrates active development

**Live GitHub data cons:**
- Depends on GitHub API availability (99.9% SLA, outages possible)
- Subject to GitHub API rate limits (60 req/hour unauthenticated, 5,000/hour authenticated)
- Slower page load if GitHub is slow

**Current approach:** Live fetches; failures degrade gracefully (show "Unable to load" message, page still renders).

## Deployment Model

### Environments

| Environment | Branch | Deployment | When |
|-------------|--------|-----------|------|
| **Production** | main | Automatic (Cloudflare Pages) | On push to main |
| **Preview** | feature/* | Automatic (Cloudflare Pages) | On push to feature branch |
| **Local** | any | Manual (`npm run dev`) | Developer machine |

### Deployment Process

#### Standard Deployment

1. **Create feature branch**: `git checkout -b feature/description`
2. **Make changes**: Edit components, styles, content
3. **Test locally**: `npm run dev` and manually test at http://localhost:5173
4. **Run tests**: `npm run test` (optional, but recommended)
5. **Commit and push**: `git commit -m "description" && git push -u origin feature/description`
6. **Preview deploys automatically**: Cloudflare Pages creates a preview at `https://<branch-name>.reilly.asia`
7. **Create PR**: Use standard GitHub PR flow (or just merge to main if confident)
8. **Merge to main**: `git merge feature/description && git push origin main`
9. **Production deploys automatically**: Cloudflare Pages rebuilds and deploys main

#### Emergency Hotfix

If production is broken:

1. **Identify the issue**: Check Cloudflare Pages build logs or production site
2. **Create hotfix branch**: `git checkout -b hotfix/issue-description`
3. **Fix the issue locally**: `npm run dev` to test
4. **Push and test on preview**: `git push -u origin hotfix/issue-description`
5. **Merge directly to main**: `git merge hotfix/issue-description && git push origin main`
6. **Verify production**: Check reilly.asia (rebuilds in ~2 minutes)

**Note:** Do not use `force push` to main; always merge. Cloudflare Pages needs commit history.

### Rollback Procedure

If a deployment breaks production:

1. **Identify the commit**: `git log --oneline | head -10` (find the last good commit)
2. **Revert the commit**: `git revert <bad-commit-hash> && git push origin main`
3. **Verify production**: Cloudflare Pages will rebuild and deploy the revert (~2 minutes)

**Alternative (faster):** Manually revert the problematic file(s) in a new commit if full revert is too broad.

### Build and Deploy Configuration

**Build command** (configured in Cloudflare Pages):
```bash
npm run build
```

**Build output directory:**
```
dist/
```

**Root directory:**
```
/ (leave empty)
```

**Environment variables** (if needed in future):
- Set in Cloudflare Pages dashboard under Settings → Environment variables
- Available to build process via standard `process.env`

**Build time:** ~1 minute

**Deployment time:** ~2 minutes total

## GitHub API Integration

### Configuration

GitHub API is called from the browser directly (no authentication required for public data).

**Endpoint used:**
```
https://api.github.com/users/reilly-shea/repos
```

**Rate limit:** 60 requests per hour per IP address (unauthenticated)

### Caching Strategy

**Current:** No caching; every page load fetches fresh data.

**Planned improvements** (future):
- Browser cache: Cache responses for 1 hour (use `Cache-Control` headers)
- Fallback: If fetch fails, show cached data from previous successful request
- Authentication: Optional GitHub API token to increase rate limit to 5,000/hour

### Fallback Behavior

If GitHub API is unavailable:

1. **Page still loads** (GitHub data is not critical to site functionality)
2. **"Unable to load" message** appears in the projects section
3. **User can retry** by refreshing the page
4. **No error tracking** currently (future improvement)

### Future Improvements

- Add error logging (Sentry or similar) to track API failures
- Implement authenticated requests (store token in Cloudflare environment variable)
- Add server-side caching layer to reduce browser requests
- Monitor GitHub API status before rendering

## Monitoring and Observability

### Current State

No monitoring is currently configured. Site either works or shows errors.

### Future Recommendations

1. **Uptime monitoring**: Use external service (e.g., Healthchecks.io) to ping site every 5 minutes
2. **Error tracking**: Add Sentry integration to catch client-side errors
3. **Performance monitoring**: Use Cloudflare Analytics to track page load times
4. **Alerts**: Configure alerts for build failures or high error rates

## Content Updates

### Adding a New Project

Projects are fetched live from GitHub. To add a project:

1. **Create a GitHub repository** with the desired project name
2. **Add a description** in the GitHub repository settings
3. **Repository automatically appears** on /projects page within 24 hours (next page load)

### Updating Bio or Home Content

1. **Edit client/src/pages/Home.tsx** or relevant component
2. **Test locally**: `npm run dev`
3. **Push to feature branch**: `git push origin feature/update-bio`
4. **Merge to main**: Once tested, merge to main
5. **Production updated**: ~2 minutes after merge

### Updating /infra Section

The /infra page fetches machine status from GitHub or shows hardcoded data. To update:

1. **If data-driven:** Update the data source (GitHub API or hardcoded data in `/infra` component)
2. **Test locally**: `npm run dev` and navigate to /infra
3. **Push and deploy**: Standard deployment process

## Maintenance SLA

### Expected Uptime

**99%** — Site should be available 99% of the time. Expected downtime: ~7 hours/month (mostly during Cloudflare maintenance).

### Response Time

- **Pages:** < 2 seconds (including GitHub API fetch)
- **Build time:** ~1 minute
- **Deployment time:** ~2 minutes

### Who Is On-Call

Currently: No formal on-call rotation. The repository owner monitors issues and fixes problems as reported.

### Reporting Issues

If the site is down or broken:
1. Open a GitHub issue with details (what's broken, when it broke, browser/OS)
2. Include screenshot or error message if possible
3. Check Cloudflare Pages dashboard for build/deploy status

## Local Development

### Setup

```bash
# Clone and install
git clone https://github.com/hanthor/reilly.asia.git
cd reilly.asia
npm install

# Start dev server
npm run dev

# Open http://localhost:5173 in your browser
```

### Testing GitHub API Integration

By default, the dev server proxies GitHub API calls to avoid CORS issues:

```bash
# In vite.config.ts, the proxy is configured:
# /api -> https://api.github.com (in production)
# localhost:5173 -> localhost:5173/api (in development)
```

To test with real GitHub data:
1. Comment out the proxy in `vite.config.ts`
2. API calls will go directly to GitHub in development

### Building for Production

```bash
npm run build  # Creates dist/ folder
npm run preview  # Preview production build locally at :3000
```

## Troubleshooting

### Build Fails on Cloudflare Pages

1. **Check logs**: Cloudflare Pages shows build output; look for errors
2. **Common causes:**
   - Missing environment variables (check dashboard)
   - TypeScript compilation errors (run `npm run check` locally)
   - Dependency resolution issues (try `npm ci` instead of `npm install`)

### Page Loads Slowly

1. **Check GitHub API:** Is github.com slow? (Check status.github.com)
2. **Browser cache:** Clear browser cache and reload
3. **Cloudflare cache:** Force purge cache in Cloudflare dashboard

### GitHub Data Not Updating

1. **Rate limit hit:** Wait 1 hour or use authenticated requests
2. **API is down:** GitHub may be experiencing an outage
3. **No internet:** Check your connection

### Projects Section Shows "Unable to Load"

This is expected if:
- GitHub is down
- Rate limit has been exceeded
- Network is unavailable

Refresh the page to retry. If GitHub is down, the message will persist until GitHub recovers.

## Questions?

- Deployment questions: See Cloudflare Pages docs or create an issue
- Content questions: Open an issue or edit the relevant component
- GitHub API issues: Check GitHub status at status.github.com
