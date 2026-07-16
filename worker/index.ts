interface Env {
  ASSETS: Fetcher;
}

const projects = [
  { id: "paperplane-web", name: "paperplane-web", framework: "Next.js 15", status: "live", visits: 12400, cpu: 42 },
  { id: "luma-api", name: "luma-api", framework: "Node.js", status: "live", visits: 8700, cpu: 68 },
  { id: "atlas-studio", name: "atlas-studio", framework: "Astro", status: "building", visits: 2100, cpu: 19 },
];

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
      return json({ status: "healthy", service: "pandacloud-edge", timestamp: new Date().toISOString() }, 200, request);
    }

    if (url.pathname === "/api/projects" && request.method === "GET") {
      return json({ projects, total: projects.length }, 200, request);
    }

    if (url.pathname === "/api/projects" && request.method === "POST") {
      const payload = await request.json<{ name?: string; source?: string }>().catch(() => ({} as { name?: string; source?: string }));
      if (!payload.name?.trim()) return json({ error: "A project name is required." }, 400, request);
      return json({
        project: {
          id: crypto.randomUUID(), name: payload.name.trim(), source: payload.source ?? "github",
          status: "provisioning", createdAt: new Date().toISOString(),
        },
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
