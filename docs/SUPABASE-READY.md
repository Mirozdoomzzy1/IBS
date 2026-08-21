# Supabase configuration already installed

This build has the supplied Supabase Project URL and Publishable key installed in BOTH:
- `js/store.js`
- `docs/js/store.js`

Project ID:
`ERP-DESIGN-001`

The app uses Supabase Auth + the `public.projects` table.

## Important
The Publishable key is intended for browser use. Never replace it with a `service_role` or `sb_secret_...` key.

## One-time database setup
Run `SUPABASE-SETUP.sql` in the Supabase SQL Editor. The app cannot create tables or Row Level Security policies from the browser.

## User accounts
This build requires a signed-in Supabase Auth user before cloud reads/writes are allowed by the included RLS policies.

After creating a user and signing in:
- project data loads from `public.projects`
- edits autosave to Supabase
- revisions protect against overwriting another user's newer changes
- the previous revision is backed up in `public.revisions`

If the app says "Saved to Supabase ✓", the data is in the shared database rather than only in browser localStorage.

## Atomic relational save
The current build saves through `public.save_ibs_project_relational(jsonb)`. This is a single PostgreSQL transaction that writes the project master row plus the relational tables (modules, requirements, screens/components, entities/fields, relations, APIs, logic, timeline, references, settings, users, roles, permissions and module access). Run `RELATIONAL-SUPABASE.sql` once after `SUPABASE-SETUP.sql`.
