-- Design Studio normalized-only storage migration
-- Run AFTER the normalized tables have been created and populated.
-- This removes the legacy JSON/revision storage.

DROP TABLE IF EXISTS project_revisions;
ALTER TABLE projects DROP COLUMN IF EXISTS data;
ALTER TABLE projects DROP COLUMN IF EXISTS revision;

-- The projects table remains only for project metadata (id/name/description/owner/timestamps).
