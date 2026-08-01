CREATE TABLE IF NOT EXISTS graph_nodes (
  id         UUID        PRIMARY KEY,
  user_id    TEXT        NOT NULL,
  kind       TEXT        NOT NULL,
  label      TEXT        NOT NULL,
  data       JSONB       NOT NULL DEFAULT '{}',
  starts_at  TIMESTAMPTZ,
  ends_at    TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_user_id
  ON graph_nodes (user_id);

CREATE TABLE IF NOT EXISTS graph_edges (
  id         UUID        PRIMARY KEY,
  user_id    TEXT        NOT NULL,
  kind       TEXT        NOT NULL,
  source_id  UUID        NOT NULL REFERENCES graph_nodes (id) ON DELETE CASCADE,
  target_id  UUID        NOT NULL REFERENCES graph_nodes (id) ON DELETE CASCADE,
  data       JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT graph_edges_user_endpoints_unique
    UNIQUE (user_id, source_id, target_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_user_id
  ON graph_edges (user_id);
