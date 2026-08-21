-- Upgrade an existing Design Studio CockroachDB installation to the normalized schema.
-- Safe to run before deploying the normalized application.

-- 1) Ensure the project metadata table has the columns required by the normalized API.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name STRING;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description STRING;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner STRING;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_by STRING;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2) Populate metadata for any existing rows before making name required.
UPDATE projects
SET name = COALESCE(NULLIF(name, ''), id),
    updated_at = COALESCE(updated_at, now())
WHERE name IS NULL OR name = '' OR updated_at IS NULL;

ALTER TABLE projects ALTER COLUMN name SET NOT NULL;
ALTER TABLE projects ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE projects ALTER COLUMN updated_at SET NOT NULL;

-- 3) Revision/JSON storage is not used by the new application.
-- Drop revision snapshots immediately.
DROP TABLE IF EXISTS project_revisions;

-- Keep legacy JSON temporarily until you verify the normalized tables.
-- After verification, run:
-- ALTER TABLE projects DROP COLUMN IF EXISTS data;
-- ALTER TABLE projects DROP COLUMN IF EXISTS revision;

-- 4) Ensure normalized tables exist. Run cockroach-schema.sql as well if needed.
