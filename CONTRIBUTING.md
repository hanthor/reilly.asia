# Contributing to reilly.asia

Thank you for your interest in contributing! This guide explains how to set up your development environment, run tests, and submit changes.

## Getting Started

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- npm 10+ (included with Node.js)
- Git

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hanthor/reilly.asia.git
   cd reilly.asia
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:5173`

4. **Type checking (optional, but recommended):**
   ```bash
   npm run check
   ```
   Ensures TypeScript types are valid before committing

## Development Workflow

### Before Making Changes

- Check existing [issues](https://github.com/hanthor/reilly.asia/issues) and [PRs](https://github.com/hanthor/reilly.asia/pulls) to avoid duplicating work
- For new features or significant changes, open an issue first to discuss the approach
- Reference the issue number in your PR body

### Branch Naming

Use descriptive branch names following this pattern:
- `fix/issue-description` — for bug fixes
- `feat/feature-name` — for new features
- `docs/doc-subject` — for documentation
- `refactor/change-description` — for refactoring
- `chore/task-description` — for maintenance tasks

Example: `feat/github-api-filtering`, `fix/mobile-nav-layout`

### Code Style

This project uses **TypeScript** and **React** with the following conventions:

- **Language**: TypeScript (strict mode)
- **Formatting**: ESLint via TypeScript Plugin
- **Styling**: Tailwind CSS with PostCSS
- **Component style**: Functional components with hooks
- **Naming**:
  - Components: PascalCase (e.g., `ContactForm.tsx`)
  - Utilities/functions: camelCase (e.g., `parseMarkdown`)
  - Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
  - Files: match their primary export name

### Project Structure

```
reilly.asia/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page-level components
│   │   ├── lib/         # Utilities (API, helpers)
│   │   └── types/       # TypeScript type definitions
│   └── public/          # Static assets
├── shared/              # Shared types and schemas
├── server/              # Express dev server (not in production)
├── worker/              # Cloudflare Worker code (optional)
└── dist/                # Production build output
```

## Testing

### Running Tests

```bash
# Run tests once
npm run test

# Watch mode (re-runs on file changes)
npm run test:watch

# Interactive UI
npm run test:ui
```

All new features and bug fixes should include tests. Aim for:
- Unit tests for pure functions and utilities
- Component tests for UI logicration tests for flows involving multiple components

### Coverage

Test coverage is tracked automatically. Aim to maintain or improve overall coverage:
```bash
npm run test              # Includes coverage report
```

## Verification Before Submitting

Before opening a PR, verify your changes:

```bash
# 1. Type checking
npm run check

# 2. Tests pass
npm run test

# 3. Manual testing
npm run dev              # Test in browser at http://localhost:5173
```

## Committing Changes

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

**Examples:**
- `feat(github-api): add org repository filtering`
- `fix(contact-form): correct email character limit`
- `docs: update deployment instructions`

### Signing Commits (DCO)

This project uses Developer Certificate of Origin (DCO). Sign your commits with:

```bash
git commit -s -m "your commit message"
```

The `-s` flag adds `Signed-off-by: Your Name <your-email@example.com>` to your commit message, certifying that you have the right to contribute the work.

## Pull Requests

### Before Opening

1. **Update from main:** Ensure your branch is up-to-date with `main`
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Test thoroughly:**
   ```bash
   npm run check && npm run test && npm run build
   ```

3. **Clean up commits:** Squash or organize commits logically before pushing

### PR Title and Description

**Title format:** Follow the same Conventional Commits style used for branch names:
- `feat: add GitHub API filtering`
- `fix: correct mobile navigation layout`
- `docs: update CONTRIBUTING guide`

**Description template:**
```markdown
## What does this PR do?

Brief explanation of the changes.

## Why?

Context or motivation for this change (if not obvious from the title).

## Related Issue

Closes #123 (or Refs #123 if partially addressing)

## Verification

- [ ] Tests pass (`npm run test`)
- [ ] Types pass (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
```

### PR Review Expectations

- A maintainer will review your PR within 3-5 business days
- Be responsive to feedback and requested changes
- Reference related issues or design decisions when helpful
- Use `Closes #issue-number` or `Refs #issue-number` to link issues

## Architecture and Design

For deeper understanding of the project:
- See `docs/architecture.md` for design decisions (when available)
- See `README.md` for project overview
- Cloudflare Pages deployment: See `wrangler.jsonc`
- GitHub API integration: See `client/src/lib/`

## Getting Help

- **Questions about contributing?** Open an [issue](https://github.com/hanthor/reilly.asia/issues) with label `question`
- **Found a bug?** See [reporting issues](#reporting-issues) below
- **Feature requests?** Open an issue with label `enhancement`

## Reporting Issues

When reporting a bug or requesting a feature:

1. **Search first** — check if it's already reported
2. **Include details:**
   - Clear title describing the issue
   - Steps to reproduce (for bugs)
   - Expected vs. actual behavior
   - Environment (browser, OS, Node version if relevant)
   - Screenshots or error messages if applicable
3. **Use labels** — help us categorize: `bug`, `enhancement`, `documentation`, `question`

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

This project uses DCO (Developer Certificate of Origin). Your signed-off commits certify that you are the author and have the right to contribute the work, as stated in the [DCO](https://developercertificate.org/).

---

Thank you for making reilly.asia better! 🚀
