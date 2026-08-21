-- Run this once on the existing CockroachDB database before deploying the normalized build.
-- It makes the old JSON column nullable and removes revision snapshots.
-- The new application will automatically migrate the existing JSON into normalized tables on first load.

ALTER TABLE projects ALTER COLUMN data DROP NOT NULL;
DROP TABLE IF EXISTS project_revisions;

-- AFTER the normalized application loads successfully and you verify the tables, remove legacy storage:
-- ALTER TABLE projects DROP COLUMN IF EXISTS data;
-- ALTER TABLE projects DROP COLUMN IF EXISTS revision;
