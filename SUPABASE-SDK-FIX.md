# Supabase SDK GitHub Pages fix — build 20260821-3

This build keeps the existing UI but replaces the browser's Supabase save path
with the official `@supabase/supabase-js` client.

Save behavior:
1. Try `save_ibs_project_relational()` through the Supabase JS client.
2. If that RPC is missing, fall back to `public.projects.data` using `.upsert()`.
3. GitHub Pages remains a static host; no Node/PHP/backend server is required.

Important: run `SUPABASE-SETUP.sql` and `RELATIONAL-SUPABASE.sql` in Supabase
if you want the full relational save. The fallback exists so the app can still
save while the relational RPC is being installed.

Deploy the ZIP contents to the repository root for GitHub Pages.
