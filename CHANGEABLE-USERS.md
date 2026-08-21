# Changeable Usernames

Usernames are no longer hard-coded.

## Vercel environment variables

Set:

- `DEFAULT_ADMIN_USERNAME` — the username to create on first login when `app_users` is empty.
- `DEFAULT_ADMIN_PASSWORD` — the initial password.

Example:

`DEFAULT_ADMIN_USERNAME=ahmed`

`DEFAULT_ADMIN_PASSWORD=change-this`

After the first administrator exists, create additional users from Users & Access. All active users authenticate through `/api/login`.

The browser does not receive `DATABASE_URL` or the administrator password.

Comments use the authenticated user's display name/username, and task assignments use the users stored in `app_users`.
