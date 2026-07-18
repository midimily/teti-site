# Teti Registry beta result

## Delivered

- Public APIs no longer scan `teti:` keys. `/api/tetis`, `/api/stats`, `/api/health`, individual Teti lookup, and connect use direct aggregate or direct-record reads only.
- Added registry aggregates, 32 active buckets, five-minute heartbeat write throttling, scheduled active merge, authenticated admin rebuild, cache headers, and rich `/api/tetis` metadata.
- The homepage now requests only `/api/tetis` and `/api/stats`, uses normal cache semantics, and refreshes every 90 seconds. Its copy describes recent activity rather than seconds-level presence.
- Added `npm run registry:smoke`, an in-memory Worker integration simulation for 10,000 records and 1,000 heartbeats.

## Validation commands

```bash
npm run build
npm run registry:smoke
```

The smoke test verifies the authenticated rebuild's paginated scan, 10,000-record aggregate count, 1,000 active records, throttling of a duplicate heartbeat, no public `KV.list` calls, and spread of heartbeat writes across active buckets.

## Latest local validation

`npm run build` completed successfully. The smoke simulation completed with `registryCount: 10000`, `activeCount: 1000`, `publicListCalls: 0`, all 32 bucket keys receiving writes, a maximum of 35 writes to one bucket, and `duplicateHeartbeatSkipped: true`. It also asserts the public cache headers, no-store mutation header, and the existing Desktop `/heartbeat` response contract.

The production rebuild completed on 2026-07-18 with `registryCount: 2`, `pages: 1`, and `activeCount: 1`. Worker version `436f36fe-b2ab-4101-ab3d-72afb535a0cc` and Pages deployment `39fd5cdf` expose the corrected beta API. If aggregate stats are ever missing while legacy records already exist, the API now reports an uninitialized (`null`) total instead of writing a false zero; the authenticated rebuild remains the path that establishes the authoritative count.

## Deployment checklist

1. Bind the production `TETI_REGISTRY` namespace to both the Worker and Pages project.
2. Set `ADMIN_TOKEN` as a secret in both environments where the Pages Function runs.
3. Deploy, call the authenticated rebuild once, and inspect `/api/health`, `/api/stats`, and `/api/tetis`.
4. Keep the `*/5` Worker cron enabled. For Pages-only deployment, invoke the protected rebuild or equivalent scheduled Worker separately, because Pages Functions do not run Worker cron handlers.
