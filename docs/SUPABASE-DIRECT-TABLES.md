# Supabase Direct Relational Persistence

The Design Studio uses Supabase PostgreSQL as the source of truth.

## Save path

Browser state → `POST /rest/v1/rpc/save_ibs_project_relational` → PostgreSQL transaction → relational tables.

The application does **not** write the complete project to `projects.data` or `projects.project_data`.

The relational tables are:

- `projects` — workspace/revision header only
- `modules`
- `requirements`
- `screens`
- `screen_components`
- `entities`
- `entity_fields`
- `relations`
- `apis`
- `logic`
- `timeline`
- `references`
- `settings`
- `users`
- `roles`
- `permissions`
- `module_access`

The `data` JSONB columns that exist on some child tables are only per-row extension snapshots for backward compatibility; they are **not** the project persistence mechanism.

## Required Supabase setup

Run the complete `SUPABASE-SETUP.sql` first, then the complete `RELATIONAL-SUPABASE.sql` in the Supabase SQL Editor.

The second script creates/repairs the relational columns, including `entity_fields.name`, RLS policies, grants, and the atomic `save_ibs_project_relational(jsonb)` RPC.

## Important

If the browser reports an error such as:

`Supabase 400: column entity_fields.name does not exist`

then the relational migration has not been applied to the database that the browser is connected to. Re-run the complete `RELATIONAL-SUPABASE.sql` against that Supabase project.
