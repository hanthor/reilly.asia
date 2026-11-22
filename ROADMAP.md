# Roadmap

reilly.asia is a personal portfolio and infrastructure hub, deployed as a
Cloudflare Worker that serves a static React site and a small `/infra` API.
This roadmap orders the open work by dependency so contributors can see what
unblocks what. It is a plan, not a commitment; items link to the issue that
tracks them.

## Direction

- Stay a static-first site on a single Cloudflare Worker. No database, user
  accounts or CMS are planned.
- Treat `shared/` as the single source of truth for data contracts (fleet
  roster, social links, infra routes) consumed by both `client/` and `worker/`.
- Keep the site cheap to run and safe to change: CI on every PR, tests around
  the Worker, and security headers enforced.

## Now: make changes safe

- Run typecheck, tests and build on pull requests (#49).
- Fix the Workers Builds failure caused by Tailwind v4 / PostCSS (#57).
- Enforce response security headers (#36, #80).
- Bound upstream fetches in the handbook and GitHub proxies with timeouts (#168).
- Keep dependency PRs flowing; document the major-upgrade policy (#154).

## Next: one source of truth

- Centralise contact and social links (#34).
- Write the fleet roster once instead of in `shared/fleet.ts`, `data.ts` and
  the architecture page (#61), and separate payload contracts from
  presentation helpers (#162).
- Isolate the build-time GitHub stats fetch from the Vite config (#172).
- Document the public `/infra` API contracts and cache semantics (#160).

## Later: reach and clarity

- Structured data, Open Graph tags and referral measurement (#89).
- A documented architecture end state and the content/deployment model
  (#155, #105, #114).
- README and contributor docs that cover setup, checks and project layout
  (#41, #63, #67, #75, #76).

## Out of scope

- A backend database, authentication or a CMS.
- Server-rendered pages; the site remains a static bundle plus the Worker.
- New deployment targets. Whether the legacy `server/` path is still a target
  is tracked in #171 and should be resolved before any work depends on it.

## How to help

Pick an item from "Now" first; those unblock the rest. Run `npm run check` and
`npm test` before opening a pull request, and keep changes to one item per PR.
