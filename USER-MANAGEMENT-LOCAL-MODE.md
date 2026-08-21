# User management — local mode

User management no longer requires an authenticated Supabase workspace.
The static Cloudflare Pages build provides a local user store in browser
localStorage. The default administrator is `admin` / `123`.

This is intentionally simple: no server function, service-role key, or
Supabase workspace authentication is required for the user-management UI.
