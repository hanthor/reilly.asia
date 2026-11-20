
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

The portfolio uses GitHub's public API for live repository data. The `/ghstats` dashboard uses an hourly GitHub Actions snapshot published as the `ghstats-data` release asset.

The snapshot tracks public PRs authored by `hanthor` during the trailing 365 days, including PRs that are still open or were closed without merging. The dashboard reports created and merged PR counts and UTC daily trends separately. Daily charts for created PRs, merged PRs and lines changed overlay a trailing 7-day average; hovering, tapping or using the arrow keys on a chart shows the day's values.

A second snapshot, `ghstats-org.json`, covers every public PR in the `tuna-os` org by any author, including the Hive agents' GitHub Apps. `/ghstats?scope=org` shows it, adding top contributors and the share merged from bots. The same Worker serves `stats.tunaos.org` (a custom domain in `wrangler.jsonc`), where every page path renders the org view. `scripts/ghstats.ts --scope org` splits each weekly search window in half until it stays under GitHub's 1000-result search cap.

## License

MIT License 
