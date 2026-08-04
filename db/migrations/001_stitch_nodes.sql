CREATE TABLE IF NOT EXISTS stitch_nodes (
  id           TEXT        PRIMARY KEY,
  user_id      TEXT        NOT NULL,
  label        TEXT        NOT NULL,
  status       TEXT        NOT NULL,
  due_at       TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  priority     TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stitch_nodes_user
  ON stitch_nodes (user_id);

CREATE INDEX IF NOT EXISTS idx_stitch_nodes_user_status
  ON stitch_nodes (user_id, status);
