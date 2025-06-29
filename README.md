
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

## Cloudflare Pages Deployment

### Method 1: Direct Upload

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to Cloudflare Pages

### Method 2: Git Integration

1. Connect your GitHub repository to Cloudflare Pages
2. Set build configuration:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

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
