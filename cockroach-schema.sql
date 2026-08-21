-- Enterprise System Design Studio / CockroachDB
-- Shared cloud persistence. No Supabase dependencies.

create table if not exists projects (
  id string primary key,
  revision int8 not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by string
);

create table if not exists project_revisions (
  project_id string not null references projects(id) on delete cascade,
  revision int8 not null,
  data jsonb not null,
  saved_by string,
  saved_at timestamptz not null default now(),
  primary key(project_id,revision)
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
