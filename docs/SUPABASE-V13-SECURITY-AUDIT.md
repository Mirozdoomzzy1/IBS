# Enterprise System Design Studio — v13 Security & Audit

This build adds:

- Authentication-only Supabase workspace (anonymous writes removed).
- Administrator / Architect / Designer / Viewer permissions.
- Server-side permission checks in the save RPC.
- Module-level edit enforcement.
- Server audit log with authenticated actor, timestamp, action, object and before/after JSON.
- Server-side attributed comments.
- Mobile-first Screen Designer.
- Field source metadata: DB/schema, table, column, source type, calculation/rule.
- Reference images required to belong to a module.

## First administrator

1. Create the first user in Supabase Authentication.
2. Sign in to the static site with that user.
3. If `user_access` is still empty, the first authenticated user is automatically treated as Administrator.
4. After the first administrator creates user mappings, unmapped users are Viewer by default.

For existing deployments, run `SUPABASE-FIX-ALL.sql` completely in the Supabase SQL Editor.

## Creating additional accounts

Create accounts in Supabase Authentication. Assign a role using the `user_access` table (preferred) or protected `app_metadata.role`.

Example SQL:

```sql
insert into public.user_access(user_id, role, active, display_name)
values ('AUTH-USER-UUID-HERE', 'Designer', true, 'Designer Name')
on conflict (user_id) do update
set role=excluded.role, active=excluded.active, display_name=excluded.display_name;
```

Allowed roles:

- Administrator — everything, including security administration.
- Architect — architecture, requirements, screens, ERD, backend, timeline and references.
- Designer — requirements, screens, references and module design.
- Viewer — read-only.

Module-specific access can also be configured in `user_module_access`.

## Audit

The Audit Log reads from `public.audit_log`. Database triggers capture INSERT/UPDATE/DELETE and the actor is taken from `auth.uid()`. Comments are stored in `public.comments` and also create an audit entry.

The audit trail is therefore server-side and is not dependent on the browser's localStorage.

## Screen field source

Each screen component now stores:

- `dbSchema`
- `dbTable`
- `dbColumn`
- `sourceType`
- `calculationRule`
- existing entity/field mapping
- validation and permission information

Use **Validation** in the application to find missing source information.

## Important

Do not put a Supabase service-role/secret key in GitHub Pages. The site only uses the public publishable/anon key and protected Supabase Auth/RLS.
