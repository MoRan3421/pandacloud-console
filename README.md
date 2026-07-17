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

The Worker exposes `GET /api/health`, `GET /api/release`, `GET|POST /api/projects`, `POST /api/projects/:id/actions`, `GET /api/activity`, `GET /api/deployments`, and `POST /api/ai/blueprint`.

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

## Stripe billing

The Billing page creates Stripe-hosted Checkout Sessions for the Pro and Team subscriptions. It deliberately accepts only the two server-side configured plan IDs, never a client-supplied price.

Create recurring Stripe Prices for Pro and Team, then configure each Worker environment independently:

```bash
# Production (customer-facing)
npx wrangler secret put STRIPE_SECRET_KEY --env production
npx wrangler secret put STRIPE_PRO_PRICE_ID --env production
npx wrangler secret put STRIPE_TEAM_PRICE_ID --env production

# Development (use Stripe test-mode credentials and Price IDs)
npx wrangler secret put STRIPE_SECRET_KEY --env development
npx wrangler secret put STRIPE_PRO_PRICE_ID --env development
npx wrangler secret put STRIPE_TEAM_PRICE_ID --env development
```

Without these secrets, Checkout remains safely disabled and returns a clear configuration error. Stripe Checkout handles card collection and can display Apple Pay or Google Pay when enabled in the Stripe account. Subscription entitlement persistence should be connected to authenticated users and a database before enabling paid access controls.

## Project data

Projects and their deployment audit events are persisted in isolated Cloudflare D1 databases: `pandacloud-projects-production` for customers and `pandacloud-projects-development` for internal testing. The schema and seed projects live in `migrations/`.

Apply future migrations to both release lanes before deploying code that depends on them:

```bash
npx wrangler d1 migrations apply pandacloud-projects-production --remote --env production
npx wrangler d1 migrations apply pandacloud-projects-development --remote --env development
```
