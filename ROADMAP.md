# reilly.asia Roadmap

> Personal web portfolio and infrastructure dashboard.

**Status:** Production-ready | **Type:** Static site + infrastructure dashboard | **Hosting:** Cloudflare Pages

---

## Current Status

- ✅ **Portfolio**: Project showcase with live GitHub stats
- ✅ **Infrastructure dashboard** (`/infra`): Fleet cards, cluster topology, device facts
- ✅ **Contact page**: Email integration (no backend needed)
- ✅ **GitHub API integration**: Live repo data (public API)
- ✅ **Security**: HSTS, CSP, X-Frame-Options configured
- ❌ **Analytics**: No visitor tracking
- ❌ **Search**: No full-text search
- ❌ **Blog system**: Not a publishing platform

---

## Next 3 Months (Q4 2026 – Q1 2027)

### Priority 1: Production Stability

- [ ] Audit GitHub API rate limiting behavior in production
- [ ] Document deployment and rollback procedures
- [ ] Performance audit (React re-renders, bundle size)

### Priority 2: Infrastructure Dashboard UX

- [ ] Add fleet metrics (uptime, CPU, memory)
- [ ] Improve navigation for large inventories (search/filter)
- [ ] Link infrastructure to GitHub projects

### Priority 3: Documentation

- [ ] Write deployment runbook
- [ ] Document site architecture and GitHub API usage
- [ ] Add project contribution guidelines

---

## Next 6–12 Months (Q1–Q3 2027)

### Backend Optionality

- Evaluate serverless functions only if static capabilities become limiting
- Current stance: **Keep static-first**

### Content & Ecosystem

- Add API documentation if `/infra` becomes a reference tool
- Improve component test coverage

---

## Technical Debt

| Item | Effort | Status |
|------|--------|--------|
| Tailwind v4 migration | 1-2h | Planned |
| TypeScript strict mode | 1-2h | Consider |
| GitHub API timeout handling | 1h | Needed |

---

## How to Contribute

**Easy:** Documentation, testing, UI polish, content  
**Medium:** Performance metrics, infrastructure charts, search  
**Hard:** Backend implementation, analytics, CMS evaluation

---

## Out of Scope

- Blog platform (this is a portfolio)
- E-commerce or payments
- Multi-user management
- Custom domain multitenancy

---

## Strategic Vision

reilly.asia is a **low-maintenance portfolio and infrastructure dashboard**. Stay static-first, deploy continuously, add features only when they provide clear value.

---

*Maintained by strategist agent (hold-gated)*  
*Last updated: 2026-10-14*
