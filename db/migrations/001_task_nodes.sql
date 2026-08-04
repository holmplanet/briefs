CREATE TABLE IF NOT EXISTS task_nodes (
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

CREATE INDEX IF NOT EXISTS idx_task_nodes_user
  ON task_nodes (user_id);

CREATE INDEX IF NOT EXISTS idx_task_nodes_user_status
  ON task_nodes (user_id, status);
