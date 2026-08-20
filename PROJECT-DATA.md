# Project data workflow

The Studio uses one central project object for every feature. Browser autosave keeps a working copy in localStorage.

## Portable JSON source of truth

Use **Settings → Project JSON File → Download JSON**. The JSON contains requirements, screens, screen components, screen/reference images, ERD tables and relationships, backend APIs and logic, timeline/tasks, users/roles/permissions, navigation and project settings.

Use **Load JSON** to restore a complete project. On first opening a clean deployment, the site also loads `data/project.json` automatically when no browser project exists.

## Direct JSON file saving

On Chromium-based browsers, **Connect JSON File** lets the browser keep permission to write the project directly to a JSON file you choose. After connecting, normal Save and autosave write the complete project back to that file.

If direct file writing is unavailable, use **Download JSON** after saving. GitHub Pages cannot silently modify files inside the GitHub repository; to publish a new shared `data/project.json`, replace that file in the repository and commit/push it.


## Cloud database
This version uses the full Supabase relational database described in SUPABASE-SETUP.sql. The database is the source of truth when Supabase is configured.
