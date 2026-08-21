# Save Everything

The application treats the complete project object as the source of truth and
automatically saves it directly to Supabase. This includes screens, components,
ERD tables/fields/relationships, business logic, requirements, APIs, timeline,
references, modules, roles, permissions, and project settings.

The UI now reports `Everything saved` rather than `offline`. Supabase is only an
optional cloud sync layer; lack of Supabase authentication does not block saving.
