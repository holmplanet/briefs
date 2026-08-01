CREATE TABLE IF NOT EXISTS action_proposals (
  id           TEXT        PRIMARY KEY,
  user_id      TEXT        NOT NULL,
  action_type  TEXT        NOT NULL,
  summary      TEXT        NOT NULL,
  payload      JSONB       NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL,
  result       JSONB,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL,
  approved_at  TIMESTAMPTZ,
  executed_at  TIMESTAMPTZ,
  rejected_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_action_proposals_user
  ON action_proposals (user_id);

CREATE INDEX IF NOT EXISTS idx_action_proposals_status
  ON action_proposals (user_id, status);

CREATE TABLE IF NOT EXISTS action_audit_log (
  id         TEXT        PRIMARY KEY,
  action_id  TEXT        NOT NULL REFERENCES action_proposals(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL,
  event      TEXT        NOT NULL,
  detail     JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_action_audit_action
  ON action_audit_log (action_id);

CREATE INDEX IF NOT EXISTS idx_action_audit_user
  ON action_audit_log (user_id);
