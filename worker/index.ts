interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  APP_ENV: "development" | "production";
  AUDIENCE: "internal" | "customer";
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_TEAM_PRICE_ID?: string;
}

const projects = [
  { id: "paperplane-web", name: "paperplane-web", framework: "Next.js 15", status: "live", visits: 12400, cpu: 42 },
  { id: "luma-api", name: "luma-api", framework: "Node.js", status: "live", visits: 8700, cpu: 68 },
  { id: "atlas-studio", name: "atlas-studio", framework: "Astro", status: "building", visits: 2100, cpu: 19 },
];

type ProjectRecord = {
  id: string;
  name: string;
  framework: string;
  source: string;
  status: string;
  visits: number;
  cpu: number;
  created_at: string;
};

const frameworkForSource = (source?: string) => {
  if (source === "Docker image") return "Docker";
  if (source === "GitLab") return "GitLab";
  if (source === "Start with a template") return "Panda template";
  return "Next.js 15";
};

const json = (body: unknown, status = 200, request?: Request) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=UTF-8",
    "cache-control": "no-store",
    ...(request ? cors(request) : {}),
  },
});

const cors = (request: Request) => ({
  "access-control-allow-origin": request.headers.get("origin") ?? "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "vary": "origin",
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    if (url.pathname === "/api/health") {
      return json({ status: "healthy", service: "pandacloud-edge", environment: env.APP_ENV, audience: env.AUDIENCE, timestamp: new Date().toISOString() }, 200, request);
    }

    if (url.pathname === "/api/release") return json({ environment: env.APP_ENV, audience: env.AUDIENCE, customerSafe: env.APP_ENV === "production" }, 200, request);

    if (url.pathname === "/api/billing" && request.method === "GET") {
      return json({
        currentPlan: "hobby",
        plans: [
          { id: "hobby", name: "Hobby", price: 0, currency: "USD", interval: "month" },
          { id: "pro", name: "Pro", price: 12, currency: "USD", interval: "month" },
          { id: "team", name: "Team", price: 39, currency: "USD", interval: "month" },
        ],
        checkoutConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRO_PRICE_ID && env.STRIPE_TEAM_PRICE_ID),
      }, 200, request);
    }

    if (url.pathname === "/api/billing/checkout" && request.method === "POST") {
      const payload = await request.json<{ plan?: "pro" | "team" }>().catch(() => ({} as { plan?: "pro" | "team" }));
      const priceId = payload.plan === "pro" ? env.STRIPE_PRO_PRICE_ID : payload.plan === "team" ? env.STRIPE_TEAM_PRICE_ID : undefined;
      if (!payload.plan || !priceId || !env.STRIPE_SECRET_KEY) {
        return json({ error: "Billing is not configured yet. Add Stripe secrets before accepting customer payments.", code: "BILLING_NOT_CONFIGURED" }, 503, request);
      }

      const checkout = new URLSearchParams({
        mode: "subscription",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        success_url: `${url.origin}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${url.origin}/?billing=cancelled`,
        allow_promotion_codes: "true",
        "metadata[plan]": payload.plan,
        "metadata[environment]": env.APP_ENV,
      });
      const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: checkout.toString(),
      });
      const stripeData = await stripeResponse.json<{ url?: string; error?: { message?: string } }>();
      if (!stripeResponse.ok || !stripeData.url) return json({ error: stripeData.error?.message ?? "Stripe could not create a Checkout session.", code: "CHECKOUT_FAILED" }, 502, request);
      return json({ url: stripeData.url }, 200, request);
    }

    if (url.pathname === "/api/projects" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, name, framework, source, status, visits, cpu, created_at FROM projects ORDER BY created_at DESC LIMIT 100").all<ProjectRecord>();
      return json({ projects: results, total: results.length }, 200, request);
    }

    if (url.pathname === "/api/projects" && request.method === "POST") {
      const payload = await request.json<{ name?: string; source?: string }>().catch(() => ({} as { name?: string; source?: string }));
      if (!payload.name?.trim()) return json({ error: "A project name is required." }, 400, request);
      const project = {
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        source: payload.source ?? "GitHub",
        framework: frameworkForSource(payload.source),
        status: "provisioning",
        visits: 0,
        cpu: 0,
        createdAt: new Date().toISOString(),
      };
      await env.DB.prepare("INSERT INTO projects (id, name, framework, source, status, visits, cpu, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(project.id, project.name, project.framework, project.source, project.status, project.visits, project.cpu, project.createdAt)
        .run();
      return json({
        project,
      }, 201, request);
    }

    if (url.pathname === "/api/deployments") {
      return json({ deployments: projects.map((project, index) => ({ project: project.id, status: project.status, deployedAt: `${index + 2} minutes ago`, region: "FRA" })) }, 200, request);
    }

    if (url.pathname === "/api/ai/blueprint" && request.method === "POST") {
      const payload = await request.json<{ prompt?: string }>().catch(() => ({} as { prompt?: string }));
      if (!payload.prompt?.trim()) return json({ error: "Tell Panda AI what you want to build." }, 400, request);
      return json({
        blueprint: {
          project: "panda-ai-project", runtime: "Node.js 22", database: "Managed PostgreSQL",
          deployment: "GitHub auto-deploy", prompt: payload.prompt.trim(),
        },
      }, 200, request);
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "Not found", path: url.pathname }, 404, request);

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
