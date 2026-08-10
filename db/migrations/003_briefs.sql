CREATE TABLE IF NOT EXISTS briefs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  kind        TEXT NOT NULL,
  headline    TEXT NOT NULL,
  summary     TEXT NOT NULL,
  item_ids    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_briefs_user_created
  ON briefs (user_id, created_at DESC);
