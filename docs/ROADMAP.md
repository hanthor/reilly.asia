# reilly.asia roadmap: architecture evolution and feature priorities

Updated 2026-10-04. This is the public architecture and feature roadmap for reilly.asia — a professional portfolio and infrastructure documentation site.

## Current status

**Phase: Static-site refactoring and optimization**

The site has:
- ✓ React + TypeScript frontend (Vite, SvelteKit-compatible structure)
- ✓ Cloudflare Pages deployment (serverless, static-optimized)
- ✓ GitHub API integration (live repo data, no authentication required)
- ✓ TypeScript type safety across shared schemas and components
- ✓ Tailwind CSS v3 styling with responsive design
- ✓ Contact form via `mailto:` (privacy-preserving, no backend)
- ✓ Security headers (Content-Security-Policy, X-Frame-Options)
- ✓ Performance: Fast static rendering, minimal JavaScript

**Architecture posture**: Pure static site hosted on Cloudflare Pages. No backend database, authentication, or persistent storage. GitHub API queries are read-only and unauthenticated (rate-limited).

**Current limitations**:
- GitHub API rate limits: 60 req/hour for unauthenticated calls
- No dynamic content updates: site rebuild required for portfolio changes
- No user interaction tracking: no analytics, no A/B testing
- No email backend: contact form requires user's email client

## Near-term: October 2026–January 2027

### 1. Complete architectural refactoring and unification

**Goal**: Consolidate scattered configuration and eliminate duplication across components.

**Scope**:
- Extract centralized contact and social links configuration (#35): one source of truth for contact methods and social profiles
- Extract centralized project configuration domain model (#39): unified project data structure across all pages
- Extract common fetcher pattern (#79): standardize GitHub API integration across all API builders
- Unify error-boundary and status-dot components (#83): consistent error handling and status indicators
- Remove dead code (#71, #73): eliminate orphaned GitHub API types, contact-form schemas, shadcn/ui scaffolds
- Remove dead Express server tree (#53): clean up development-only code

**Success criteria**:
- One configuration file per domain (contacts, projects, infrastructure)
- No duplicate API integration code; all GitHub queries use the same fetcher
- <5% dead/unused code in the codebase
- All refactoring PRs merged without breaking existing functionality

### 2. Establish and document architecture

**Goal**: Make the site's design decisions and structure explicit for new contributors and maintenance.

**Scope**:
- Create `docs/architecture.md` documenting:
  - Component hierarchy and page structure
  - Data flow (GitHub API → cache → component)
  - Styling system and Tailwind configuration
  - Build and deployment pipeline
  - Security model and CSP policy
- Create `docs/project-overview.md` as a high-level guide for new readers
- Update `README.md` with deployment and projectructure details
- Document the contact form's `mailto:` implementation and privacy model

**Success criteria**:
- Architecture guide is reviewed and approved by maintainers
- New contributor can understand the data flow and add a new project page within 30 minutes
- Deployment instructions are step-by-step reproducible

### 3. Security hardening and dependency management

**Goal**: Enforce security headers and add timeouts to all external requests.

**Scope**:
- Add helmet middleware for response security headers (#90): X-Content-Type-Options, X-XSS-Protection, HSTS
- Add timeout to GitHub API proxy requests (#82, #94): prevent hanging requests on network delay
- Review and lock all dependency versions: npm lock file, TypeScript strict mode
- Add security.md with vulnerability reporting process
- Scan dependencies for known vulnerabilities (npm audit)

**Success criteria**:
- All security headers are enforced in production
- GitHub API requests timeout after 5 seconds; errors are gracefully handled
- No npm vulnerabilities at high or critical level
- Security.md is published with contact information and response timeline

### 4. Test coverage expansion

**Goal**: Establish baseline test coverage for critical components and utilities.

**Scope**:
- Add unit coverage for cn() className merge helper (#55, #64, #66): utility test baseline
- Add unit coverage for error-boundary and status-dot components (#83): component behavior
- Set up test CI/CD: automated test runs on every PR
- Document test strategy and expected coverage targets (≥60% for utilities, ≥40% for components)

**Success criteria**:
- Utility functions have ≥80% test coverage
- Components have ≥50% test coverage
- CI/CD runs tests and blocks PRs if coverage regression detected

## Mid-term: January–April 2027

### 1. Performance optimization and analytics

**Goal**: Establish baseline performance metrics and identify optimization opportunities.

**Scope**:
- Measure Core Web Vitals (LCP, FID, CLS) on production
- Implement Cloudflare Analytics Engine for traffic and performance data
- Identify slow components (profiling, Lighthouse audit)
- Optimize image loading (lazy load, WebP format)
- Document performance targets and SLAs (LCP <2.5s, FID <100ms, CLS <0.1)

**Success criteria**:
- Performance metrics are tracked and published monthly
- Lighthouse score is ≥90
- LCP is <2.5s, FID <100ms, CLS <0.1 on real devices

### 2. Dynamic content updates (optional)

**Goal**: Decide whether to move beyond static generation.

**Scope**:
- Evaluate options:
  - Option A: Remain static; use GitHub Actions to rebuild on portfolio changes
  - Option B: Add lightweight serverless backend (Cloudflare Workers) for dynamic GitHub data refresh
  - Option C: Integrate a CMS (Contentful, Sanity) for non-technical portfolio updates
- Document decision and implementation plan
- If adopted: implement and test the chosen solution

**Success criteria**:
- Decision is documented with pros/cons of each option
- If backend is added: it handles ≥90% of portfolio update requests
- Portfolio updates are reflected within 5 minutes of GitHub push (Option A) or real-time (Option B/C)

### 3. Infrastructure documentation expansion

**Goal**: Use the site to document and showcase the broader infrastructure.

**Scope**:
- Create `/infra` section documenting:
  - System architecture diagrams
  - Fleet management (machine inventory, roles)
  - Network topology and Tailscale mesh
  - Deployment procedures and runbooks
- Add live status dashboards (uptime, service health)
- Document infrastructure decisions in Architecture Decision Records (ADRs)

**Success criteria**:
- `/infra` section is published and linked from portfolio
- At least 5 architecture decisions are documented in ADRs
- Live status page is accessible and accurate

## Six to twelve months: April–October 2027

### Future enhancements (lower priority)

- **User authentication**: Allow sign-in via GitHub to unlock features (project updates, private notes)
- **Portfolio customization**: Users can create personal portfolio instances from templates
- **Newsletter or blog**: Persist content beyond static generation; add publishing workflow
- **API for portfolio data**: Allow other tools to query portfolio metadata (projects, skills, experience)
- **Dark mode toggle**: Client-side theme switching (currently static)
- **Internationalization**: Multi-language support for portfolio content

## Known limitations

- **GitHub API rate limits**: 60 reqs/hour unauthenticated; project queries may stale at high traffic
- **No user accounts**: All users see the same portfolio; no personalization
- **No email backend**: Contact form relies on user's email client
- **No analytics**: No tracking of user behavior, traffic patterns, or portfolio impact
- **No CMS**: Portfolio changes require code commits and rebuilds
- **Deployment**: Manual or GitHub Actions trigger required; no continuous deployment

## How contributors can help

- **Architecture review** (#35, #39, #69, #79): Review and approve architectural refactoring PRs
- **Security hardening** (#77, #82, #90, #94): Implement headers, timeouts, and vulnerability scanning
- **Testing** (#55, #64, #66, #83): Add unit tests for utilities and components
- **Documentation**: Improve architecture guides, deployment instructions, and ADRs
- **Performance optimization**: Profile and optimize slow components
- **Infrastructure documentation**: Help document the broader infrastructure and fleet management

See [project structure](#project-structure) for file organization and [README](README.md) for build/deploy instructions. Report issues and feature requests in [GitHub Issues](https://github.com/hanthor/reilly.asia/issues).

## Release history

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| Static site (current) | 2026-10-04 | Active | React + TypeScript; Cloudflare Pages; GitHub API integration; security and refactoring in progress |
| Refactored architecture | Q1 2027 | Planned | Centralized configs, unified components, security hardening complete |
| Enhanced features | Q2 2027 | Planned | Performance optimized; infrastructure docs expanded; optional backend if adopted |

---

*Last updated 2026-10-04 by strategist agent (ACMM L5 — hold-gated mode)*
