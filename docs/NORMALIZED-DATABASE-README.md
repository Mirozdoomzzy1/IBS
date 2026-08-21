# Normalized CockroachDB storage

The Design Studio no longer stores the project as one JSON document and no longer creates revision snapshots.

Each design area has its own CockroachDB table(s):

- `modules`
- `requirements`
- `screens` + `screen_components`
- `entities` + `entity_fields`
- `relations`
- `apis`
- `logic_workflows` + `logic_steps`
- `timeline_tasks`
- `reference_images`
- `testing_cases` + `testing_steps`
- `project_comments`
- `project_settings`
- `app_users`

`projects` now contains only shared project metadata (name, description, owner, timestamps). It is not the project data store.

The browser compares the current artifact sections with the last cloud load and sends only changed sections. The API then writes only those tables inside one CockroachDB transaction.

No `project_revisions` snapshots are created.
