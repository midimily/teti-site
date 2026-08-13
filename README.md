# teti-site

Official website for [teti.bot](https://teti.bot), the public entry point to the Teti Network.

Teti is a local AI identity node. The Beta 1.0 website explains that identity model, shows the
public Teti directory and coarse Presence, supports exact Teti ID lookup, hands connection intent
to the macOS app, and provides the macOS release entry point.

It does not provide accounts, chat, a social feed, a management dashboard, or its own Registry.

## Architecture

```text
Browser
  -> teti.bot (Cloudflare Pages)
  -> /api/network* (same-origin Pages Function BFF)
  -> network.teti.bot (Teti Network v0.1.9 Public Surface)
  -> Redis Presence + SQLite Identity/Profile data
```

Cloudflare Pages hosts the site, static assets, and a small server-side BFF. Teti Network data is
provided exclusively by `network.teti.bot`. This repository does not maintain a Registry or
Network database, and it has no Workers KV dependency or legacy fallback.

The BFF consumes only these unauthenticated, allowlisted Public Surface endpoints:

- `GET /v1/public/directory`
- `GET /v1/public/identities/{tetiId}`
- `GET /v1/public/stats`

The browser consumes the stable same-origin routes `GET /api/network` and
`GET /api/network/identities/{tetiId}`. It never receives Network routing or private Node data.

## Stack

- React 19, Vite, and TypeScript
- Astryx design system packages
- Cloudflare Pages and Pages Functions
- Teti Network Protocol 1, Contract Revision 9
- npm

## Local Development

Prerequisites:

- Node.js 22 or newer for `teti-site`
- A local Teti Network v0.1.9 service at `http://127.0.0.1:8788`

Install and validate dependencies:

```bash
npm ci
npm run typecheck
npm test
```

Start Vite for the full same-origin Site API flow:

```bash
npm run dev
```

The local Vite middleware reuses the production `createSiteApi` handler and calls
`http://127.0.0.1:8788`. To test the actual Cloudflare Pages runtime, run:

```bash
npm run pages:dev
```

Open `http://127.0.0.1:4173`. The script binds the BFF-only origin to
`http://127.0.0.1:8788`; browser calls remain same-origin under `/api/network*`.

Production build and preview:

```bash
npm run build
npm run preview
```

The production output directory is `dist`.

## Internationalization

The UI supports one Chinese interface (`zh`) and English (`en`). On first visit, any browser
locale beginning with `zh` selects Chinese; all other locales select English. A manual `中 / EN`
choice is stored in `localStorage` and takes priority over browser language on later visits.

## Cloudflare Pages Deployment

Connect `midimily/teti-site` to Cloudflare Pages with:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Production branch: `main`

Pages automatically deploys the `functions/` directory with the static build. Production defaults
to `https://network.teti.bot`; no secret or data binding is required. An optional plain-text Pages
environment variable can override the origin for a controlled preview environment:

```text
TETI_NETWORK_ORIGIN=https://network.teti.bot
```

Do not configure `TETI_REGISTRY`, a KV namespace, or a legacy Registry Worker. Do not commit
`node_modules`, `dist`, `.env`, `.dev.vars`, or machine-local files.

## Public Failure Behavior

If Teti Network is unavailable, the static site, product explanation, and download entry remain
usable. The Network directory reports a temporary outage instead of showing an empty Registry or
marking every Teti unavailable. After a successful read, a later refresh failure keeps the last
successful snapshot and marks live updates as paused.
