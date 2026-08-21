# Entity Fields schema fix

Run the updated `RELATIONAL-SUPABASE.sql` in Supabase SQL Editor.

The previous database may have an older `entity_fields` table without `name`. The updated migration:
- adds `entity_fields.name`
- backfills it from `data.name` where possible
- generates a stable fallback name for legacy rows
- adds a unique index on `(project_id, entity_id, name)` for REST upserts

The browser continues to save each field as a row in `entity_fields`; it does not store the entire project in `projects.data` or `projects.project_data`.
