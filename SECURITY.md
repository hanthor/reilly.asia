# Security Policy

## Reporting a vulnerability

Please do not open a public GitHub issue for an unpatched security vulnerability. Send a private report to [jreilly1821@gmail.com](mailto:jreilly1821@gmail.com).

Include, when available:

- affected URL, file, component, or commit;
- concise description of the vulnerability and its impact;
- reproduction steps or a minimal proof of concept;
- prerequisites or conditions needed to reproduce it; and
- sanitized logs, screenshots, or response samples.

Do not include passwords, API tokens, private keys, personal data, or other secrets in the initial report. If sensitive evidence is required, request a safer exchange method in the email instead of sending it inline.

Reports about this repository are reviewed by the project maintainer. No response or remediation time is guaranteed; the report will be assessed and coordinated with the reporter when practical.

## Scope

Reports are in scope when they affect:

- the deployed site at `https://reilly.asia` or its static assets;
- the Cloudflare Worker routes under `/infra`, including its public JSON endpoints and handbook proxy; or
- repository code, configuration, or documentation that changes the security of the deployment.

The contact form builds a `mailto:` URL and opens the visitor's local mail client; it does not submit form data to a project server. Do not submit secrets or sensitive personal data through the public `/infra` endpoints or the contact form.

Report vulnerabilities in Cloudflare, GitHub, the `hanthor/dotfiles` handbook, or third-party dependencies to their respective maintainers as well. Feature requests, ordinary bugs, content issues, and broken links belong in regular project issues rather than private security reports.

## Current security controls

The deployment currently includes:

- HTTP and `www` to canonical HTTPS redirects in `worker/routes.ts`;
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS headers in `client/public/_headers`; and
- bounded upstream requests and failure handling for the `/infra` API in `worker/api.ts`.

These controls do not replace private vulnerability reporting. Security behavior can change as the site and its dependencies change.
