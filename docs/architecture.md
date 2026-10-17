# Architecture Guide

## Overview

Reilly.asia is a **full-stack TypeScript project** that combines:
- **Frontend** (React + Vite) — Interactive portfolio and infrastructure dashboard
- **Backend** (Cloudflare Workers) — Serverless API and dynamic content
- **Shared Types** (TypeScript) — Single source of truth for data contracts

The architecture supports **two deployment targets**:
1. **Development** — Node.js Express server with Vite dev build
2. **Production** — Cloudflare Workers + Pages for serverless deployment

## Core Concepts

### 1. Build Pipeline

```
Source Code (TypeScript)
         ↓
    ┌────┴────┐
    ↓         ↓
  Client    Server
  (Vite)    (esbuild)
    ↓         ↓
  dist/client dist/server
    ↓         ↓
Deploy to Cloudflare Pages
```

**Vite** bundles the React application (`client/src/`) into static HTML/JS/CSS in `dist/client/`.

**esbuild** bundles the server code (`server/index.ts`) and any shared utilities into `dist/server/` (used in development).

In production, **Cloudflare Pages** serves the static client build and routes API calls to Cloudflare Workers (`worker/`).

### 2. Runtime Targets

#### Development Runtime (Node.js)

When you run `npm run dev`, this happens:

```
npm run dev
    ↓
Vite Dev Server (port 5173)
    ↓
Starts Express app (server/index.ts)
    ↓
Express listens on same port, proxies requests
    ↓
Browser loads http://localhost:5173
```

The **Express server** in `server/`:
- Serves the Vite dev build (hot module replacement enabled)
- Proxies API requests to GitHub to avoid CORS issues
- Can be extended with custom SSR or API routes

#### Production Runtime (Cloudflare Workers)

In production, the flow is:

```
Browser → Cloudflare Pages CDN
              ↓
         Matches static file? → Serve dist/client/*
              ↓
         /api/* route? → Trigger Cloudflare Worker
              ↓
         Worker runs worker/index.ts
              ↓
         Returns JSON response
```

**Cloudflare Workers** (`worker/`) is a serverless compute platform that:
- Runs near your users globally (edge computing)
- Handles API requests without a traditional server
- Can fetch from external APIs or databases
- Has built-in CORS support (no proxy needed)

### 3. Shared Code Pattern

```
shared/
  ├── fleet.ts          ← Infrastructure definitions (used by infra dashboard)
  ├── infra.ts          ← Infra API schema (client + server both validate with this)
  ├── featured-repos.ts ← Featured projects config
  └── schema.ts         ← Zod validation schemas
```

**Why shared code?**
- Type safety across the client-server boundary
- Single source of truth for validation
- Avoid duplicating logic in both `server/` and `worker/`

**Example:**
```tsx
// shared/schema.ts
export const repositorySchema = z.object({
  name: z.string(),
  url: z.string().url(),
  stars: z.number().gte(0)
})

// client/src/pages/projects.tsx
import { repositorySchema } from '../../shared/schema'
const repo = repositorySchema.parse(apiResponse)

// worker/routes.ts
import { repositorySchema } from '../shared/schema'
const validated = repositorySchema.parse(data)
```

## Module Structure

### Client Layer (`client/src/`)

| Directory | Purpose | Example Files |
|-----------|---------|----------------|
| `pages/` | Routable pages (auto-routed by Vite) | `index.tsx`, `infra.tsx` |
| `components/ui/` | Reusable UI components (shadcn/ui + Radix) | `button.tsx`, `card.tsx` |
| `components/infra/` | Feature-specific components | `VenueSelector.tsx` |
| `hooks/` | Custom React hooks | `useInfraApi.ts`, `useToast.ts` |
| `lib/` | Utilities and API clients | `github-api.ts`, `utils.ts` |
| `types/` | TypeScript interfaces | `github.ts` |

### Server Layer (`server/` for dev, `worker/` for production)

| File | Purpose |
|------|---------|
| `index.ts` | Entry point, Express app setup |
| `routes.ts` | API endpoints and middleware |
| `vite.ts` (server only) | Vite integration for HMR |

### Key Data Flow

#### 1. Infrastructure Dashboard (`/infra`)

```
Client Request
    ↓
client/src/pages/infra.tsx
    ↓
useInfraApi hook
    ↓
fetch('/api/infra')
    ↓
(Dev) server/routes.ts → calls GitHub API → caches response
(Prod) worker/routes.ts → calls GitHub API → returns JSON
    ↓
Client receives validated data (shared/infra.ts schema)
    ↓
Renders with components/infra/* components
```

#### 2. Featured Projects

```
client/src/pages/projects.tsx
    ↓
import from shared/featured-repos.ts
    ↓
Render list of repos
    ↓
User clicks → GitHub link (external)
```

## Dependency Graph

```
client/src/pages/*
  ↓ imports
components/ui/*
components/infra/*
hooks/* (useInfraApi, useQuery, useToast)
  ↓ imports
lib/github-api.ts (fetch data)
types/* (GitHub types)
shared/* (schemas, types)
```

**Rule**: Code should flow **downward only**. A page can import components, but components should never import pages. Utilities should never import UI components.

## Code Ownership

```
Frontend Experience
  ↓
client/src/pages/*
client/src/components/*

Data Fetching & API
  ↓
hooks/useInfraApi.ts
lib/github-api.ts
server/routes.ts (dev) or worker/routes.ts (prod)

Type Safety & Validation
  ↓
shared/*
client/src/types/*
```

## State Management

**React Query** (`@tanstack/react-query`) manages server state:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['repos'],
  queryFn: () => fetch('/api/repos').then(r => r.json())
})
```

**React Hooks** manage local UI state:
```tsx
const [isOpen, setIsOpen] = useState(false)
```

**No Redux, Zustand, or Context** — React Query handles most of the complexity.

## Styling Architecture

**TailwindCSS** is the single source of styling truth.

```
tailwind.config.ts
  ├── Defines color palette
  ├── Defines font sizes
  ├── Custom spacing scale
  └── Plugin configuration

client/src/components/ui/*
  └── Use Tailwind classes directly (shadcn/ui components)

client/src/pages/*
  └── Use Tailwind classes with cn() utility for conditional styling
```

The `cn()` utility from `@/lib/utils` merges and deduplicates Tailwind classes:

```tsx
import { cn } from '@/lib/utils'

// Removes duplicate classes intelligently
cn('p-4 p-8') // → 'p-8' (Tailwind's largest value wins)
```

## Deployment

### Development (`npm run dev`)

```
npm run dev
  ↓
Vite starts dev server + Express on port 5173
  ↓
Browser: http://localhost:5173
  ↓
Changes to code → Hot Module Replacement (instant reload)
```

### Production (Cloudflare Pages)

```
git push origin main
  ↓
GitHub Actions (or Cloudflare Pages CI)
  ↓
npm run build
  ├─ vite build (creates dist/client/*)
  └─ esbuild (creates dist/server/*, for local testing only)
  ↓
Cloudflare Pages publishes dist/client/* as static site
  ↓
API requests routed to Cloudflare Workers (worker/routes.ts)
  ↓
https://reilly.asia live
```

**What gets deployed?**
- `dist/client/` — Static HTML/JS/CSS (served by CDN)
- `worker/` — Serverless functions (run on edge)
- `shared/` — Types (deployed as part of worker build)

## Performance Considerations

### Build Time
- Vite: ~1-2 seconds (dev), ~5-10 seconds (prod)
- esbuild: ~1 second
- Total: ~10-15 seconds

### Runtime Performance
- Client-side: React Query caches API responses → no refetch on re-render
- Server-side: Cloudflare Workers cached in edge locations globally
- Static assets: Served from CDN with long cache headers

### Bundle Size
- React + related: ~40 KB gzipped
- TailwindCSS (with purge): ~10 KB gzipped
- Total: ~50-60 KB gzipped

**If it grows beyond 100 KB**, consider:
- Code splitting with dynamic imports
- Tree-shaking unused dependencies
- Lazy loading heavy components

## Error Handling

### Client-Side
```tsx
const { data, isLoading, error } = useQuery({ ... })

if (error) return <ErrorCard error={error} />
```

### Server-Side (worker/routes.ts)
```tsx
try {
  const data = await fetchGitHub(...)
  res.json({ ok: true, data })
} catch (error) {
  res.status(500).json({ ok: false, error: error.message })
}
```

### Type Safety
```tsx
// shared/schema.ts
const response = schema.parse(apiResponse) // Throws ZodError if invalid
```

## Testing Strategy

- **Unit tests** for utilities (`lib/*.test.ts`)
- **Component tests** for UI components (render + assert)
- **Integration tests** for API routes (mock fetch)
- **E2E tests** (future) — Playwright on production-like build

Run with `npm run test`.

## Common Tasks

### Add a New Page
1. Create `client/src/pages/newpage.tsx`
2. It's automatically routed to `/newpage`
3. Add link in navigation

### Add an API Endpoint
1. Add route to `server/routes.ts` (dev) and `worker/routes.ts` (prod)
2. Add shared schema in `shared/schema.ts`
3. Import in client and call with `fetch('/api/endpoint')`

### Add a New UI Component
1. Check shadcn/ui library
2. If exists, `npx shadcn-ui@latest add component-name`
3. If custom, create in `client/src/components/`

### Update Infrastructure Data
1. Edit `shared/fleet.ts`
2. Update `shared/infra.ts` schema if needed
3. Changes reflect in `/infra` page automatically

## Next Steps

- Review [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow
- Check `package.json` for all available npm scripts
- Explore existing components in `client/src/components/`
- Read the [Testing Guide](./testing.md) for test patterns

Questions? Open an issue on GitHub or check existing PRs for examples.
