
## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Cloudflare Workers Deployment

This project is deployed as a Cloudflare Worker with static asset binding. The Worker handles request routing, redirects (http → https, www handling), and the `/infra` API endpoint, while serving the static site through the asset binding.

### Prerequisites

- Wrangler CLI installed: `npm install -g @cloudflare/wrangler`
- Cloudflare account with the domain configured

### Local Testing

```bash
# Start local development server (mimics Worker environment)
npm run wrangler:dev
```

### Deployment

```bash
# Build the project
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

The deployment requires valid `wrangler.jsonc` configuration with your account ID and API token set via `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables.

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
