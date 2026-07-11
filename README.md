# teti-site

Official MVP homepage for [teti.bot](https://teti.bot): an open AI companion
network explorer.

The first version is intentionally small:

- explain what Teti is
- list current Teti identities
- show basic status and capabilities
- request a connection through `teti://connect`
- guide users to Teti Desktop when the handoff does not open

It does not include login, chat, feeds, profiles, CMS, or a dashboard shell.

## Stack

- React + Vite + TypeScript
- Astryx design system packages
- Cloudflare Pages for the static frontend
- Cloudflare Worker + KV for the registry API

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The frontend build output is written to `dist`.

## Worker Development

Run the local Worker API:

```bash
npm run worker:dev
```

API routes:

- `GET /api/tetis`
- `GET /api/tetis/:id`
- `POST /api/tetis/:id/connect`
- `GET /api/desktop`

## Cloudflare Pages Deployment

Connect the GitHub repository to Cloudflare Pages:

- Repository: `midimily/teti-site`
- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node.js version: use the Cloudflare default or any current LTS version

Cloudflare Pages should run `npm install` automatically before the build. Do not
commit `node_modules`, `dist`, `.env`, or local machine files.

## Cloudflare Worker + KV

The static MVP can deploy on Pages by itself. The Worker in `worker/index.ts`
keeps the future API boundary clear for the Teti registry.

KV binding:

- Binding name: `TETI_REGISTRY`

KV keys:

- `teti:list` - JSON array of registry records
- `desktop:latest` - future desktop release metadata
