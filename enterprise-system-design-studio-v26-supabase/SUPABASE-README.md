# IBS — Supabase setup

This version removes the GitHub PAT/database-file approach. The existing Studio remains HTML/CSS/JavaScript and uses Supabase directly from the browser.

## 1. Create Supabase project
1. Go to https://supabase.com/
2. Create a new project.
3. Open **SQL Editor**.
4. Paste everything from `SUPABASE-SETUP.sql` and run it.

## 2. Get the two values
Supabase Dashboard -> **Project Settings -> API**:
- Project URL
- Publishable/anon key (use the browser/public key, NOT `service_role`)

## 3. Paste them into the app
Open:
- `js/store.js`
- `docs/js/store.js`

Find:
```js
const SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  table: "projects"
};
```
Replace only `url` and `anonKey`.

## 4. Upload the files to GitHub
Commit/push the modified project. GitHub Pages will serve the updated JavaScript.

## What happens
- Existing project JSON is still used as the initial/default project.
- The first save creates `projects.id = ERP-DESIGN-001`.
- Later saves update the same database row.
- Opening the Studio on another device loads the same project from Supabase.
- Browser localStorage remains only a local cache.

## Important prototype security note
The supplied SQL intentionally allows anonymous read/insert/update so this can work from a static GitHub Pages site with no backend. Anyone who can access the site could potentially modify the project. This is suitable for a prototype. Once you need real user accounts/private projects, enable Supabase Auth and replace these policies with per-user rules.

Never put a Supabase `service_role`/secret key in this JavaScript. Only use the public/anon key.
