# Normalized save fix

This build saves each changed feature into its own CockroachDB tables. It does not write `projects.data` and does not create revision snapshots.

## Required database migration

Run `NORMALIZED-RELAX-ALL-DESIGN-FKS.sql` once after the normalized schema exists. It removes cross-table foreign keys that block partially-built design artifacts from being saved.

Primary keys remain. The project metadata row remains. User uniqueness remains.

## Better errors

The API now reports the exact feature/table group that failed instead of returning `[object Object]`, for example:

`Save failed in screens: ...`

This makes any remaining schema mismatch immediately visible.
