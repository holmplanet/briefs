CREATE TABLE IF NOT EXISTS oauth_otp_challenges (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  code_hash     TEXT NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_otp_email_created
  ON oauth_otp_challenges (email, created_at DESC);

CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  code_hash       TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL,
  redirect_uri    TEXT NOT NULL,
  code_challenge  TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  email           TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires
  ON oauth_authorization_codes (expires_at);
