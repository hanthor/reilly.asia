# Contributing to reilly.asia

Thanks for taking an interest. This guide covers the local setup, the checks a change should pass, and how to propose a change. For the project overview and deployment details, see [README.md](./README.md). To report a vulnerability, follow [SECURITY.md](./SECURITY.md) rather than opening a public issue.

## Local setup

Use Node.js 20 or newer (the scheduled `ghstats` workflow runs on Node 20).

```bash
npm install
npm run dev        # Vite dev server for the client
npm run wrangler:dev  # Worker locally, closer to production routing
```

## Checks

Run these before opening a pull request:

```bash
npm run check      # tsc, type-checks client/, shared/ and worker/
npm run test       # vitest with coverage for shared/, worker/ and client/src/
npm run build      # production build via Vite
```

Tests live next to the code they cover, as `*.test.ts` files in `shared/`, `worker/` and `client/src/`. New behaviour and bug fixes should come with a test that fails without the change.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles, for example `fix(wrangler): route www.reilly.asia as a zone route` or `docs: add contributing guide`. Recent history follows this pattern.
- Sign off each commit with `git commit -s`, which adds a `Signed-off-by` line certifying the [Developer Certificate of Origin](https://developercertificate.org/).
- Keep each PR focused on one change, and link the issue it addresses with `Closes #N` (or `Refs #N` when it only partly addresses the issue).
- Explain why the change is needed in the PR description; the diff already shows what changed.

Before opening a PR, check the existing issues and pull requests so you do not duplicate work. For a larger change, open an issue first to agree on the approach.

## License

The project is released under the MIT License, as declared in `package.json`.
