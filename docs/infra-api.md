# `/infra/api` endpoints

The Worker (`worker/index.ts`) serves three public, read-only JSON endpoints
that feed the `/infra` page. They are on `https://reilly.asia` (and `www.`,
which redirects to the apex). Paths are defined once in
`shared/infra-routes.ts`; payload types live in `shared/infra.ts` and
`shared/fleet.ts`.

| Path | Source | Cache TTL |
| --- | --- | --- |
| `/infra/api/status` | live probes of the public endpoints in `PUBLIC_ENDPOINTS` plus the latest `hivecommons/hive` release | 60 s |
| `/infra/api/activity` | GitHub search/Actions data for `hanthor/dotfiles`, trailing 30 days | 1 h (5 min when GitHub returned nothing) |
| `/infra/api/fleet` | per-machine facts from the `fleet-facts` branch of `hanthor/dotfiles` | 10 min (1 min when every host failed) |

The GitHub stats snapshot at `/api/ghstats` is a separate endpoint; see the
GitHub API Integration section of the README.

Example bodies below are illustrative; real values change.

## Common behaviour

- **Methods:** only `GET` and `HEAD`. Any other method on an `/infra` path
  returns `405 Method Not Allowed` with `Allow: GET, HEAD`.
- **Headers on success:** `Content-Type: application/json; charset=utf-8`,
  `Cache-Control: public, max-age=<TTL>` and `Access-Control-Allow-Origin: *`,
  so any origin may read them from a browser.
- **Query strings are ignored.** The edge cache key drops them, so
  `?x=1` returns the same cached body.
- **Cache:** responses are stored in the Workers cache (`caches.default`). A hit
  returns the stored response unchanged, so its `Cache-Control` shows the full
  TTL rather than the time remaining. If the cache is unavailable the Worker
  builds the response live.
- **Failures degrade, they do not 500.** Every upstream call has a 5 second
  timeout and a failed lookup becomes `null` (or `up: false` for a probe) in the
  payload. Check the field, not the HTTP status, to tell whether data is
  missing. If a builder throws unexpectedly the Worker answers
  `{"error":"unavailable"}` with HTTP 200 and `max-age=30`.
- **Unknown paths:** anything else under `/infra/api/` returns `404` with
  `{"error":"not found"}` (no `Cache-Control`, no CORS header).

## `GET /infra/api/status`

Type: `StatusPayload` in `shared/infra.ts`.

```json
{
  "checkedAt": "2026-01-01T00:00:00.000Z",
  "endpoints": [
    { "name": "School Hive", "label": "school.tunaos.org", "group": "hive", "up": true, "latencyMs": 142 }
  ],
  "hive": { "latestRelease": "v5.35.5", "releaseUrl": "https://github.com/hivecommons/hive/releases/tag/v5.35.5" }
}
```

- Each entry in `endpoints` is one request to `https://<label><path>` (the
  path is in `PUBLIC_ENDPOINTS`; the response never includes it). `up` is `true`
  only for a 2xx status. Redirects are not followed, so a 3xx counts as `up: false`.
- A timeout or network error gives `up: false` and `latencyMs: null`.
  `up: null` ("not measured") is part of the type and is used by the page's
  loading state; this endpoint itself always returns `true` or `false`.
- `hive.latestRelease` comes from the GitHub releases API. If that fails, the
  Worker falls back to reading the `Location` header of
  `github.com/hivecommons/hive/releases/latest`. Both `latestRelease` and
  `releaseUrl` are `null` if both fail.

## `GET /infra/api/activity`

Type: `ActivityPayload` in `shared/infra.ts`.

```json
{
  "windowDays": 30,
  "fetchedAt": "2026-01-01T00:00:00.000Z",
  "mergedTotal": 120,
  "mergedRenovate": 40,
  "mergedHive": 55,
  "ci": { "conclusion": "success", "url": "https://github.com/hanthor/dotfiles/actions/runs/1", "at": "2026-01-01T00:00:00Z" }
}
```

- `mergedTotal`, `mergedRenovate` and `mergedHive` count PRs merged in
  `hanthor/dotfiles` over the last `windowDays` (30), in total and by the
  `app/renovate` and `app/hanthor-hive-agent` authors.
- `ci` is the latest completed `ci.yml` run on `master`. `conclusion` is
  GitHub's value (`success`, `failure`, ...).
- Each field is independently `null` when its GitHub call failed. When all four
  are `null` the response is cached for 5 minutes instead of an hour.
- `GITHUB_TOKEN` is optional. Without it the Worker makes anonymous GitHub
  calls, which share a rate limit per egress IP and so may return `null` fields.

## `GET /infra/api/fleet`

Type: `FleetPayload` in `shared/fleet.ts`.

```json
{
  "hosts": {
    "himachal": { "schema": 1, "host": "himachal", "updated": "2026-01-01T00:00:00Z", "groups": ["workstation"], "os": { "name": "Fedora", "version": "44", "codename": null, "kernel": "7.2.11" }, "hardware": { "vendor": null, "model": null, "form_factor": null, "arch": "x86_64", "cpu": null, "cpu_threads": 16, "gpus": [], "memory_gb": 32 }, "virtualization": null, "uptime_days": 3.2, "last_apply": { "at": "2026-01-01T00:00:00Z", "ok": true } },
    "termux": null
  },
  "fetchedAt": "2026-01-01T00:00:00.000Z"
}
```

- `hosts` has one key per name in `FACT_HOSTS` (`shared/fleet.ts`). Each file is
  fetched from
  `https://raw.githubusercontent.com/hanthor/dotfiles/fleet-facts/facts/<host>.json`.
- A host is `null` when its file is missing, not an object, not valid JSON,
  larger than 64 KiB, or the fetch failed or timed out.
- The machines write these files themselves, so the Worker treats them as
  untrusted. `sanitizeFacts` keeps only the fields in `FleetFacts`, always
  reports the requested host name rather than the file's claim, coerces
  numbers and booleans, truncates strings, and removes anything shaped like an
  IPv4, IPv6 or MAC address. Any missing or invalid field becomes `null`
  (or `[]` for `groups` and `gpus`).
- When every host is `null` the response is cached for 1 minute instead of 10.
