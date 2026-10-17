# Contributing to reilly.asia

Thank you for your interest in contributing to reilly.asia! This guide explains how to set up your environment, develop new features, and follow the project's conventions.

## Table of Contents

- [Setup](#setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Patterns](#code-patterns)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Setup

### Prerequisites

- Node.js 18+ (check `package.json` for exact version)
- npm 9+

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/hanthor/reilly.asia.git
   cd reilly.asia
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:5173` (Vite default port)

4. Check types:
   ```bash
   npm run check
   ```

5. Run tests:
   ```bash
   npm run test
   ```

## Project Structure

```
reilly.asia/
├── client/                    # Frontend React application
│   ├── public/               # Static assets (favicons, matrix wellknown, fonts)
│   └── src/
│       ├── components/       # React components
│       │   ├── infra/       # Infrastructure dashboard components
│       │   └── ui/          # Reusable UI components (shadcn/ui + Radix UI)
│       ├── pages/           # Top-level page components (routed via Vite)
│       ├── hooks/           # Custom React hooks (useToast, useInfraApi, etc.)
│       ├── lib/             # Utilities and helpers
│       │   ├── github-api.ts    # GitHub API client
│       │   ├── social-links.ts  # Social link configuration
│       │   └── utils.ts         # Shared utilities (className merge, etc.)
│       └── types/            # TypeScript interfaces (GitHub types, etc.)
├── server/                    # Development server (Vite + Node)
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # Express routes for dev proxy and SSR
│   └── vite.ts              # Vite dev server integration
├── shared/                    # Shared code between client and server
│   ├── fleet.ts             # Infra fleet definitions and type definitions
│   ├── infra.ts             # Infra API schema and types
│   ├── featured-repos.ts    # Featured projects configuration
│   └── schema.ts            # Shared zod schemas for validation
├── worker/                    # Cloudflare Worker (production serverless)
│   ├── index.ts             # Worker entry point
│   ├── routes.ts            # API route handlers for Worker
│   └── api.ts               # Shared API logic (used by both server and worker)
├── vite.config.ts           # Vite bundler configuration
├── vitest.config.ts         # Vitest test runner configuration
├── tailwind.config.ts       # TailwindCSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies and scripts
└── README.md                # User-facing documentation
```

### Key Directories Explained

**client/src/pages/** — Each file here becomes a routable page. For example:
- `index.tsx` → `/`
- `projects.tsx` → `/projects`
- `infra.tsx` → `/infra`

**client/src/components/ui/** — Reusable UI components built with shadcn/ui + Radix UI primitives. Import and use these in your pages:
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
```

**shared/** — Code that runs in both Node (server/index.ts) and Cloudflare Workers (worker/index.ts). Use this for:
- Type definitions that the client needs to know about
- Validation schemas (zod)
- Shared configuration

**server/routes.ts** — In development, this Express server:
- Proxies requests to GitHub API (avoiding CORS issues)
- Serves the Vite dev build
- Can handle SSR if needed

**worker/routes.ts** — In production on Cloudflare Pages:
- Handles API requests directly (no proxy needed)
- Runs your serverless backend code

## Development Workflow

### Adding a New Page

1. Create a new file in `client/src/pages/yourpage.tsx`:
   ```tsx
   import { Button } from '@/components/ui/button'
   import { Card } from '@/components/ui/card'

   export default function YourPage() {
     return (
       <div className="container mx-auto py-8">
         <h1 className="text-3xl font-bold mb-4">Your Page</h1>
         <Card className="p-6">
           <p>Your content here</p>
           <Button>Click me</Button>
         </Card>
       </div>
     )
   }
   ```

2. It's automatically routed! Visit `http://localhost:5173/yourpage`

3. Add a link in your navigation component to make it discoverable

### Adding API Logic

1. If it's development-only, add it to `server/routes.ts`:
   ```tsx
   app.get('/api/custom', (req, res) => {
     // Your logic
     res.json({ data: 'value' })
   })
   ```

2. If it needs to work in production (Cloudflare Worker), add it to `worker/routes.ts` and `shared/` if it contains reusable types.

3. Call it from the client:
   ```tsx
   const response = await fetch('/api/custom')
   const data = await response.json()
   ```

### Adding UI Components

1. Check if shadcn/ui already has what you need: https://ui.shadcn.com/docs/components/
2. If yes, copy it:
   ```bash
   npm install [component] # If not already installed
   # Component automatically goes to client/src/components/ui/
   ```
3. If no, create your own in `client/src/components/`:
   ```tsx
   // client/src/components/my-component.tsx
   export function MyComponent() {
     return <div>My component</div>
   }
   ```
4. Import and use it anywhere in `client/src/`.

## Code Patterns

### TypeScript Usage

Reilly.asia is a **full-stack TypeScript project**. All files should use `.ts` or `.tsx` extensions.

- Use `.tsx` for React components
- Use `.ts` for utilities, types, and business logic
- Always define types explicitly; avoid `any`

**Type Definitions** in `shared/` or `client/src/types/`:
```tsx
export interface Repository {
  name: string
  url: string
  description: string
  stars: number
}
```

### Component Patterns

All components follow React best practices:

```tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  children: ReactNode
  className?: string
}

export function MyComponent({ title, children, className }: MyComponentProps) {
  return (
    <div className={cn('p-4 rounded-lg', className)}>
      <h2 className="font-bold">{title}</h2>
      {children}
    </div>
  )
}
```

### Styling

Use **TailwindCSS classes** for all styling. Do not use CSS modules or inline styles unless absolutely necessary.

```tsx
<div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg hover:bg-slate-200">
  <h3 className="text-lg font-semibold">Title</h3>
  <Button>Action</Button>
</div>
```

For complex layouts, use TailwindCSS grid and flex utilities. For dynamic styling, use `cn()` from `@/lib/utils`:

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-blue-500 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Content
</div>
```

### Data Fetching

Use React Query (`@tanstack/react-query`) for remote data:

```tsx
import { useQuery } from '@tanstack/react-query'

export function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['repos'],
    queryFn: async () => {
      const res = await fetch('/api/repos')
      return res.json()
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{data.length} repos found</div>
}
```

## Testing

### Running Tests

```bash
# Run all tests once
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# UI dashboard
npm run test:ui
```

### Writing Tests

Create `.test.ts` or `.test.tsx` files next to the code you're testing:

```tsx
// client/src/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges classnames correctly', () => {
    expect(cn('p-4', 'bg-blue')).toBe('p-4 bg-blue')
  })

  it('removes duplicate classes', () => {
    expect(cn('p-4 p-8')).toContain('p-8') // tailwind-merge behavior
  })
})
```

### Coverage

Check coverage with:
```bash
npm run test -- --coverage
```

Coverage reports are generated in `coverage/` directory. Aim for >80% line coverage.

## Submitting Changes

### Before You Push

1. Check types pass:
   ```bash
   npm run check
   ```

2. Run tests:
   ```bash
   npm run test
   ```

3. Format code (if you have prettier installed):
   ```bash
   npm run format # If available
   ```

### Git Conventions

- Use descriptive commit messages: `fix: resolve navbar alignment on mobile` not `fix stuff`
- Reference issues if applicable: `Closes #123`
- Sign commits with `-s` flag for DCO compliance: `git commit -s`

### Creating a Pull Request

1. Push to a feature branch: `git push origin feature/your-feature`
2. Open a PR against `main`
3. Ensure CI passes (tests, type check)
4. Request review from maintainers

## Environment Variables

In development, no environment variables are required by default. The GitHub API proxy is set up automatically.

For production (Cloudflare Workers), define secrets in:
- `wrangler.jsonc` (local development)
- Cloudflare Pages UI (production)

If you add new API routes that need secrets, document them here.

## Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000
```

**node_modules corruption?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors but code works?**
```bash
npm run check
# Fix errors shown, then:
npm run dev
```

**Tests not picking up changes?**
```bash
npm run test:watch
# Ctrl+C and restart if stuck
```

## Questions?

- Check the [Architecture Guide](./docs/architecture.md)
- Look at existing components in `client/src/components/`
- Review test examples in `*.test.ts` files
- Open an issue on GitHub

Happy contributing! 🎉
