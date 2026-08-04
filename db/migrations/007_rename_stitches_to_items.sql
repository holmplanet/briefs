ALTER TABLE stitch_nodes RENAME TO items;

ALTER INDEX IF EXISTS idx_stitch_nodes_user RENAME TO idx_items_user;
ALTER INDEX IF EXISTS idx_stitch_nodes_user_status RENAME TO idx_items_user_status;
ALTER INDEX IF EXISTS idx_stitch_nodes_context RENAME TO idx_items_context;
ALTER INDEX IF EXISTS idx_stitch_nodes_archive_status RENAME TO idx_items_archive_status;

UPDATE items SET object_type = 'item' WHERE object_type = 'stitch';
ALTER TABLE items ALTER COLUMN object_type SET DEFAULT 'item';
