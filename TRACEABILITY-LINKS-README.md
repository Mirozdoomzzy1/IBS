# Traceability, task assignment and attributed comments

This build adds explicit normalized links without using project JSON or revision snapshots.

## New tables
- `artifact_links`: requirement ↔ screen/backend/API/testing/ERD relationships.
- `timeline_task_links`: tasks/timeline items ↔ connected design artifacts.

## Timeline/task assignment
`timeline_tasks.assignee_id` and `timeline_tasks.assignee_name` store the assigned application user.

## Comments
Attributed comments are stored in `project_comments` with `author_name` from the authenticated user. Existing free-text `comments` columns remain as design notes; new comments are separate records.

## Migration
Run `COCKROACH-TRACEABILITY-LINKS-AND-ASSIGNEES.sql` once in CockroachDB before using the new link/task features.
