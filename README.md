# PandaCloud Console

PandaCloud is a static Next.js control plane with a Cloudflare Worker edge API.

## Local development

```bash
npm install
npm run dev
```

For a local production-like Worker that serves the static frontend and API together:

```bash
npm run worker:dev
```

The Worker will expose `GET /api/health`, `GET|POST /api/projects`, `GET /api/deployments`, and `POST /api/ai/blueprint`.

## Deploy

```bash
npm run worker:deploy
```

The deploy script builds the static `out/` directory, then uploads it together with `worker/index.ts`. Authenticate with Cloudflare through Wrangler before the first deployment.
