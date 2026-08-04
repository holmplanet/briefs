CREATE TABLE IF NOT EXISTS briefs (
  id                  TEXT        PRIMARY KEY,
  user_id             TEXT        NOT NULL,
  kind                TEXT        NOT NULL,
  generated_at        TIMESTAMPTZ NOT NULL,
  greeting            TEXT,
  headline            TEXT,
  bullets             JSONB       NOT NULL DEFAULT '[]',
  related_stitch_ids  TEXT[]      NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_briefs_user
  ON briefs (user_id);

CREATE INDEX IF NOT EXISTS idx_briefs_user_generated
  ON briefs (user_id, generated_at DESC);
