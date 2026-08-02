CREATE TABLE IF NOT EXISTS mcp_api_tokens (
  id           TEXT        PRIMARY KEY,
  user_id      TEXT        NOT NULL,
  token_hash   TEXT        NOT NULL UNIQUE,
  label        TEXT,
  created_at   TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mcp_api_tokens_user
  ON mcp_api_tokens (user_id);
