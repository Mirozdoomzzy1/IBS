# Shared Supabase mode

This build is configured so the GitHub Pages frontend does not require a Supabase login. All visitors share the single project `ERP-DESIGN-001`.

Run `SUPABASE-SETUP.sql` in Supabase SQL Editor once. It grants the `anon` role read/insert/update access only to that one project row.

Important: this means the project is intentionally publicly writable. Do not store secrets or private information in the project JSON.
