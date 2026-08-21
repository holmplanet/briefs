CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id     TEXT PRIMARY KEY,
  redirect_uris TEXT[] NOT NULL,
  client_name   TEXT,
  created_at    TIMESTAMPTZ NOT NULL
);
