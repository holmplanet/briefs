-- Better Auth core, JWT, and OAuth provider persistence.
-- Keep this migration idempotent because the existing bootstrap runner applies
-- every migration file on startup.

CREATE TABLE IF NOT EXISTS "user" (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL,
  image          TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session (
  id          TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId"    TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id                       TEXT PRIMARY KEY,
  issuer                   TEXT NOT NULL,
  "accountId"             TEXT NOT NULL,
  "providerId"            TEXT NOT NULL,
  "userId"                TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  "accessToken"           TEXT,
  "refreshToken"          TEXT,
  "idToken"               TEXT,
  "accessTokenExpiresAt"  TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope                    TEXT,
  password                 TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jwks (
  id          TEXT PRIMARY KEY,
  "publicKey" TEXT NOT NULL,
  "privateKey" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "expiresAt" TIMESTAMPTZ,
  alg         TEXT,
  crv         TEXT
);

CREATE TABLE IF NOT EXISTS "oauthClient" (
  id                              TEXT PRIMARY KEY,
  "clientId"                     TEXT NOT NULL UNIQUE,
  "clientSecret"                 TEXT,
  "clientDiscoveryId"            TEXT,
  disabled                        BOOLEAN,
  "skipConsent"                  BOOLEAN,
  "enableEndSession"             BOOLEAN,
  "subjectType"                  TEXT,
  scopes                          JSONB,
  "clientCredentialsScopes"      JSONB,
  "userId"                       TEXT REFERENCES "user" (id) ON DELETE CASCADE,
  "createdAt"                    TIMESTAMPTZ,
  "updatedAt"                    TIMESTAMPTZ,
  name                            TEXT,
  uri                             TEXT,
  icon                            TEXT,
  contacts                        JSONB,
  tos                             TEXT,
  policy                          TEXT,
  "softwareId"                   TEXT,
  "softwareVersion"              TEXT,
  "softwareStatement"            TEXT,
  "redirectUris"                 JSONB NOT NULL,
  "postLogoutRedirectUris"       JSONB,
  "backchannelLogoutUri"         TEXT,
  "backchannelLogoutSessionRequired" BOOLEAN,
  "tokenEndpointAuthMethod"      TEXT,
  "applicationType"              TEXT,
  jwks                            TEXT,
  "jwksUri"                      TEXT,
  "grantTypes"                   JSONB,
  "responseTypes"                JSONB,
  "requirePKCE"                  BOOLEAN,
  "dpopBoundAccessTokens"        BOOLEAN DEFAULT FALSE,
  "referenceId"                  TEXT,
  metadata                        JSONB
);

CREATE TABLE IF NOT EXISTS "oauthResource" (
  id                              TEXT PRIMARY KEY,
  identifier                      TEXT NOT NULL UNIQUE,
  name                            TEXT NOT NULL,
  "accessTokenTtl"               INTEGER,
  "refreshTokenTtl"              INTEGER,
  "signingAlgorithm"             TEXT,
  "signingKeyId"                 TEXT,
  "allowedScopes"                JSONB,
  "customClaims"                 JSONB,
  "dpopBoundAccessTokensRequired" BOOLEAN,
  disabled                        BOOLEAN DEFAULT FALSE,
  "createdAt"                    TIMESTAMPTZ,
  "updatedAt"                    TIMESTAMPTZ,
  "policyVersion"                INTEGER DEFAULT 1,
  metadata                        JSONB
);

CREATE TABLE IF NOT EXISTS "oauthClientResource" (
  id          TEXT PRIMARY KEY,
  "clientId"  TEXT NOT NULL REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE,
  "resourceId" TEXT NOT NULL REFERENCES "oauthResource" (identifier) ON DELETE CASCADE,
  metadata    JSONB,
  "createdAt" TIMESTAMPTZ,
  UNIQUE ("clientId", "resourceId")
);

CREATE TABLE IF NOT EXISTS "oauthRefreshToken" (
  id                         TEXT PRIMARY KEY,
  token                      TEXT NOT NULL UNIQUE,
  "clientId"                TEXT NOT NULL REFERENCES "oauthClient" ("clientId"),
  "sessionId"               TEXT REFERENCES session (id) ON DELETE SET NULL,
  "userId"                  TEXT NOT NULL REFERENCES "user" (id),
  "referenceId"             TEXT,
  "authorizationCodeId"     TEXT,
  resources                 JSONB,
  "requestedUserInfoClaims" JSONB,
  "expiresAt"               TIMESTAMPTZ NOT NULL,
  "createdAt"               TIMESTAMPTZ NOT NULL,
  revoked                    TIMESTAMPTZ,
  "rotatedAt"               TIMESTAMPTZ,
  "rotationReplayResponse"  TEXT,
  "rotationReplayExpiresAt" TIMESTAMPTZ,
  "authTime"                TIMESTAMPTZ,
  confirmation               JSONB,
  scopes                     JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS "oauthAccessToken" (
  id                         TEXT PRIMARY KEY,
  token                      TEXT NOT NULL UNIQUE,
  "clientId"                TEXT NOT NULL REFERENCES "oauthClient" ("clientId") ON DELETE CASCADE,
  "sessionId"               TEXT REFERENCES session (id) ON DELETE SET NULL,
  "userId"                  TEXT REFERENCES "user" (id) ON DELETE CASCADE,
  "referenceId"             TEXT,
  "authorizationCodeId"     TEXT,
  resources                 JSONB,
  "requestedUserInfoClaims" JSONB,
  "refreshId"               TEXT REFERENCES "oauthRefreshToken" (id) ON DELETE CASCADE,
  "expiresAt"               TIMESTAMPTZ NOT NULL,
  "createdAt"               TIMESTAMPTZ NOT NULL,
  revoked                    TIMESTAMPTZ,
  confirmation               JSONB,
  scopes                     JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS "oauthConsent" (
  id                         TEXT PRIMARY KEY,
  "clientId"                TEXT NOT NULL REFERENCES "oauthClient" ("clientId"),
  "userId"                  TEXT REFERENCES "user" (id) ON DELETE CASCADE,
  "referenceId"             TEXT,
  resources                 JSONB,
  "requestedUserInfoClaims" JSONB,
  scopes                     JSONB NOT NULL,
  "createdAt"               TIMESTAMPTZ NOT NULL,
  "updatedAt"               TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "oauthClientAssertion" (
  id          TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS session_user_id_idx ON session ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS account_issuer_account_id_uidx ON account (issuer, "accountId");
CREATE INDEX IF NOT EXISTS account_user_id_idx ON account ("userId");
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification (identifier);
CREATE INDEX IF NOT EXISTS oauth_client_user_id_idx ON "oauthClient" ("userId");
CREATE INDEX IF NOT EXISTS oauth_client_resource_client_id_idx ON "oauthClientResource" ("clientId");
CREATE INDEX IF NOT EXISTS oauth_client_resource_resource_id_idx ON "oauthClientResource" ("resourceId");
CREATE INDEX IF NOT EXISTS oauth_refresh_token_client_id_idx ON "oauthRefreshToken" ("clientId");
CREATE INDEX IF NOT EXISTS oauth_refresh_token_session_id_idx ON "oauthRefreshToken" ("sessionId");
CREATE INDEX IF NOT EXISTS oauth_refresh_token_user_id_idx ON "oauthRefreshToken" ("userId");
CREATE INDEX IF NOT EXISTS oauth_refresh_token_authorization_code_id_idx ON "oauthRefreshToken" ("authorizationCodeId");
CREATE INDEX IF NOT EXISTS oauth_access_token_client_id_idx ON "oauthAccessToken" ("clientId");
CREATE INDEX IF NOT EXISTS oauth_access_token_session_id_idx ON "oauthAccessToken" ("sessionId");
CREATE INDEX IF NOT EXISTS oauth_access_token_user_id_idx ON "oauthAccessToken" ("userId");
CREATE INDEX IF NOT EXISTS oauth_access_token_refresh_id_idx ON "oauthAccessToken" ("refreshId");
CREATE INDEX IF NOT EXISTS oauth_access_token_authorization_code_id_idx ON "oauthAccessToken" ("authorizationCodeId");
CREATE INDEX IF NOT EXISTS oauth_consent_client_id_idx ON "oauthConsent" ("clientId");
CREATE INDEX IF NOT EXISTS oauth_consent_user_id_idx ON "oauthConsent" ("userId");
