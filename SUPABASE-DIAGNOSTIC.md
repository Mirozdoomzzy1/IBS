# Supabase Diagnostic Build

This build puts Supabase status directly on the page.

After deploying it, use the panel in the bottom-right:

1. Click **Test Supabase**.
2. If it says **CONNECTED**, click **Force Save**.
3. Create a new requirement and save it normally.
4. If it says **ERROR**, the exact Supabase error appears in the panel.

Make sure the complete `SUPABASE-SETUP.sql` has been executed in Supabase SQL Editor.

IMPORTANT:
- Deploy the version you downloaded, not an older cached ZIP.
- If GitHub Pages uses `/docs`, this package includes the patched `docs/js/store.js`.
- A hard refresh (Ctrl+Shift+R) is recommended after deployment.
