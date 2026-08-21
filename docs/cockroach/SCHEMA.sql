-- Enterprise System Design Studio / CockroachDB
-- Shared cloud persistence. No Supabase dependencies.

create table if not exists projects (
  id string primary key,
  revision int8 not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by string
);

create table if not exists app_users (
  id string primary key,
  username string not null unique,
  display_name string,
  role string not null default 'Viewer',
  active bool not null default true,
  password_hash string not null
);

create table if not exists project_audit (
  id int8 primary key default unique_rowid(),
  project_id string not null references projects(id) on delete cascade,
  actor_name string,
  action string not null,
  object_type string,
  object_id string,
  module_id string,
  changed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);

create index if not exists project_audit_project_idx on project_audit(project_id,changed_at desc);

-- Optional normalized indexes for future reporting. The authoritative project document
-- remains in projects.data so every feature saves atomically in one transaction.


-- Traceability links: explicit artifact-to-artifact relationships.
CREATE TABLE IF NOT EXISTS artifact_links (
  id STRING PRIMARY KEY, project_id STRING NOT NULL,
  source_type STRING NOT NULL, source_id STRING NOT NULL,
  target_type STRING NOT NULL, target_id STRING NOT NULL,
  created_by STRING, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id,source_type,source_id,target_type,target_id)
);
CREATE INDEX IF NOT EXISTS artifact_links_source_idx ON artifact_links(project_id,source_type,source_id);
CREATE INDEX IF NOT EXISTS artifact_links_target_idx ON artifact_links(project_id,target_type,target_id);

-- Tasks can point to one or more connected design artifacts.
CREATE TABLE IF NOT EXISTS timeline_task_links (
  task_id STRING NOT NULL, object_type STRING NOT NULL, object_id STRING NOT NULL,
  created_by STRING, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(task_id,object_type,object_id)
);
CREATE INDEX IF NOT EXISTS timeline_task_links_object_idx ON timeline_task_links(object_type,object_id);
