CREATE TABLE IF NOT EXISTS oauth_tokens (
  user_id       TEXT        NOT NULL,
  provider      TEXT        NOT NULL,
  access_token  TEXT        NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  scopes        TEXT[]      NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider
  ON oauth_tokens (provider);
