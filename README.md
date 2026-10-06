## Prerequisites

Before setting up the project, ensure you have:

- **Node.js**: v22.0.0 or later (verify with `node --version`)
- **npm**: v10.7.0 or later (verify with `npm --version`)
  - Project uses npm lockfile version 3, requiring npm 8.11 or above
- **Git**: For cloning and version control
- **Wrangler CLI**: For Cloudflare Workers development and deployment

## Environment Variables

Optional environment variables that can be configured:

### Development (`.env.local` or environment)

```bash
# GitHub API token — optional, used for live data fetching
# Without this, GitHub API calls are rate-limited to 60 requests/hour
# Get your token at: https://github.com/settings/tokens
GITHUB_TOKEN=your_token_here

# Vite environment
VITE_API_URL=http://localhost:5173  # Proxy API endpoint in development
```

### Production / Deployment

```bash
# Cloudflare Workers
# Required for npm run deploy — set via Cloudflare dashboard or wrangler
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Optional: GitHub token for production builds
# Use if pre-building with live GitHub data
GITHUB_TOKEN=your_token_here
```

## Wrangler Setup

Wrangler is used for local development and deployment to Cloudflare Workers.

### Installation

Wrangler is included in `devDependencies`. After `npm install`, it's available via:

```bash
npm run wrangler:dev   # Start local development server
npm run deploy         # Deploy to Cloudflare Workers
```

### Authentication

1. **Local Development**: Run `npx wrangler login` to authenticate with your Cloudflare account
   - This opens a browser to authorize the CLI
   - Your credentials are saved locally in `~/.wrangler`

2. **Automated Deployment** (CI/CD): Set environment variables in your CI system:
   - `CLOUDFLARE_ACCOUNT_ID`: Found in Cloudflare Dashboard → Account Overview
   - `CLOUDFLARE_API_TOKEN`: Create at Cloudflare Dashboard → API Tokens → Create Token
     - Use "Edit Cloudflare Workers" template for minimum required permissions

### Configuration

Wrangler configuration is in `wrangler.jsonc`:
- Defines the Worker name, compatibility date, and routes
- Static assets served from `dist/public`
- Handles redirects and SPA routing via `404-page` mode

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Cloudflare Workers development server (separate terminal)
npm run wrangler:dev

# Run type checking
npm run check

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Development Server Details

- **`npm run dev`**: Vite dev server (usually http://localhost:5173)
  - Hot module replacement, instant updates
  - Proxies API requests to avoid CORS issues

- **`npm run wrangler:dev`**: Cloudflare Workers local environment
  - Emulates the production Workers runtime
  - Run in a separate terminal alongside `npm run dev`

## Testing

```bash
# Run tests once
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# UI test dashboard
npm run test:ui
```

## Type Checking

```bash
# Check TypeScript types without building
npm run check
```

## Deployment

### Cloudflare Workers Deployment

This project deploys to Cloudflare Workers:

```bash
# Deploy to production
npm run deploy
```

**Prerequisites**:
1. Cloudflare account with active subscription
2. Wrangler authentication (see [Wrangler Setup](#wrangler-setup))
3. Routes configured in `wrangler.jsonc` (usually done once)

### GitHub Actions CI/CD

The project includes GitHub Actions workflows for automated deployment. In your repository settings, add these secrets:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Workflows automatically build and deploy on:
- Push to main branch
- Pull requests (for preview builds, if configured)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/           # Utilities and API functions
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── shared/                # Shared schemas and types
├── server/                # Development server (not used in production)
├── dist/                  # Production build output
└── attached_assets/       # Source assets
```

## Contact Integration

The contact form uses `mailto:` links to open the user's default email client with pre-filled content. This approach:
- Requires no backend infrastructure
- Works with any email provider
- Maintains user privacy
- Is compatible with static hosting

## GitHub API Integration

The site fetches live data from GitHub's public API:
- In development: Uses proxy to avoid CORS issues
- In production: Direct API calls to GitHub (no authentication required)

## License

MIT License 
