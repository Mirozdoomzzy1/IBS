# IBS — Full Supabase Database Setup

This version no longer saves the project as one Supabase JSON row.
It saves the design into separate PostgreSQL tables and reconstructs the same project JSON when the app loads.

## 1. Create a Supabase project

Create a project at https://supabase.com/.

## 2. Create the database

Open **SQL Editor → New query**.

Open `SUPABASE-SETUP.sql` from this ZIP, copy the entire file, paste it into SQL Editor and click **Run**.

It creates tables for:

- `projects`
- `project_settings`
- `modules`
- `requirements`
- `screens`
- `screen_components`
- `entities`
- `entity_fields`
- `relationships`
- `apis`
- `logic_workflows`
- `logic_steps`
- `timeline_items`
- `reference_images`
- `app_users`
- `roles`
- `permissions`
- `module_access`
- `architecture_items`
- `technical_architecture_items`

It also creates two database functions:

- `save_ibs_project(jsonb)` — saves the complete project atomically
- `load_ibs_project(text)` — rebuilds the complete project from the tables

## 3. Get the Supabase URL and client key

Open **Supabase → Settings → API Keys**.

For a browser application use the **Publishable key** (`sb_publishable_...`).
If your project only has legacy keys, the **anon** key also works.

**Never use `service_role` or `sb_secret_...` in the browser.**

## 4. Configure the website

Open:

```text
js/store.js
```

Find:

```javascript
const SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

Replace those two values.

If GitHub Pages is using the `/docs` folder, make the same change in:

```text
docs/js/store.js
```

## 5. Test it

Open the website → **Settings**.

You should see **Cloud database**.

Click:

```text
Test connection
```

Then:

```text
Save to Supabase now
```

You should see:

```text
Saved to Supabase ✓
```

## 6. Verify the database

In Supabase → **Table Editor**, you should see rows in:

```text
projects
modules
requirements
screens
screen_components
entities
entity_fields
relationships
apis
logic_workflows
logic_steps
timeline_items
reference_images
app_users
roles
permissions
module_access
```

## Important

The existing application login is still a client-side prototype. The project currently stores its application users as design data, including the demo passwords. Do not use this as production authentication yet. The database architecture is ready for us to replace that with Supabase Auth later.
