-- SIMPLE LOCAL AUTH FOR IBS ENTERPRISE DESIGN STUDIO
-- Login is handled by the application itself:
--   username: admin
--   password: 123
-- Supabase is used only as shared project storage. No Supabase Auth user is required.
-- IMPORTANT: this is intentionally simple internal-app authentication, not high-security identity management.

begin;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.projects to anon, authenticated;
grant select, insert, update, delete on table public.modules, public.requirements, public.screens,
  public.screen_components, public.entities, public.entity_fields, public.relations,
  public.apis, public.logic, public.timeline, public."references", public.users,
  public.roles, public.permissions, public.module_access, public.settings
  to anon, authenticated;
grant select on table public.revisions to anon, authenticated;

alter table public.projects enable row level security;
do $$
declare t text;
begin
  -- Parent project
  execute 'drop policy if exists "simple local project access" on public.projects';
  execute 'create policy "simple local project access" on public.projects for all to anon, authenticated using (id = ''ERP-DESIGN-001'') with check (id = ''ERP-DESIGN-001'')';

  foreach t in array ARRAY['modules','requirements','screens','screen_components','entities','entity_fields','relations','apis','logic','timeline','references','users','roles','permissions','module_access','settings']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "simple local %s access" on public.%I',t,t);
    execute format('create policy "simple local %s access" on public.%I for all to anon, authenticated using (project_id = ''ERP-DESIGN-001'') with check (project_id = ''ERP-DESIGN-001'')',t,t);
  end loop;
end $$;

commit;
