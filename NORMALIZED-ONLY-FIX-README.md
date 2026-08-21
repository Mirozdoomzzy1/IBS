# Normalized-only fix

This build fixes the startup error in `api/project.js` (the project query was missing `FROM projects`) and correctly loads settings, roles, permissions, module access, and users.

It does not read or write `projects.data`, and it does not use `project_revisions`.

Run `NORMALIZED-ONLY-MIGRATION.sql` after confirming your normalized tables contain the desired data.
