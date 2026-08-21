-- Run after the normalized schema exists. No data is deleted.
CREATE TABLE IF NOT EXISTS artifact_links (
  id STRING PRIMARY KEY, project_id STRING NOT NULL,
  source_type STRING NOT NULL, source_id STRING NOT NULL,
  target_type STRING NOT NULL, target_id STRING NOT NULL,
  created_by STRING, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id,source_type,source_id,target_type,target_id)
);
CREATE INDEX IF NOT EXISTS artifact_links_source_idx ON artifact_links(project_id,source_type,source_id);
CREATE INDEX IF NOT EXISTS artifact_links_target_idx ON artifact_links(project_id,target_type,target_id);
CREATE TABLE IF NOT EXISTS timeline_task_links (
  task_id STRING NOT NULL, object_type STRING NOT NULL, object_id STRING NOT NULL,
  created_by STRING, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(task_id,object_type,object_id)
);
CREATE INDEX IF NOT EXISTS timeline_task_links_object_idx ON timeline_task_links(object_type,object_id);
ALTER TABLE timeline_tasks ADD COLUMN IF NOT EXISTS assignee_id STRING;
ALTER TABLE timeline_tasks ADD COLUMN IF NOT EXISTS assignee_name STRING;
