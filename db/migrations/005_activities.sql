CREATE TABLE IF NOT EXISTS activities (
  id          TEXT        PRIMARY KEY,
  type        TEXT        NOT NULL,
  actor_id    TEXT        NOT NULL REFERENCES actors (id),
  object_id   TEXT        NOT NULL REFERENCES stitch_nodes (id),
  origin      TEXT,
  target      TEXT,
  summary     TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  result      JSONB,
  client_key  TEXT
);

CREATE INDEX IF NOT EXISTS idx_activities_object_occurred
  ON activities (object_id, occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_actor_client_key
  ON activities (actor_id, client_key)
  WHERE client_key IS NOT NULL;
