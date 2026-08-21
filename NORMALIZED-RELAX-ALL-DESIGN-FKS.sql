-- Run after the normalized schema exists.
-- This intentionally removes cross-table foreign keys from the design workspace.
-- Primary keys, project_id values, and username uniqueness remain.

ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_module_id_fkey;
ALTER TABLE screens DROP CONSTRAINT IF EXISTS screens_module_id_fkey;
ALTER TABLE screen_components DROP CONSTRAINT IF EXISTS screen_components_screen_id_fkey;
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_module_id_fkey;
ALTER TABLE entity_fields DROP CONSTRAINT IF EXISTS entity_fields_entity_id_fkey;
ALTER TABLE relations DROP CONSTRAINT IF EXISTS relations_project_id_fkey;
ALTER TABLE relations DROP CONSTRAINT IF EXISTS relations_from_entity_fkey;
ALTER TABLE relations DROP CONSTRAINT IF EXISTS relations_to_entity_fkey;
ALTER TABLE apis DROP CONSTRAINT IF EXISTS apis_project_id_fkey;
ALTER TABLE apis DROP CONSTRAINT IF EXISTS apis_module_id_fkey;
ALTER TABLE logic_workflows DROP CONSTRAINT IF EXISTS logic_workflows_project_id_fkey;
ALTER TABLE logic_workflows DROP CONSTRAINT IF EXISTS logic_workflows_module_id_fkey;
ALTER TABLE logic_steps DROP CONSTRAINT IF EXISTS logic_steps_workflow_id_fkey;
ALTER TABLE timeline_tasks DROP CONSTRAINT IF EXISTS timeline_tasks_project_id_fkey;
ALTER TABLE timeline_tasks DROP CONSTRAINT IF EXISTS timeline_tasks_module_id_fkey;
ALTER TABLE reference_images DROP CONSTRAINT IF EXISTS reference_images_project_id_fkey;
ALTER TABLE reference_images DROP CONSTRAINT IF EXISTS reference_images_module_id_fkey;
ALTER TABLE reference_images DROP CONSTRAINT IF EXISTS reference_images_screen_id_fkey;
ALTER TABLE testing_cases DROP CONSTRAINT IF EXISTS testing_cases_project_id_fkey;
ALTER TABLE testing_cases DROP CONSTRAINT IF EXISTS testing_cases_module_id_fkey;
ALTER TABLE testing_cases DROP CONSTRAINT IF EXISTS testing_cases_requirement_id_fkey;
ALTER TABLE testing_cases DROP CONSTRAINT IF EXISTS testing_cases_screen_id_fkey;
ALTER TABLE testing_cases DROP CONSTRAINT IF EXISTS testing_cases_entity_id_fkey;
ALTER TABLE testing_cases DROP CONSTRAINT IF EXISTS testing_cases_api_id_fkey;
ALTER TABLE testing_steps DROP CONSTRAINT IF EXISTS testing_steps_test_case_id_fkey;
ALTER TABLE project_comments DROP CONSTRAINT IF EXISTS project_comments_project_id_fkey;
ALTER TABLE project_settings DROP CONSTRAINT IF EXISTS project_settings_project_id_fkey;
ALTER TABLE project_audit DROP CONSTRAINT IF EXISTS project_audit_project_id_fkey;
ALTER TABLE security_roles DROP CONSTRAINT IF EXISTS security_roles_project_id_fkey;
ALTER TABLE security_permissions DROP CONSTRAINT IF EXISTS security_permissions_project_id_fkey;
ALTER TABLE security_role_permissions DROP CONSTRAINT IF EXISTS security_role_permissions_role_id_fkey;
ALTER TABLE security_role_permissions DROP CONSTRAINT IF EXISTS security_role_permissions_permission_id_fkey;
ALTER TABLE security_module_access DROP CONSTRAINT IF EXISTS security_module_access_project_id_fkey;
ALTER TABLE security_module_access DROP CONSTRAINT IF EXISTS security_module_access_module_id_fkey;

ALTER TABLE modules ALTER COLUMN name DROP NOT NULL;
ALTER TABLE requirements ALTER COLUMN title DROP NOT NULL;
ALTER TABLE screens ALTER COLUMN name DROP NOT NULL;
ALTER TABLE entities ALTER COLUMN name DROP NOT NULL;
ALTER TABLE apis ALTER COLUMN name DROP NOT NULL;
ALTER TABLE logic_workflows ALTER COLUMN name DROP NOT NULL;
ALTER TABLE logic_steps ALTER COLUMN step_text DROP NOT NULL;
ALTER TABLE timeline_tasks ALTER COLUMN name DROP NOT NULL;
ALTER TABLE testing_cases ALTER COLUMN name DROP NOT NULL;
ALTER TABLE testing_steps ALTER COLUMN action DROP NOT NULL;
ALTER TABLE relations ALTER COLUMN from_entity DROP NOT NULL;
ALTER TABLE relations ALTER COLUMN to_entity DROP NOT NULL;

SELECT 'all design-workspace foreign keys relaxed' AS status;
