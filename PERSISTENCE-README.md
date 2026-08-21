# Persistent project saving

The static build now includes `IBSPersistence`, which persists:
- Screens
- ERD
- Business logic
- Whole project state

Data is stored in the browser's localStorage so it survives page reloads and
does not require Cloudflare Pages Functions or a service-role key.

The helper API:
`IBSPersistence.setScreens(...)`
`IBSPersistence.setERD(...)`
`IBSPersistence.setBusinessLogic(...)`
`IBSPersistence.setProject(...)`
`IBSPersistence.setState(...)`

For multi-device/team persistence, wire these same save points to the
existing Supabase client-side tables; do not expose a service-role key.
