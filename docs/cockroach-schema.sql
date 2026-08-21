-- Design Studio / CockroachDB normalized schema
-- NO project JSON document and NO revision snapshot table.

CREATE TABLE IF NOT EXISTS projects (
  id STRING PRIMARY KEY,
  name STRING NOT NULL,
  description STRING,
  owner STRING,
  -- Legacy compatibility only; the application never writes project data here.
  data JSONB NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by STRING
);

CREATE TABLE IF NOT EXISTS app_users (
  id STRING PRIMARY KEY,
  username STRING NOT NULL UNIQUE,
  display_name STRING,
  role STRING NOT NULL DEFAULT 'Viewer',
  active BOOL NOT NULL DEFAULT true,
  password_hash STRING NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name STRING NOT NULL,
  icon STRING,
  color STRING,
  description STRING,
  comments STRING
);

CREATE TABLE IF NOT EXISTS requirements (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  title STRING NOT NULL,
  actor STRING,
  priority STRING,
  status STRING,
  description STRING,
  rule STRING,
  acceptance STRING,
  comments STRING
);

CREATE TABLE IF NOT EXISTS screens (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  name STRING NOT NULL,
  type STRING,
  status STRING,
  description STRING,
  oracle_form STRING,
  oracle_description STRING,
  comments STRING,
  saved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS screen_components (
  id STRING PRIMARY KEY,
  screen_id STRING NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  component_order INT8 NOT NULL DEFAULT 0,
  type STRING,
  label STRING,
  data_type STRING,
  required BOOL NOT NULL DEFAULT false,
  read_only BOOL NOT NULL DEFAULT false,
  entity STRING,
  field STRING,
  entity_field STRING,
  api_field STRING,
  source_type STRING,
  db_schema STRING,
  db_table STRING,
  db_column STRING,
  calculation_rule STRING,
  validation_rule STRING,
  helper_text STRING,
  placeholder STRING,
  default_value STRING,
  visibility STRING,
  width STRING,
  min_length INT8,
  max_length INT8,
  comments STRING,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS entities (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  name STRING NOT NULL,
  x FLOAT8 NOT NULL DEFAULT 40,
  y FLOAT8 NOT NULL DEFAULT 40,
  comments STRING
);

CREATE TABLE IF NOT EXISTS entity_fields (
  id STRING PRIMARY KEY,
  entity_id STRING NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  field_order INT8 NOT NULL DEFAULT 0,
  name STRING NOT NULL,
  type STRING,
  pk BOOL NOT NULL DEFAULT false,
  fk BOOL NOT NULL DEFAULT false,
  unique_flag BOOL NOT NULL DEFAULT false,
  nullable BOOL NOT NULL DEFAULT true,
  comments STRING
);

CREATE TABLE IF NOT EXISTS relations (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_entity STRING NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_entity STRING NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  from_field STRING,
  to_field STRING,
  cardinality STRING,
  comments STRING
);

CREATE TABLE IF NOT EXISTS apis (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  method STRING,
  path STRING,
  name STRING NOT NULL,
  permission STRING,
  status STRING,
  description STRING,
  inputs STRING,
  rules STRING,
  logic STRING,
  comments STRING
);

CREATE TABLE IF NOT EXISTS logic_workflows (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  name STRING NOT NULL,
  trigger STRING,
  comments STRING
);

CREATE TABLE IF NOT EXISTS logic_steps (
  id STRING PRIMARY KEY,
  workflow_id STRING NOT NULL REFERENCES logic_workflows(id) ON DELETE CASCADE,
  step_order INT8 NOT NULL DEFAULT 0,
  step_text STRING NOT NULL,
  comments STRING
);

CREATE TABLE IF NOT EXISTS timeline_tasks (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  name STRING NOT NULL,
  layer STRING,
  phase STRING,
  start_date DATE,
  end_date DATE,
  status STRING,
  priority STRING,
  owner STRING,
  dependencies STRING,
  short_text STRING,
  comments STRING
);

CREATE TABLE IF NOT EXISTS reference_images (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  screen_id STRING REFERENCES screens(id) ON DELETE SET NULL,
  type STRING,
  title STRING,
  notes STRING,
  data_url STRING,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testing_cases (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING REFERENCES modules(id) ON DELETE SET NULL,
  requirement_id STRING REFERENCES requirements(id) ON DELETE SET NULL,
  screen_id STRING REFERENCES screens(id) ON DELETE SET NULL,
  entity_id STRING REFERENCES entities(id) ON DELETE SET NULL,
  api_id STRING REFERENCES apis(id) ON DELETE SET NULL,
  name STRING NOT NULL,
  test_type STRING,
  priority STRING,
  status STRING,
  preconditions STRING,
  expected_result STRING,
  actual_result STRING,
  execution_notes STRING,
  comments STRING
);

CREATE TABLE IF NOT EXISTS testing_steps (
  id STRING PRIMARY KEY,
  test_case_id STRING NOT NULL REFERENCES testing_cases(id) ON DELETE CASCADE,
  step_order INT8 NOT NULL DEFAULT 0,
  action STRING NOT NULL,
  expected_result STRING,
  actual_result STRING,
  status STRING NOT NULL DEFAULT 'Not Run',
  comments STRING
);

CREATE TABLE IF NOT EXISTS project_comments (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  object_type STRING NOT NULL,
  object_id STRING,
  author_name STRING,
  comment_text STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_settings (
  project_id STRING PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  autosave BOOL NOT NULL DEFAULT true,
  grid_size INT8 NOT NULL DEFAULT 24,
  show_hints BOOL NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS requirements_module_idx ON requirements(project_id,module_id);
CREATE INDEX IF NOT EXISTS screens_module_idx ON screens(project_id,module_id);
CREATE INDEX IF NOT EXISTS entities_module_idx ON entities(project_id,module_id);
CREATE INDEX IF NOT EXISTS apis_module_idx ON apis(project_id,module_id);
CREATE INDEX IF NOT EXISTS logic_module_idx ON logic_workflows(project_id,module_id);
CREATE INDEX IF NOT EXISTS tests_module_idx ON testing_cases(project_id,module_id);
CREATE INDEX IF NOT EXISTS comments_object_idx ON project_comments(project_id,object_type,object_id);

CREATE TABLE IF NOT EXISTS project_audit (
  id INT8 PRIMARY KEY DEFAULT unique_rowid(),
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_name STRING,
  action STRING NOT NULL,
  object_type STRING,
  object_id STRING,
  module_id STRING,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS project_audit_project_idx ON project_audit(project_id,changed_at DESC);

CREATE TABLE IF NOT EXISTS security_roles (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name STRING NOT NULL,
  description STRING
);
CREATE TABLE IF NOT EXISTS security_permissions (
  id STRING PRIMARY KEY,
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code STRING NOT NULL
);
CREATE TABLE IF NOT EXISTS security_role_permissions (
  role_id STRING NOT NULL REFERENCES security_roles(id) ON DELETE CASCADE,
  permission_id STRING NOT NULL REFERENCES security_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id,permission_id)
);
CREATE TABLE IF NOT EXISTS security_module_access (
  project_id STRING NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id STRING NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  role_id STRING NOT NULL,
  allowed BOOL NOT NULL DEFAULT true,
  PRIMARY KEY(project_id,module_id,role_id)
);
