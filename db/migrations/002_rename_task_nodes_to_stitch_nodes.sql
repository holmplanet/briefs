-- Rename early hard-reset table if present (safe no-op on fresh installs)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'task_nodes'
  ) THEN
    ALTER TABLE task_nodes RENAME TO stitch_nodes;
    ALTER INDEX IF EXISTS idx_task_nodes_user RENAME TO idx_stitch_nodes_user;
    ALTER INDEX IF EXISTS idx_task_nodes_user_status RENAME TO idx_stitch_nodes_user_status;
  END IF;
END $$;
