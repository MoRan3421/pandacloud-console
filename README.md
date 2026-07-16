# PandaCloud Console

PandaCloud is a static Next.js control plane with a Cloudflare Worker edge API.

## Local development

```bash
npm install
npm run dev
```

For local development, which uses the isolated internal Worker environment:

```bash
npm run worker:dev
```

The Worker exposes `GET /api/health`, `GET /api/release`, `GET|POST /api/projects`, `GET /api/deployments`, and `POST /api/ai/blueprint`.

## Release environments

| Environment | Audience | Worker | Command |
| --- | --- | --- | --- |
| Production | Customers | `young-queen-08f8` | `npm run worker:deploy` |
| Development | Internal team | `young-queen-08f8-development` | `npm run worker:deploy:development` |

Production is the customer-facing release. Development is a separate Worker and asset collection, so development testing cannot overwrite the customer site. Check the current lane with `GET /api/release`.

## Deploy

```bash
npm run worker:deploy
```

For an internal development release, use `npm run worker:deploy:development`. Both deploy scripts build the static `out/` directory, then upload it together with `worker/index.ts`. Authenticate with Cloudflare through Wrangler before the first deployment.
