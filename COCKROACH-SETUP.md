# CockroachDB setup

This build removes Supabase from project persistence. The browser talks to a small server API; the API talks to CockroachDB. Database credentials are never exposed to GitHub Pages.

## 1. Create CockroachDB Basic
Use CockroachDB Cloud Basic. Current pricing lists 10 GiB storage and 50 million request units free per month. See the official pricing page.

## 2. Create the schema
Run `cockroach-schema.sql` in the CockroachDB SQL console.

## 3. Seed the existing project
From this repository's root:

```bash
npm install
DATABASE_URL="YOUR_COCKROACH_CONNECTION_STRING" node scripts/seed-project.mjs
```

## 4. Deploy the API
Deploy this repository to Vercel (or another Node serverless host). Set these server-side environment variables:

- `DATABASE_URL` = CockroachDB connection string
- `JWT_SECRET` = long random secret
- `PROJECT_ID` = `ERP-DESIGN-001`

The `api/` directory contains login, project load/save, health, audit and comment endpoints.

## 5. Point GitHub Pages to the API
Edit `docs/js/cockroach-config.js` and replace `YOUR-VERCEL-APP.vercel.app` with the deployed API host.

Example:

```js
window.COCKROACH_API_URL = "https://my-design-studio-api.vercel.app/api";
```

Do not put the Cockroach connection string or password in this file.

## 6. Data model
The authoritative project is saved atomically in `projects.data` as JSONB. Revisions are copied to `project_revisions`. This keeps requirements, screens, screen components, ERD, timeline, backend logic, traceability, settings and access configuration consistent as one project revision.

Reference images are currently retained inside the project JSON for compatibility. A later asset-storage step can move those binaries to object storage without changing the project model.

## GitHub Pages note
GitHub Pages can host the static `docs/` frontend, but it must not contain `DATABASE_URL` or `JWT_SECRET`. The Vercel API is the secure bridge between the browser and CockroachDB.
