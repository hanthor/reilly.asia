# reilly.asia — Deployment & Operations Guide

**Current Status**: Static site (Wrangler + Remix) deployed to Cloudflare Pages  
**Last Updated**: 2026-10-08

---

## Content Ownership & Update Strategy

| Section | Owner | Refresh Cadence | Source |
|---------|-------|-----------------|--------|
| **Portfolio** | Author | Manual / on-demand | Markdown files in `/src/content/projects/` |
| **Fleet status** (`/infra`) | DevOps lead | Hourly (automated) | GitHub API (`FACT_HOSTS` roster) |
| **Blog** | Author | Ad-hoc | Markdown files in `/src/content/blog/` |
| **Projects showcase** | Author | Per-release | Markdown + metadata in `/src/content/` |
| **Deployment status** | Author | On merge | README badges (auto-updated) |

### Manual Content Updates

Content files under `/src/content/` are committed directly to git. Changes are deployed automatically on merge to `main`:

```bash
# Edit content
vim src/content/projects/my-project.md

# Commit and push
git add src/content/projects/my-project.md
git commit -m "content: update my-project description"
git push origin feature-branch

# Open PR, merge to main → auto-deployed
```

### Live Data (GitHub API)

Fleet status at `/infra` is fetched live from GitHub:

- **Source**: `FACT_HOSTS` roster in dotfiles/inventory.yml (accessed via GitHub API)
- **Rate limit**: 60 requests/hour (authenticated)
- **Caching**: 5 minutes (Cloudflare edge cache)
- **Fallback**: Stale data served if API unavailable
- **Timeout**: 5 seconds (prevents request hang)

Configuration in `.env.local`:

```bash
VITE_GITHUB_TOKEN=<pat-with-repo-read-access>
VITE_GITHUB_REPO=hanthor/dotfiles
VITE_INFRA_UPDATE_INTERVAL=300000  # 5 minutes in ms
```

---

## Deployment Process

### Standard Workflow (Feature Branch → Main → Live)

1. **Create feature branch** from `main`:
   ```bash
   git checkout -b feature/description origin/main
   ```

2. **Make changes** (content, styling, or code):
   ```bash
   # Edit files
   git add .
   git commit -s -m "type: description"
   ```

3. **Local preview** (verify before pushing):
   ```bash
   npm install
   npm run dev
   # Visit http://localhost:5173
   ```

4. **Push and open PR**:
   ```bash
   git push -u origin feature/description
   # Open PR on GitHub (auto-link to deployment preview)
   ```

5. **Preview deploy** (automatic on PR):
   - Cloudflare Pages creates a preview URL (e.g., `pr-123.reilly-asia.pages.dev`)
   - Preview uses same environment variables as production
   - Share preview URL in PR for review

6. **Merge to main**:
   - All CI checks must pass
   - At least one approval
   - Merge via GitHub UI (squash or rebase, your choice)

7. **Production deploy** (automatic on merge):
   - Cloudflare Pages detects merge to `main`
   - Builds and deploys to `reilly.asia`
   - Build logs available at Cloudflare dashboard

**Typical time to live**: 3–5 minutes from merge

### Emergency Hotfix (Bypass feature branch)

For critical production issues (security, data corruption, service down):

1. **Create hotfix branch** from `main`:
   ```bash
   git checkout -b hotfix/critical-issue origin/main
   ```

2. **Make minimal fix** (change only what's broken):
   ```bash
   # Fix the issue
   git add <files>
   git commit -s -m "fix: critical issue description"
   ```

3. **Merge directly to main** (or expedite PR review):
   ```bash
   git push -u origin hotfix/critical-issue
   # Open PR, request immediate review, merge when approved
   ```

4. **Monitor production** for 10 minutes post-deploy

---

## Rollback Procedures

### If Production Deploy Breaks

**Option 1: Revert commit** (preferred for code issues)

```bash
git log main --oneline | head -5
# Copy the commit hash of the breaking commit
git revert <commit-hash> --no-edit
git push origin main
```

Cloudflare Pages will automatically rebuild and deploy the revert.

**Option 2: Rebuild from known-good commit** (if revert incomplete)

```bash
# Identify last known-good commit
git log main --oneline | grep "working deployment"

# Rebuild that exact commit
# (Contact Cloudflare or use Pages UI to trigger rebuild from specific commit)
```

**Option 3: Manual rollback via Cloudflare dashboard**

1. Visit Cloudflare Pages project for reilly.asia
2. Go to "Deployments" tab
3. Find the last successful deployment
4. Click "Rollback to this deployment"
5. Confirm

**Time to recovery**: 2–5 minutes

### If GitHub API Integration Breaks

If fleet data at `/infra` stops updating:

1. **Check Cloudflare cache**: Clear cache at Cloudflare dashboard
2. **Verify GitHub token**: Check `.env.local` GitHub PAT is valid and has `repo` scope
3. **Check API rate limits**: Use GitHub CLI: `gh rate-limit`
4. **Verify FACT_HOSTS exists**: `gh api repos/hanthor/dotfiles/contents/inventory.yml | grep FACT_HOSTS`

If issue persists >30 minutes, file issue in hanthor/reilly.asia with details.

---

## Monitoring & Observability

### Uptime Monitoring

- **Service**: Cloudflare Pages (SLA: 99.95%)
- **Check**: HTTP GET reilly.asia (2xx response)
- **Recommended tool**: Pingdom, Uptime Robot, or Cloudflare Analytics
- **Alert on**: 3+ consecutive failures or >5s response time

### Error Tracking

- **Build errors**: View at Cloudflare Pages dashboard → Build Logs
- **Runtime errors**: Browser console (no server-side logging)
- **GitHub API errors**: Fallback to stale data; monitor frequency
- **Recommended tool**: Sentry (free tier) or browser error boundaries

### Performance Baseline

| Metric | Target | Current |
|--------|--------|---------|
| **Largest Contentful Paint** | <2.5s | TBD |
| **First Input Delay** | <100ms | TBD |
| **Cumulative Layout Shift** | <0.1 | TBD |
| **Time to First Byte** | <200ms | TBD |

Monitor via Google PageSpeed Insights or Lighthouse CI.

---

## Local Development

### Setup

```bash
# Clone repo
git clone https://github.com/hanthor/reilly.asia.git
cd reilly.asia

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your GitHub PAT (optional for dev)

# Start dev server
npm run dev
# Visit http://localhost:5173
```

### Common Tasks

**Add a new project**:
1. Create `src/content/projects/my-project.md`
2. Add metadata at top (title, date, tags)
3. Write project description
4. Save and refresh dev server → appears on `/`

**Update portfolio metadata**:
1. Edit `src/lib/portfolio-config.ts`
2. Refresh dev server

**Test GitHub API integration**:
1. Set `VITE_GITHUB_TOKEN` in `.env.local`
2. Visit `/infra` in dev server
3. Check Network tab for `https://api.github.com/...` requests

**Build for production**:
```bash
npm run build
# Output in dist/
```

---

## Troubleshooting

### Build Fails Locally

**"Module not found" errors**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**"VITE_GITHUB_TOKEN undefined" warning**:
- Create `.env.local` with GitHub PAT (optional for local preview; not needed for static content)

### Deploy Hangs or Times Out

- Check Cloudflare Pages logs: Dashboard → Deployments → Build Logs
- Common causes:
  - GitHub API timeout: Increase `VITE_INFRA_UPDATE_INTERVAL`
  - Large file in repo: Run `git gc` and retry
  - Rate limit exceeded: Wait 1 hour before retrying

### `/infra` Page Shows "No Hosts"

- **Cause 1**: GitHub token expired or missing
  - Solution: Update `.env.local` with fresh PAT
- **Cause 2**: GitHub API unreachable
  - Solution: Check GitHub status page; retry in 5 minutes
- **Cause 3**: FACT_HOSTS not found in dotfiles/inventory.yml
  - Solution: Verify `hanthor/dotfiles` inventory.yml exists and contains FACT_HOSTS

### Content Not Updating After Merge

- **Cause 1**: Cloudflare cache not cleared
  - Solution: Clear cache at Cloudflare dashboard
- **Cause 2**: Build failed (check Cloudflare logs)
  - Solution: Check build logs; fix and re-push
- **Cause 3**: DNS propagation delay
  - Solution: Wait up to 5 minutes and refresh

---

## Environment Variables

### Required for Production

```bash
VITE_GITHUB_TOKEN=<personal-access-token>
VITE_GITHUB_REPO=hanthor/dotfiles
VITE_INFRA_UPDATE_INTERVAL=300000
```

### Optional for Development

These are pre-configured in Cloudflare Pages; override in `.env.local` for local testing.

---

## Deployment Checklist

Before merging to `main`:

- [ ] All tests pass (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Preview deploy looks correct
- [ ] Content changes reviewed and approved
- [ ] No secrets in committed files

---

## Contacts & Escalation

| Issue | Contact | Action |
|-------|---------|--------|
| Site down or very slow | @hanthor | File issue with details; revert last change |
| GitHub API integration broken | @hanthor | Check FACT_HOSTS, token, rate limits |
| Cloudflare Pages errors | Cloudflare support | Open support ticket with build log |
| Content updates delayed | @hanthor | Manual cache clear or rebuild |

---

*Maintained by: reilly.asia authors (public portfolio)*  
*Last tested: 2026-10-08*
