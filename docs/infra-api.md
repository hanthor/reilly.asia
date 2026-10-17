# Infrastructure API

`reilly.asia` exposes three unauthenticated JSON endpoints for the infrastructure page. They are intended for public status display, not as a control plane or a source of secrets.

## Common behavior

- Base path: `https://reilly.asia/infra/api/`
- Supported methods: `GET` and `HEAD`
- Other methods return `405 Method Not Allowed` with `Allow: GET, HEAD`.
- Successful responses use `Content-Type: application/json; charset=utf-8`, `Access-Control-Allow-Origin: *`, and a public `Cache-Control` header.
- Upstream probes and GitHub/raw-file reads have five-second timeouts. A failed upstream read becomes `null` or a failed status field; normal upstream failures do not turn the endpoint into a `500`.
- Unknown paths below `/infra/api/` return `404` with `{"error":"not found"}`.

The API is public. Do not send credentials in requests, and do not assume response data is private or stable enough for automation that changes infrastructure.

## `GET /infra/api/status`

Returns live reachability for public services and the latest `hivecommons/hive` release.

```json
{
  "checkedAt": "2026-09-24T15:00:00.000Z",
  "endpoints": [
    {
      "name": "School Hive",
      "label": "school.tunaos.org",
      "group": "hive",
      "up": true,
      "latencyMs": 142
    }
  ],
  "hive": {
    "latestRelease": "v5.35.5",
    "releaseUrl": "https://github.com/hivecommons/hive/releases/tag/v5.35.5"
  }
}
```

`endpoints` contains these configured public probes:

| Name | Host | Probe path | Group |
| --- | --- | --- | --- |
| School Hive | `school.tunaos.org` | `/api/health` | `hive` |
| Reef Hive | `reef.tunaos.org` | `/api/health` | `hive` |
| Hive hub | `hub.tunaos.org` | `/` | `hive` |
| Personal Hive | `hive.reilly.asia` | `/api/health` | `hive` |
| Synapse homeserver | `matrix.reilly.asia` | `/_matrix/client/versions` | `matrix` |
| Matrix auth (MAS) | `auth.reilly.asia` | `/.well-known/openid-configuration` | `matrix` |
| MatrixRTC calls | `call.reilly.asia` | `/` | `matrix` |

For each endpoint:

- `up` is `true` only for a `2xx` probe response.
- `up` is `false` for a non-`2xx` response, timeout, or network error.
- `latencyMs` is the measured probe time for a response and `null` when no response was received.
- `label` is the hostname; the full probe URL is not returned.

`hive.latestRelease` and `hive.releaseUrl` are `null` when GitHub cannot provide a release tag. The response is cached for 60 seconds.

## `GET /infra/api/activity`

Returns recent automation activity for `hanthor/dotfiles` and the latest completed CI run on its `master` branch.

```json
{
  "windowDays": 30,
  "fetchedAt": "2026-09-24T15:00:00.000Z",
  "mergedTotal": 12,
  "mergedRenovate": 5,
  "mergedHive": 4,
  "ci": {
    "conclusion": "success",
    "url": "https://github.com/hanthor/dotfiles/actions/runs/123456789",
    "at": "2026-09-24T14:50:00Z"
  }
}
```

- The counts cover merged pull requests in the 30 days before `fetchedAt`.
- `mergedRenovate` filters that window to `author:app/renovate`.
- `mergedHive` filters that window to `author:app/hanthor-hive-agent`.
- `ci` describes the newest completed `ci.yml` run on `master`; `conclusion`, `url`, and `at` are `null` when no result is available.
- GitHub failures, rate limits, and timeouts produce `null` counts or CI fields instead of an exception.

Normal responses are cached for one hour. When every count and the CI conclusion is `null`, the empty result is cached for five minutes so a temporary GitHub failure can recover sooner.

## `GET /infra/api/fleet`

Returns sanitized device facts published on the `fleet-facts` branch of `hanthor/dotfiles`. The endpoint fetches one JSON file per known host:

- `himachal`
- `kanpur`
- `dilli`
- `kerala`
- `mumbai`
- `goa`
- `punjab`
- `termux`

```json
{
  "hosts": {
    "punjab": {
      "schema": 1,
      "host": "punjab",
      "updated": "2026-09-24T14:50:55Z",
      "groups": ["cloud"],
      "os": {
        "name": "Ubuntu",
        "version": "24.04",
        "codename": "noble",
        "kernel": "6.8"
      },
      "hardware": {
        "vendor": "Amazon EC2",
        "model": "t3.large",
        "form_factor": "vm",
        "arch": "x86_64",
        "cpu": "AMD EPYC",
        "cpu_threads": 2,
        "gpus": [],
        "memory_gb": 7.6
      },
      "virtualization": "kvm",
      "uptime_days": 3.5,
      "last_apply": {
        "at": "2026-09-24T14:45:00Z",
        "ok": true
      }
    },
    "goa": null
  },
  "fetchedAt": "2026-09-24T15:00:00.000Z"
}
```

Every key in `hosts` is one of the known host names. A host value is `null` when its raw file is missing, non-2xx, invalid JSON, larger than 64 KiB, or unavailable after the five-second timeout. One bad host does not discard other hosts.

The Worker sanitizes each object before returning it:

- Unknown fields are dropped.
- Strings are trimmed, control characters and IPv4/IPv6/MAC-address-shaped values are removed, and values are length-limited.
- Numeric and boolean fields are accepted only within their documented validation ranges.
- The returned `host` is the requested host name, never an untrusted value from the file.
- `updated` and `last_apply.at` are normalized to bounded ISO timestamps.

Normal responses are cached for 10 minutes. If every host is `null`, the empty result is cached for one minute.

## Freshness and failure handling

These endpoints are edge-cached and can be stale for their stated cache lifetime. The timestamps in each response describe when the Worker built that payload, not when a client received it. Treat `null`, `false`, and an `unknown` display state as valid observations rather than as permission to retry aggressively.
