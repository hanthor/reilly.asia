# reilly.asia

Personal website and consulting portfolio, showcasing expertise in infrastructure, distributed systems, and full-stack development. Built with React, Vite, TypeScript, and Tailwind CSS; deployed on Cloudflare Pages.

**Live site:** https://reilly.asia

## Features

- **Portfolio** — projects, talks, expertise and consulting information
- **Infrastructure showcase** — `/infra` page with live Cloudflare and GitHub API integration
- **Contact** — privacy-first contact form (no backend required)
- **Responsive design** — React components with Tailwind styling

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site opens at `http://localhost:5173` with hot module reloading.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Cloudflare Pages

The site is deployed to Cloudflare Pages from the `main` branch.

**Build configuration:**
- **Framework:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (leave empty)

**Custom domain:** `reilly.asia` is configured as the custom domain in Cloudflare Pages settings.

To deploy manually:

1. Build the project: `npm run build`
2. Upload the `dist` folder to Cloudflare Pages via the dashboard, or use the Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler pages deploy dist
   ```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components (home, infra, not-found)
│   │   ├── lib/           # Utilities and API functions
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── shared/                # Shared schemas and types
├── server/                # Express dev server (not used in production)
├── worker/                # Cloudflare Workers integration (if used)
├── dist/                  # Production build output (generated)
└── wrangler.jsonc         # Cloudflare Pages / Workers configuration
```

## Features in Detail

### Contact Integration

The contact form uses `mailto:` links to open the user's default email client with pre-filled content. This approach:
- Requires no backend infrastructure
- Works with any email provider
- Maintains user privacy (no data collection)
- Is compatible with static hosting

### GitHub API Integration

The `/infra` page fetches live data from GitHub's public API:
- In development: Uses a proxy server to avoid CORS issues (see `server/`)
- In production: Direct API calls to GitHub (no authentication required, subject to rate limits)

To understand the infrastructure API integration, see `client/src/lib/` for API utilities and `client/src/pages/infra.tsx` for the page component.

### Styling

The site uses Tailwind CSS for styling with a custom configuration. Design tokens are defined in `tailwind.config.ts`. All components use utility classes for consistent, responsive styling.

## Development

### Running Tests

```bash
npm run test
```

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## License

MIT License
