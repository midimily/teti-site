# Teti Registry beta plan

## Objective

Support 10,000 registered Teti and approximately 1,000 recently active Teti without changing the Teti Desktop request contract or scanning KV from public traffic.

## Read path

`GET /api/tetis` reads only `registry:active`; `GET /api/tetis?page=n` reads only `registry:index:page:n`; and `GET /api/stats` reads only `registry:stats`. If an aggregate is absent, the API returns the built-in seed records. All public responses include `listUsed: false`, KV binding state, source, index key, aggregate count, and a cache hint. `/api/health` checks only whether the binding exists.

Public list and stats responses are CDN-cacheable for 30/60 and 60/120 seconds respectively (`max-age`/`s-maxage`). Mutation and administration responses are explicitly `no-store`.

## Aggregate keys

| Key | Owner | Purpose |
| --- | --- | --- |
| `registry:active` | scheduled merge | Cached public active snapshot |
| `registry:recent` | register/rebuild | Most recently registered records |
| `registry:stats` | register/rebuild/merge | Registry, active, and recent counts |
| `registry:index:page:n` | rebuild; page 1 on register | 100-record public pages |
| `registry:active:bucket:00` … `:31` | register/heartbeat | Sharded source of active presence |

`registry:index:meta` is a small supporting key recording page count. It is not required for a normal public list read.

## Write and merge path

`POST /api/register` writes the individual `teti:{id}`, refreshes recent and page 1, updates stats, and places that record in its hash-selected active bucket. It does not scan KV.

`POST /api/heartbeat` accepts the existing identifier aliases (`teti_id`, `tetiId`, or `id`). A heartbeat arriving within five minutes of the record's `lastSeenAt` returns success with `skippedWrite: true`. A later heartbeat updates the individual record and one of 32 bucket keys; it never writes `registry:active` directly.

The Worker cron runs every five minutes and performs 32 direct bucket reads, prunes stale entries, and writes a fresh `registry:active` snapshot. This gives an intentionally near-real-time, not second-by-second, public view.

## Rebuild and operations

`POST /api/admin/rebuild-index` requires `x-admin-token: $ADMIN_TOKEN` (or a Bearer token). This is the sole code path containing `KV.list({prefix: "teti:"})`. It pages the namespace, writes all index pages, `registry:recent`, `registry:stats`, and rebuilds the active snapshot. Configure `ADMIN_TOKEN` as a Worker/Pages secret; do not expose it to the site.

## Risks and mitigations

- Cloudflare KV is eventually consistent and has no compare-and-swap. Concurrent registrations or heartbeats in one bucket can temporarily lose a read-modify-write update or drift a counter. Thirty-two buckets reduce the collision surface; scheduled/admin rebuild repairs aggregate state. A future scale-up can move bucket mutation to Durable Objects.
- `registry:active` is intentionally only as fresh as the merge schedule plus cache TTL. UI wording says “Recently active” / “last few minutes”, never real-time.
- Index pages can be temporarily incomplete for records registered after the last rebuild (page 1 and recent are updated immediately). Run the authenticated rebuild on a controlled cadence to make the full paginated index authoritative.
- Rebuild scans and reads every record, so it should be an operations action or scheduled maintenance task, never a public endpoint.
