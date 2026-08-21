# CockroachDB / Vercel timeout fix

The API previously used the pg Pool to execute the normalized project load as about 20
simultaneous queries. On a serverless Vercel function this can queue connection work
and exceed the 30 second limit.

This build:
- uses one database connection for a complete project read;
- sets connection and statement timeouts so failures return a real error instead of a 504;
- keeps the normalized-table architecture;
- does not use `projects.data` or revision snapshots;
- keeps the database connection string server-side;
- increases the Vercel function limit to 60 seconds where the plan supports it.

No database migration is required for this timeout fix.
