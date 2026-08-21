# IBS Enterprise System Design Studio — Supabase Edition

This build is designed for GitHub Pages and uses **Supabase Authentication + one shared JSONB document**. No FastAPI and no separate application server are required.

## Architecture

GitHub Pages → Supabase Auth → Supabase REST API → `public.projects.data` (JSONB)

The project is stored as one JSON document so the existing UI/data model stays intact.

## 1. Create Supabase project

Create a project at https://supabase.com/

## 2. Create database tables and policies

Open **SQL Editor → New query**, paste the complete `SUPABASE-SETUP.sql`, and run it.

It creates:

- `projects` — shared project JSON
- `revisions` — automatic previous-version backups
- RLS policies allowing authenticated users to read/write
- an automatic backup trigger

## 3. Configure Supabase Auth

Open **Authentication → Users → Add user** and create accounts for your IBS team.

For each user, set optional User Metadata:

```json
{
  "displayName": "Ahmed",
  "role": "Administrator",
  "username": "ahmed"
}
```

Roles supported by the existing UI:

- Administrator
- Architect
- Designer
- Viewer

If no role metadata is supplied, the application uses `Viewer`.

For an internal team, you can disable email confirmation in Supabase Auth settings if you want users to sign in immediately after you create them.

## 4. Configure the website

Open:

- `js/store.js`
- `docs/js/store.js` if GitHub Pages serves `/docs`

Replace:

```javascript
const SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
```

Use your Supabase **Project URL** and **Publishable key** (or legacy `anon` key).

**Never put `service_role` or `sb_secret_...` in this website.**

## 5. Deploy to GitHub Pages

Push the project to GitHub and enable Pages.

If your Pages source is the repository root, use the root `index.html`.

If Pages is configured to use the `/docs` folder, configure the matching `docs/js/store.js` values.

## 6. Test

Open the website.

You should first see:

**Sign in to your project**

Sign in with a Supabase Auth user. **The publishable key alone does not authenticate a user; the app must have an active Supabase Auth session before RLS allows saving.**

After login, the app loads the shared project from Supabase.

When you edit and save:

**Saved to Supabase ✓ (revision N)**

## Conflict protection

Every save includes the revision that the browser last loaded.

Example:

User A and User B both load revision 10.

- User A saves → revision 11.
- User B attempts to save revision 10.
- Supabase rejects the stale update.
- User B sees a conflict instead of overwriting User A.

Reload the shared project before continuing after a conflict.

## Automatic backups

Before each successful revision change, the previous JSON document is copied to:

`public.revisions`

The trigger retains the latest 100 revisions per project.

## Important security note

The Supabase publishable/anon key is intentionally safe to expose in browser code when Row Level Security is correctly configured. The `service_role` / secret key must never be exposed.

Supabase Auth is now the authentication mechanism. The old client-side demo passwords are no longer used for login.


### Existing database / `version` column

If you already created an older `public.projects` table that has a `version` column, the supplied `SUPABASE-SETUP.sql` safely migrates that column to `revision`. Do not manually delete the table.
