# Normalized CockroachDB upgrade

The error `column "name" does not exist` means the existing `projects` table was created by the older schema. `CREATE TABLE IF NOT EXISTS` does not modify an existing table, so the new columns must be added explicitly.

Run `NORMALIZED-DB-UPGRADE.sql` once in CockroachDB, then redeploy the application.

The normalized application stores requirements, screens, ERD entities/fields/relations, backend logic, timeline, references, testing and comments in their own tables. It does not write project JSON or revision snapshots.

After verifying the normalized data, the legacy `data` and `revision` columns can be dropped using the commented commands in the upgrade SQL.
