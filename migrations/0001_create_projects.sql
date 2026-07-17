CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  framework TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 0,
  cpu INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

INSERT OR IGNORE INTO projects (id, name, framework, source, status, visits, cpu, created_at) VALUES
  ('paperplane-web', 'paperplane-web', 'Next.js 15', 'github', 'live', 12400, 42, '2026-07-16T10:00:00.000Z'),
  ('luma-api', 'luma-api', 'Node.js', 'github', 'live', 8700, 68, '2026-07-16T09:00:00.000Z'),
  ('atlas-studio', 'atlas-studio', 'Astro', 'github', 'building', 2100, 19, '2026-07-15T10:00:00.000Z');
