# Supabase configuration

This build is configured for the Supabase project URL:

`https://bqrzjbcrekhuzwxjlrjs.supabase.co`

The browser uses the supplied Supabase publishable key. No service-role key is included.

## Required database setup

Run `SUPABASE-SETUP.sql` in the Supabase SQL Editor if you have not already done so.

The application writes to:

`public.projects`

using the REST endpoint:

`/rest/v1/projects?on_conflict=id`

## Deployment note

This ZIP contains both the root application and the `docs/` copy where present. Both `store.js` copies were configured so GitHub Pages cannot accidentally serve the old placeholder configuration.

## Verification

After deploying, open the browser DevTools Network tab, modify a project, and verify a successful POST/PATCH request to:

`https://bqrzjbcrekhuzwxjlrjs.supabase.co/rest/v1/projects`

Then verify the row in Supabase Table Editor -> `projects`.
