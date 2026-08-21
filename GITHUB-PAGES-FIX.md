# GitHub Pages deployment fix

This build is explicitly versioned `20260821-2` so GitHub Pages/browser caches cannot silently reuse the previous `store.js`.

## Deploy

Use **Settings → Pages → Deploy from a branch → main → /(root)**.

Copy the contents of this ZIP into the repository root, preserving `index.html`, `js/`, `css/`, and `v12-mobile-navigation.js`. Do not deploy only the `docs/` folder when Pages is configured for `/(root)`.

After pushing, open the GitHub Pages URL and press **Ctrl+Shift+R**. In DevTools → Console you should see:

`[Enterprise Studio] Supabase relational build 20260821-2 loaded`

The save path in this build calls only:

`POST /rest/v1/rpc/save_ibs_project_relational`

The browser does not use `syncRelationalProject()` as the primary save path.
