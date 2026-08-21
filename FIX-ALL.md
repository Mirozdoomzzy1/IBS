# FIX ALL — GitHub Pages + Supabase

## 1. Deploy the website
Upload the contents of this ZIP to the GitHub Pages repository root.

The website now uses the official `@supabase/supabase-js` client for cloud
load/save. It no longer depends on the custom browser REST save path.

## 2. Fix the database once
In Supabase Dashboard → SQL Editor, run the COMPLETE file:

`SUPABASE-FIX-ALL.sql`

Do not run only part of it.

## 3. Verify
Open the website, reload it, create a new requirement, and click Save.

The diagnostic panel should say:

`Saved all relational tables ✓`

and show a new revision.

Then in Supabase Table Editor open:

`public.requirements`

The new requirement should be there immediately.

## 4. If something still fails
The application now reports the exact Supabase error instead of silently falling
back to local storage. Open the diagnostic panel and copy the text after
`SUPABASE SAVE ERROR`.

Do NOT put a service_role/secret key into GitHub Pages. Keep using the public
publishable/anon key.
