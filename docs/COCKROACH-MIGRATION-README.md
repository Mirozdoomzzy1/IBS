# CockroachDB migration

This build no longer uses Supabase for project persistence.

1. Create a CockroachDB Cloud Basic cluster.
2. Run `../cockroach/SCHEMA.sql` (or the root `cockroach-schema.sql`).
3. Deploy the root `api/` directory with Vercel.
4. Set `DATABASE_URL`, `JWT_SECRET`, and `PROJECT_ID` on the API host.
5. Seed with `node scripts/seed-project.mjs path/to/exported-project.json`.
6. Put the deployed API URL in `docs/js/cockroach-config.js`.
7. Deploy `docs/` to GitHub Pages.

The browser never receives the CockroachDB connection string.
