# Hardcoded Admin / Username-Only Build

- Only login username: `admin`
- No user creation, editing, disabling, or deletion in the UI.
- No email field is requested or displayed.
- Supabase Auth remains the authentication backend; its internal identifier is hidden.
- The database security functions treat only username `admin` as Administrator.
- Existing non-admin `public.user_access` mappings are removed by the supplied SQL override.
- Existing audit/comment email values are cleared; new application writes use username/display name only.

Run the supplied Supabase SQL after deploying the static files.


## Current build note
This version now uses simple application authentication: `admin` / `123`. Supabase Auth is not required. Additional users can be created from Users & Access.
