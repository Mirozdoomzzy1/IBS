# Supabase setup

Run **SUPABASE-ONE-CLICK.sql** in the Supabase SQL Editor.

It is intentionally self-contained and creates the required `user_access` table before the username-authentication section uses it.

Then deploy the included `supabase/functions/ibs-user-admin/index.ts` Edge Function.

Initial application login:

- Username: `admin`
- Password: `123`
