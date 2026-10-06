# reilly.asia

Personal website and infrastructure hub. Built with React, TypeScript, and Tailwind CSS, deployed to Cloudflare Pages.

## What it includes

- **Portfolio** — Projects, work history, and infrastructure overview
- **Contact form** — Email via `mailto:` (no backend required)
- **Live GitHub data** — Repositories and activity fetched from GitHub's public API
- **Responsive design** — Mobile-first layout with Tailwind CSS
- **Static hosting** — Deployed to Cloudflare Pages with automatic builds

## Prerequisites

- **Node.js**: 18.x or later (LTS recommended)
- **npm**: 9.x or later, or **pnpm**: 8.x or later
- Git

To verify your Node version:

```bash
node --version
npm --version
```

## Local Development

### Install dependencies

```bash
npm install
# or with pnpm
pnpm install
```

### Start development server

```bash
npm run dev
# or
pnpm dev
```

The development server runs on `http://localhost:5173` by default. Open it in your browser.

### Build for production

```bash
npm run build
# or
pnpm build
```

The build output lands in the `dist/` folder.

### Preview production build locally

```bash
npm run preview
# or
pnpm preview
```

This serves the built version at `http://localhost:4173`, letting you verify the production build before deployment.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and API functions
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets (favicon, etc.)
├── shared/                 # Shared schemas and TypeScript types
├── server/                 # Vite dev server (not used in production)
├── dist/                   # Production build output (generated)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## Architecture

The site is a single-page application (SPA) with two parts:

- **Frontend (React)** — Pages, components, styles. Runs in the browser.
- **Backend (optional)** — Development-only Vite server. Production uses static Cloudflare Pages with no server.

TypeScript is used throughout for type safety.

## Environment Setup

No environment variables are required for local development. The site:
- Uses `mailto:` links for contact (no backend)
- Fetches public GitHub API data without authentication

In production (Cloudflare Pages), GitHub API calls go directly from the browser — no proxy needed since the data is public.

## Cloudflare Pages Deployment

### Method 1: Git Integration (recommended)

1. Push to GitHub and trigger Cloudflare Pages deployment automatically
2. Cloudflare builds and deploys on every push to `main`:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

### Method 2: Direct Upload

1. Build locally:
   ```bash
   npm run build
   ```

2. Upload the `dist/` folder to Cloudflare Pages via the dashboard

## Features Explained

### Contact Integration

The contact form uses `mailto:` links to open the user's default email client with pre-filled subject and body:

- No backend infrastructure required
- Works with any email provider (Gmail, Outlook, Apple Mail, etc.)
- Maintains user privacy (no data is sent to a server)
- Compatible with static hosting

### GitHub API Integration

The site fetches live GitHub data (repositories, profile info, etc.):

- **In development** (`npm run dev`): Requests route through a Vite dev proxy to avoid CORS errors
- **In production** (Cloudflare Pages): Direct API calls to `api.github.com` (no authentication required, public data only)

If you hit GitHub API rate limits (60 requests per hour for unauthenticated requests), the site degrades gracefully — missing data is not fatal.

## Troubleshooting

### Port already in use

If `npm run dev` fails with "port 5173 already in use":

```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 5174
```

### Slow builds

If the build is slow:

1. Ensure you're using Node 18 LTS or later (`node --version`)
2. Try clearing cache and node_modules:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

### GitHub API 403 errors

If the site cannot fetch GitHub data:

1. Check your internet connection
2. Verify `api.github.com` is not blocked by your firewall
3. The GitHub API has rate limits (60 requests/hour unauthenticated)

### Cloudflare deployment fails

Check the deployment logs in the Cloudflare Pages dashboard:

1. Go to `https://dash.cloudflare.com` → Pages → this project
2. Click on the failed deployment to see build logs
3. Common issues:
   - Node version mismatch: Ensure `node --version` matches Cloudflare's environment
   - Missing dependencies: Try `npm ci` instead of `npm install`

## Contributing

This is a personal project, but pull requests are welcome. For significant changes:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and commit with DCO sign-off (`git commit -s`)
4. Open a pull request with a clear description
5. Ensure `npm run build` passes locally before pushing

## License

MIT License. See [LICENSE](LICENSE) for details.
