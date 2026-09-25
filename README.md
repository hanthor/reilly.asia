
## Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Start local Wrangler dev environment (Cloudflare Worker + Static Assets)
npm run wrangler:dev

# Build for production (emits Worker bundle and static assets to dist/public)
npm run build

# Run unit and integration tests
npm run test
```

## Cloudflare Workers Deployment

This site is deployed to Cloudflare Workers using Wrangler (`wrangler.jsonc`). The Cloudflare Worker handles canonical domain redirects (`http://` / `www.` -> `https://reilly.asia`), serves API endpoints (e.g. `/infra`), and routes static assets from `dist/public`.

### Deployment Steps

1. Build and deploy using Wrangler CLI:
   ```bash
   npm run deploy
   ```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/           # Utilities and API functions
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── worker/                 # Cloudflare Worker entry point and API/routing handlers
├── shared/                # Shared schemas, domain models, and type definitions
├── server/                # Development Express server harness
├── dist/                  # Production build output
│   └── public/            # Static assets and SPA 404 shell built by Vite
└── wrangler.jsonc         # Cloudflare Worker configuration
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
