CREATE TABLE IF NOT EXISTS actors (
  id         TEXT        PRIMARY KEY,
  type       TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  identity   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_actors_identity
  ON actors (identity);
