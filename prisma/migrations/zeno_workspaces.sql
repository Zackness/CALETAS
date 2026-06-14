-- Zeno Notes: workspaces sincronizados (usuarios CALETAS o dispositivos anonimos device:*)
CREATE TABLE IF NOT EXISTS zeno_workspaces (
  owner_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zeno_workspaces_updated_at_idx ON zeno_workspaces (updated_at DESC);
