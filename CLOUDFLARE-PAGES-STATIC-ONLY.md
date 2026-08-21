# Cloudflare Pages — Static-only deployment

This build does **not** use Cloudflare Pages static hosting. Upload/deploy the project as a static site.

The Supabase project URL and public publishable/anon key are already embedded in `js/store.js`; no Cloudflare environment variables or service-role key are required.

## Important limitation

Because this is a static browser-only build, it cannot use a Supabase service-role key. Existing users can sign in normally. Creating a new Auth user from Security Center uses Supabase Auth sign-up and then writes the user's `user_access` row. Password changes for existing users must be performed through Supabase Authentication.

If Supabase email confirmation is enabled, username/password accounts using the `@ibs.local` convention will not work until confirmation is disabled or another real email flow is implemented.
