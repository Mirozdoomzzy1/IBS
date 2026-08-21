# Simple Login

This build intentionally uses the simplest application login:

- Username: `admin`
- Password: `123`
- No email.
- No Supabase Auth account.
- After signing in, the Administrator can create additional users from **Users & Access**.
- User credentials are stored with the project data in Supabase.

### Supabase setup

Run `docs/SIMPLE-LOCAL-AUTH.sql` in Supabase SQL Editor once. It enables anonymous shared access to the single project so the browser can load/save the relational project data without Supabase Auth.

This is suitable for an internal/simple application, not a high-security public identity system.
