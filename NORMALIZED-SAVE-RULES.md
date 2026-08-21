# Normalized save rules

The Design Studio does not use `projects.data` or revision snapshots.

Each phase saves only to its own normalized tables. Cross-table foreign-key constraints are intentionally removed so users can build artifacts in any order (for example, create a screen before its linked module/entity, or draw an ERD relation before both endpoints are fully configured).

Primary keys remain required. `project_id` remains required where it identifies the workspace. The application still supplies IDs and project IDs on every write.

Run `NORMALIZED-RELAX-CONSTRAINTS.sql` after the normalized schema has been created.
