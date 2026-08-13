# Teti Network Requirements for teti-site Beta 1.1

## Objective

Make a canonical Teti ID a public, resolvable and shareable AI Identity at:

```text
https://teti.bot/teti_xxxxxxxxx
```

The Site remains a Cloudflare Pages application with a same-origin BFF. Teti Network remains the
only source of identity and Presence truth.

## Production acceptance

Teti Network v0.1.10 / Contract Revision 10 fulfills the Beta 1.1 request.

| Beta 1.1 need | Production contract | Decision |
| --- | --- | --- |
| Exact public identity | `GET /v1/public/identities/{tetiId}` | Ready; keep this route |
| Exists and available | HTTP 200, `presence: available` | Ready |
| Exists but unavailable | HTTP 200, `presence: unavailable` | Ready |
| Missing or not public | HTTP 404, `IDENTITY_NOT_FOUND` | Ready |
| Public display name and summary | `PublicIdentity` allowlist | Ready |
| AI capability display | `PublicIdentity.capabilityIds` | Ready |

The existing exact route already makes nonexistent, revoked, hidden and unroutable identities
indistinguishable. That is the correct public privacy boundary. The Site maps all of them to the
same restrained `Teti not found` state and never calls the Directory to infer existence.

## Route decision

Do not make teti-site consume `GET /v1/public/nodes/{tetiId}`.

That path is the Protocol 1 Node Resolution Surface for the App. Its DTO contains routing and
cryptographic fields and has different discoverability semantics. Reusing it would collapse the
Public and App-facing boundaries maintained by Teti Network.

The canonical Site dependency remains:

```http
GET /v1/public/identities/{canonicalTetiId}
```

## Delivered additive field

Contract Revision 10 adds one owner-approved field to `PublicIdentity`:

```json
{
  "tetiId": "teti_bz0nwanxu",
  "displayName": "Meng's Teti",
  "summary": "A calm local AI identity node.",
  "presence": "available",
  "capabilityIds": ["coding", "research"]
}
```

Requirements:

- source only from the explicitly public `PublicProfile.capabilitySummary.capabilityIds`;
- always return an array after the new revision, using `[]` when nothing is published;
- canonical lowercase hyphenated slugs, at most 64 characters each, sorted and unique;
- retain the existing maximum of 32 IDs;
- apply the same field contract to exact identity and directory items if they continue sharing one
  `PublicIdentity` schema;
- do not expose platform, category, `aiEnvironment`, Agent/runtime observations or relationship
  capabilities as part of this change.

teti-site Beta 1.1 requires Revision 10, validates `capabilityIds`, and maps it to the Site-only
`capabilities` view model. No Node DTO is passed to the browser.

## Unchanged semantics

- Exact identity success cache remains `public, max-age=0, s-maxage=5, stale-while-revalidate=5`.
- Every error remains `no-store`.
- Redis failure remains HTTP 503, never `presence: unavailable`.
- HTTP 404 remains absence/non-public, never an offline signal.
- No authentication secret or browser CORS is required; the Pages BFF is the consumer.
- No KV, copied Registry, fallback or direct database access is introduced.

## Verified Network behavior

1. Public exact lookup returns sorted `capabilityIds` from an approved Public Profile.
2. A profile without capabilities returns `capabilityIds: []`.
3. Hidden, revoked, unroutable and nonexistent identities return the same 404 envelope.
4. A public identity without fresh Presence returns 200 with `unavailable`.
5. Privacy tests reject routing, key, relay, client, relationship and runtime fields recursively.
6. OpenAPI, route manifest, fixtures and the Site handoff advertise the new Contract Revision.

## Site work already completed

- canonical root identity route `/{tetiId}`;
- homepage finder redirects to the identity route;
- directory name and ID link to the identity route;
- loading, resolved, stale, Network error and not-found states;
- distinct available/unavailable Presence;
- Connect handoff, Copy Teti ID and Copy Link;
- localized Chinese/English metadata and canonical URL;
- desktop and mobile responsive structure.
