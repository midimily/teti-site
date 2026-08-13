# Teti Site Beta 1.0 - Network v0.1.9 Integration

## Final boundary

```text
teti.bot / Cloudflare Pages
  -> same-origin /api/network*
  -> network.teti.bot / Public Surface only
  -> Redis availability + SQLite public identity projection
```

`network.teti.bot` is the only Network source of truth. Cloudflare Pages remains the website host
and BFF runtime; Workers KV and the legacy Registry Worker have no production role.

## Contract mapping

| Site capability | Pages BFF | Network v0.1.9 | Site fields |
| --- | --- | --- | --- |
| Public directory | `GET /api/network` | `GET /v1/public/directory` | `id`, `displayName`, `summary`, `presence` |
| Network counts | `GET /api/network` | `GET /v1/public/stats` | `totalTetis`, `publicTetis`, `availableNow`, `generatedAt` |
| Exact Teti ID lookup | `GET /api/network/identities/{id}` | `GET /v1/public/identities/{tetiId}` | `id`, `displayName`, `summary`, `presence` |

The BFF requires Protocol 1 and Contract Revision 9 or newer, validates every success body, maps
Network DTOs through a field allowlist, and sends no authentication secret. It never calls the
Protocol 1 compatibility routes under `/v1/public/nodes*`.

## Presence and failures

- Presence is exactly `available` or `unavailable`; the site does not infer status from timestamps.
- Network HTTP 503 is a dependency failure, not an unavailable Presence result.
- Initial Network failure produces a localized temporary-unavailable state.
- Refresh failure after a successful response keeps the last successful snapshot and labels it stale.
- 404 exact lookup does not reveal whether an identity is absent, hidden, revoked, or unroutable.
- Every BFF error response uses `Cache-Control: no-store`.

## Cache and refresh

The combined directory/stats BFF response uses the shorter Public Surface edge lifetime:

```text
public, max-age=0, s-maxage=5, stale-while-revalidate=5
```

The Pages Function uses an explicit Cloudflare Cache API namespace keyed by the complete same-origin
request URL. The browser refreshes the active directory every 10 seconds and never adds timestamp
cache busters.

## Removed runtime dependencies

- Worker Registry implementation
- KV namespace bindings
- `TETI_REG` and `TETI_REGISTRY`
- KV key scans, Registry indexes, seed data, and status inference
- old `/api/tetis` and Registry stats routes
- fake Site capabilities, locations, signals, and profile fields

Git history remains the rollback record; no dual-read or fallback path remains in the product.
