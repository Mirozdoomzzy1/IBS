# Username authentication — one-click database setup

## Run this file only

Open Supabase SQL Editor and run:

`SUPABASE-ONE-CLICK.sql`

This file contains the complete relational/security migration followed by the username authentication migration. It creates `public.user_access` before anything references it, so the previous error:

`ERROR: 42P01: relation "public.user_access" does not exist`

will not occur when this file is run on a fresh or existing IBS database.

You do **not** need to run `SUPABASE-FIX-ALL.sql` separately first.

## Admin login

- Username: `admin`
- Password: `123`
- Role: `Administrator`

The application has one hardcoded administrator username: `admin`. Supabase Auth verifies its password. Supabase Auth uses an internal `internal Auth identifier` identifier; the application never displays or asks the user for an email.

## Creating users

There is no user-management screen in this build. The only application account is the hardcoded `admin` username.

- Administrator (hardcoded)

Design roles remain as permission definitions, but they are not login accounts.

Permissions are enforced server-side and actions are written to the audit log.

## Edge Function

Deploy:

`supabase/functions/ibs-user-admin/index.ts`

The function uses Supabase's server-side the Supabase Edge Function secret; no service-role key is included in the static website.


### Important: Username/password is still Supabase Auth
The application does **not** authenticate against the `public.user_access` table. Supabase Auth is the credential store. For a username such as `admin`, the application signs in using the internal Auth identifier `internal Auth identifier`. A `400: Invalid login credentials` response therefore means the corresponding Supabase Auth user is missing or its password does not match.

For internal username-only login, create the Auth user with the matching `username@ibs.local` identifier and disable email confirmation in Supabase Auth. Then create/link the corresponding `public.user_access` row with the same username.


## Current build note
This version now uses simple application authentication: `admin` / `123`. Supabase Auth is not required. Additional users can be created from Users & Access.
