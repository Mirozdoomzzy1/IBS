# CockroachDB + Vercel setup

This build uses CockroachDB as the shared source of truth. GitHub Pages hosts the frontend; Vercel hosts the small server-side database bridge. The browser never receives `DATABASE_URL` or `JWT_SECRET`.

## 1. Create the schema

Run `cockroach-schema.sql` in your CockroachDB SQL console. Every statement already ends with `;`.

## 2. Configure the existing Vercel project

Vercel project: `ibsdesign`
Production API: `https://ibsdesign.vercel.app/api`

Add these Environment Variables for Production (and Preview if desired):

- `DATABASE_URL` = your CockroachDB connection string
- `JWT_SECRET` = a long random secret
- `PROJECT_ID` = `design-studio-main`
- `DEFAULT_ADMIN_PASSWORD` = the initial admin password

The initial login is `admin` plus the value of `DEFAULT_ADMIN_PASSWORD`. The first successful admin login creates the first `app_users` row automatically.

## 3. Deploy

Push this repository to the `main` branch. Vercel is already connected to `Mirozdoomzzy1/IBS` and will deploy the `api/` functions automatically.

No seed script is required. The first successful save creates the `projects` row automatically if it does not already exist.

## 4. GitHub Pages frontend

`docs/js/cockroach-config.js` is already configured for:

```js
window.COCKROACH_API_URL = "https://ibsdesign.vercel.app/api";
```

Do not put the CockroachDB connection string or password in `docs/`.

## 5. Shared persistence

The authoritative project is stored in `projects.data` as JSONB. Revisions are stored in `project_revisions`; audit entries are stored in `project_audit`. Requirements, screens, screen components, ERD, backend logic, timeline, traceability, references metadata, users, roles and permissions are saved as one project document.

Reference images remain compatible with the current project format. For a later optimization, binary images can be moved to object storage while retaining their metadata in CockroachDB.
