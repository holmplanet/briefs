CREATE TABLE IF NOT EXISTS brief_tasks (
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

CREATE INDEX IF NOT EXISTS idx_brief_tasks_user
  ON brief_tasks (user_id);

CREATE INDEX IF NOT EXISTS idx_brief_tasks_user_status
  ON brief_tasks (user_id, status);
