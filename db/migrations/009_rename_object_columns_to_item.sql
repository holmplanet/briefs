ALTER TABLE activities RENAME COLUMN object_id TO item_id;

ALTER INDEX IF EXISTS idx_activities_object_occurred
  RENAME TO idx_activities_item_occurred;

ALTER TABLE items RENAME COLUMN object_type TO item_type;
