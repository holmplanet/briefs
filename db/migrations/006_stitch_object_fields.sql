ALTER TABLE stitch_nodes
  ADD COLUMN IF NOT EXISTS object_type TEXT NOT NULL DEFAULT 'stitch',
  ADD COLUMN IF NOT EXISTS attributed_to_actor_id TEXT,
  ADD COLUMN IF NOT EXISTS context TEXT NOT NULL DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS origin_context TEXT NOT NULL DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS tags JSONB,
  ADD COLUMN IF NOT EXISTS refs JSONB,
  ADD COLUMN IF NOT EXISTS archive_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS state JSONB,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE stitch_nodes
SET published_at = created_at
WHERE published_at IS NULL;

ALTER TABLE stitch_nodes
  ALTER COLUMN published_at SET NOT NULL;

INSERT INTO actors (id, type, name, identity, created_at)
SELECT
  gen_random_uuid()::text,
  'Person',
  user_id,
  user_id,
  MIN(created_at)
FROM stitch_nodes
GROUP BY user_id
ON CONFLICT (identity) DO NOTHING;

UPDATE stitch_nodes AS s
SET attributed_to_actor_id = a.id
FROM actors AS a
WHERE s.user_id = a.identity
  AND s.attributed_to_actor_id IS NULL;

ALTER TABLE stitch_nodes
  ALTER COLUMN attributed_to_actor_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stitch_nodes_context
  ON stitch_nodes (context);

CREATE INDEX IF NOT EXISTS idx_stitch_nodes_archive_status
  ON stitch_nodes (user_id, archive_status);
