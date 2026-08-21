# Cloud save behavior

- Project data is saved to `projects.data` only after an actual project mutation calls `saveProject()`.
- No 5-second autosave loop.
- No save on page hide/unload.
- No revision snapshot rows are created.
- The API does not write `project_revisions` during normal saves.
- The client skips the database write when the project JSON is identical to the last successfully persisted copy.
- `project.revisions`/`projects.revision` is retained only as a lightweight optimistic-concurrency version counter; it does not store a copy of the project.
- Comments continue to use the audit table because comments are explicit audit events.
