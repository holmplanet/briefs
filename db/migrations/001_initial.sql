CREATE TABLE IF NOT EXISTS actors (
  id         TEXT        PRIMARY KEY,
  type       TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  identity   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_actors_identity
  ON actors (identity);

CREATE TABLE IF NOT EXISTS items (
  id              TEXT        PRIMARY KEY,
  user_id         TEXT        NOT NULL,
  name            TEXT        NOT NULL,
  status          TEXT        NOT NULL,
  due_at          TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  priority        TEXT,
  description     TEXT,
  kind            TEXT        NOT NULL DEFAULT 'task',
  owner_actor_id  TEXT        NOT NULL REFERENCES actors (id),
  context         TEXT        NOT NULL DEFAULT 'core',
  origin_context  TEXT        NOT NULL DEFAULT 'core',
  tags            JSONB,
  refs            JSONB,
  lifecycle       TEXT        NOT NULL DEFAULT 'active',
  source          JSONB,
  ingested_at     TIMESTAMPTZ,
  state           JSONB,
  occurred_at     TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_user
  ON items (user_id);

CREATE INDEX IF NOT EXISTS idx_items_user_status
  ON items (user_id, status);

CREATE INDEX IF NOT EXISTS idx_items_context
  ON items (context);

CREATE INDEX IF NOT EXISTS idx_items_lifecycle
  ON items (user_id, lifecycle);

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_user_source
  ON items (user_id, (source->>'system'), (source->>'externalId'))
  WHERE source IS NOT NULL;

CREATE TABLE IF NOT EXISTS activities (
  id          TEXT        PRIMARY KEY,
  type        TEXT        NOT NULL,
  actor_id    TEXT        NOT NULL REFERENCES actors (id),
  item_id     TEXT        NOT NULL REFERENCES items (id),
  origin      TEXT,
  target      TEXT,
  summary     TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  result      JSONB,
  client_key  TEXT
);

CREATE INDEX IF NOT EXISTS idx_activities_item_occurred
  ON activities (item_id, occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_actor_client_key
  ON activities (actor_id, client_key)
  WHERE client_key IS NOT NULL;
