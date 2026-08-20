# Supabase Save Fix

This version uses your Supabase publishable key directly from the GitHub Pages browser.

## Required one-time Supabase setup

Run `SUPABASE-SETUP.sql` completely in:

Supabase Dashboard → SQL Editor → New query → Run.

Then open the app and create a new requirement.

You should see:

`☁ Saved to Supabase ✓ (revision N)`

## If saving still fails

Open the browser developer console (F12 → Console). The app now reports the exact Supabase error.

Common errors:

- `404` / relation does not exist → the SQL setup was not run.
- `42501` / permission denied → the SQL grants/RLS policies were not applied.
- `401` / `403` → wrong API key or Data API configuration.
- `CONFLICT` → another browser changed the project; reload and save again.

The app no longer requires Supabase Auth for the shared project.
