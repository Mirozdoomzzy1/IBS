-- Optional cleanup for the old revision-snapshot table.
-- The current application no longer writes project_revisions.
-- Run this ONLY if you no longer need the old revision snapshots.
DROP TABLE IF EXISTS project_revisions;
