-- IBS / Enterprise System Design Studio
-- Full relational Supabase database.
-- Run this entire script once in Supabase -> SQL Editor.
-- The browser calls save_ibs_project() and load_ibs_project().

create table if not exists public.projects (
  id text primary key,
  version integer not null default 1,
  name text not null,
  description text,
  owner text,
  comments text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the projects table already existed from the earlier/simple Supabase version,
-- CREATE TABLE IF NOT EXISTS does not add newly introduced columns. Keep the
-- script rerunnable by adding any missing columns explicitly.
alter table public.projects add column if not exists version integer not null default 1;
alter table public.projects add column if not exists name text;
alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists owner text;
alter table public.projects add column if not exists comments text;
alter table public.projects add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();

create table if not exists public.project_settings (
  project_id text primary key references public.projects(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.modules (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.requirements (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.screens (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.screen_components (
  project_id text not null references public.projects(id) on delete cascade,
  screen_id text not null,
  id text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,screen_id,id)
);

create table if not exists public.entities (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.entity_fields (
  project_id text not null references public.projects(id) on delete cascade,
  entity_id text not null,
  field_name text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,entity_id,field_name)
);

create table if not exists public.relationships (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.apis (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.logic_workflows (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.logic_steps (
  project_id text not null references public.projects(id) on delete cascade,
  logic_id text not null,
  step_order integer not null,
  data jsonb not null,
  primary key(project_id,logic_id,step_order)
);

create table if not exists public.timeline_items (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.reference_images (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  screen_id text,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.app_users (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  username text,
  role text,
  active boolean,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.roles (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.permissions (
  project_id text not null references public.projects(id) on delete cascade,
  permission_code text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,permission_code)
);

create table if not exists public.module_access (
  project_id text not null references public.projects(id) on delete cascade,
  module_id text not null,
  role_code text not null,
  allowed boolean not null default false,
  primary key(project_id,module_id,role_code)
);

create table if not exists public.architecture_items (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create table if not exists public.technical_architecture_items (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  primary key(project_id,id)
);

create index if not exists requirements_project_module_idx on public.requirements(project_id,module_id);
create index if not exists screens_project_module_idx on public.screens(project_id,module_id);
create index if not exists entities_project_module_idx on public.entities(project_id,module_id);
create index if not exists apis_project_module_idx on public.apis(project_id,module_id);
create index if not exists timeline_project_module_idx on public.timeline_items(project_id,module_id);
create index if not exists references_project_module_idx on public.reference_images(project_id,module_id);

-- RLS is enabled, but the two RPC functions are SECURITY DEFINER and are the only
-- database interface the public browser needs for the prototype.
alter table public.projects enable row level security;
alter table public.project_settings enable row level security;
alter table public.modules enable row level security;
alter table public.requirements enable row level security;
alter table public.screens enable row level security;
alter table public.screen_components enable row level security;
alter table public.entities enable row level security;
alter table public.entity_fields enable row level security;
alter table public.relationships enable row level security;
alter table public.apis enable row level security;
alter table public.logic_workflows enable row level security;
alter table public.logic_steps enable row level security;
alter table public.timeline_items enable row level security;
alter table public.reference_images enable row level security;
alter table public.app_users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.module_access enable row level security;

drop policy if exists "IBS public rpc access projects" on public.projects;
drop policy if exists "IBS public rpc access settings" on public.project_settings;

-- The application does not directly SELECT/INSERT these tables; it calls the RPCs.
-- No anon table policies are required.

create or replace function public.save_ibs_project(p_project jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pid text := coalesce(p_project->'project'->>'id','ERP-DESIGN-001');
  v integer;
begin
  -- Replace the project's relational snapshot atomically inside this function.
  delete from public.projects where id = pid;

  insert into public.projects(id,version,name,description,owner,comments,data,updated_at)
  values(
    pid,
    coalesce((p_project->>'version')::integer,1),
    coalesce(p_project->'project'->>'name','Enterprise Management System'),
    p_project->'project'->>'description',
    p_project->'project'->>'owner',
    p_project->'project'->>'comments',
    p_project,
    now()
  );

  insert into public.project_settings(project_id,data)
  values(pid,coalesce(p_project->'settings','{}'::jsonb));

  insert into public.modules(project_id,id,sort_order,data)
  select pid,x->>'id',ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'modules','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.requirements(project_id,id,module_id,sort_order,data)
  select pid,x->>'id',x->>'moduleId',ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'requirements','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.screens(project_id,id,module_id,sort_order,data)
  select pid,x->>'id',x->>'moduleId',ord::integer,x - 'components'
  from jsonb_array_elements(coalesce(p_project->'screens','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.screen_components(project_id,screen_id,id,sort_order,data)
  select pid,s->>'id',c->>'id',cord::integer,c
  from jsonb_array_elements(coalesce(p_project->'screens','[]'::jsonb)) s
  cross join lateral jsonb_array_elements(coalesce(s->'components','[]'::jsonb)) with ordinality cc(c,cord);

  insert into public.entities(project_id,id,module_id,sort_order,data)
  select pid,x->>'id',x->>'moduleId',ord::integer,x - 'fields'
  from jsonb_array_elements(coalesce(p_project->'entities','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.entity_fields(project_id,entity_id,field_name,sort_order,data)
  select pid,e->>'id',f->>'name',ford::integer,f
  from jsonb_array_elements(coalesce(p_project->'entities','[]'::jsonb)) e
  cross join lateral jsonb_array_elements(coalesce(e->'fields','[]'::jsonb)) with ordinality ff(f,ford);

  insert into public.relationships(project_id,id,sort_order,data)
  select pid,x->>'id',ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'relations','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.apis(project_id,id,module_id,sort_order,data)
  select pid,x->>'id',x->>'moduleId',ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'apis','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.logic_workflows(project_id,id,module_id,sort_order,data)
  select pid,x->>'id',x->>'moduleId',ord::integer,x - 'steps'
  from jsonb_array_elements(coalesce(p_project->'logic','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.logic_steps(project_id,logic_id,step_order,data)
  select pid,l->>'id',sord::integer,jsonb_build_object('value',s)
  from jsonb_array_elements(coalesce(p_project->'logic','[]'::jsonb)) l
  cross join lateral jsonb_array_elements(coalesce(l->'steps','[]'::jsonb)) with ordinality ss(s,sord);

  insert into public.timeline_items(project_id,id,module_id,sort_order,data)
  select pid,x->>'id',x->>'moduleId',ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'timeline','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.reference_images(project_id,id,module_id,screen_id,sort_order,data)
  select pid,x->>'id',x->>'moduleId',x->>'screenId',ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'references','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.app_users(project_id,id,username,role,active,sort_order,data)
  select pid,x->>'id',x->>'username',x->>'role',coalesce((x->>'active')::boolean,true),ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'security'->'users','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.roles(project_id,id,sort_order,data)
  select pid,x->>'id',ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'security'->'roles','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.permissions(project_id,permission_code,sort_order,data)
  select pid,x::text,ord::integer,jsonb_build_object('code',x::text)
  from jsonb_array_elements_text(coalesce(p_project->'security'->'permissions','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.module_access(project_id,module_id,role_code,allowed)
  select pid,m.key,r.key,(r.value)::boolean
  from jsonb_each(coalesce(p_project->'security'->'moduleAccess','{}'::jsonb)) m
  cross join lateral jsonb_each(m.value) r;

  insert into public.architecture_items(project_id,id,sort_order,data)
  select pid,coalesce(x->>'id','ARCH-'||ord::text),ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'architecture','[]'::jsonb)) with ordinality t(x,ord);

  insert into public.technical_architecture_items(project_id,id,sort_order,data)
  select pid,coalesce(x->>'id','TECH-'||ord::text),ord::integer,x
  from jsonb_array_elements(coalesce(p_project->'technicalArchitecture','[]'::jsonb)) with ordinality t(x,ord);

  return jsonb_build_object('ok',true,'project_id',pid,'updated_at',now());
end;
$$;

create or replace function public.load_ibs_project(p_project_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
select jsonb_build_object(
  'version',p.version,
  'project',jsonb_build_object(
    'id',p.id,
    'name',p.name,
    'description',p.description,
    'owner',p.owner,
    'comments',coalesce(p.comments,'')
  ),
  'modules',coalesce((select jsonb_agg(m.data order by m.sort_order) from modules m where m.project_id=p.id),'[]'::jsonb),
  'requirements',coalesce((select jsonb_agg(r.data order by r.sort_order) from requirements r where r.project_id=p.id),'[]'::jsonb),
  'screens',coalesce((select jsonb_agg(
      s.data || jsonb_build_object('components',coalesce((select jsonb_agg(c.data order by c.sort_order) from screen_components c where c.project_id=s.project_id and c.screen_id=s.id),'[]'::jsonb))
      order by s.sort_order) from screens s where s.project_id=p.id),'[]'::jsonb),
  'entities',coalesce((select jsonb_agg(
      e.data || jsonb_build_object('fields',coalesce((select jsonb_agg(f.data order by f.sort_order) from entity_fields f where f.project_id=e.project_id and f.entity_id=e.id),'[]'::jsonb))
      order by e.sort_order) from entities e where e.project_id=p.id),'[]'::jsonb),
  'relations',coalesce((select jsonb_agg(r.data order by r.sort_order) from relationships r where r.project_id=p.id),'[]'::jsonb),
  'apis',coalesce((select jsonb_agg(a.data order by a.sort_order) from apis a where a.project_id=p.id),'[]'::jsonb),
  'timeline',coalesce((select jsonb_agg(t.data order by t.sort_order) from timeline_items t where t.project_id=p.id),'[]'::jsonb),
  'logic',coalesce((select jsonb_agg(
      l.data || jsonb_build_object('steps',coalesce((select jsonb_agg(ls.data->'value' order by ls.step_order) from logic_steps ls where ls.project_id=l.project_id and ls.logic_id=l.id),'[]'::jsonb))
      order by l.sort_order) from logic_workflows l where l.project_id=p.id),'[]'::jsonb),
  'architecture',coalesce((select jsonb_agg(a.data order by a.sort_order) from architecture_items a where a.project_id=p.id),'[]'::jsonb),
  'technicalArchitecture',coalesce((select jsonb_agg(a.data order by a.sort_order) from technical_architecture_items a where a.project_id=p.id),'[]'::jsonb),
  'references',coalesce((select jsonb_agg(r.data order by r.sort_order) from reference_images r where r.project_id=p.id),'[]'::jsonb),
  'settings',coalesce((select ps.data from project_settings ps where ps.project_id=p.id),'{}'::jsonb),
  'security',jsonb_build_object(
      'users',coalesce((select jsonb_agg(u.data order by u.sort_order) from app_users u where u.project_id=p.id),'[]'::jsonb),
      'roles',coalesce((select jsonb_agg(r.data order by r.sort_order) from roles r where r.project_id=p.id),'[]'::jsonb),
      'permissions',coalesce((select jsonb_agg((d->>'code') order by pr.sort_order) from permissions pr cross join lateral (select pr.data d) q where pr.project_id=p.id),'[]'::jsonb),
      'moduleAccess',coalesce((select jsonb_object_agg(module_id,role_map) from (
          select module_id,jsonb_object_agg(role_code,allowed order by role_code) role_map
          from module_access where project_id=p.id group by module_id
      ) x),'{}'::jsonb)
  )
)
from projects p
where p.id=p_project_id;
$$;

grant execute on function public.save_ibs_project(jsonb) to anon, authenticated;
grant execute on function public.load_ibs_project(text) to anon, authenticated;

-- Helpful for the Supabase dashboard.
comment on table public.projects is 'One project snapshot plus metadata for IBS Design Studio';
comment on table public.modules is 'System modules';
comment on table public.requirements is 'Business requirements';
comment on table public.screens is 'Screen specifications';
comment on table public.screen_components is 'Screen controls/components';
comment on table public.entities is 'ERD entities/tables';
comment on table public.entity_fields is 'ERD fields/columns';
comment on table public.relationships is 'ERD relationships';
comment on table public.apis is 'Backend/API contracts';
comment on table public.logic_workflows is 'Backend business workflows';
comment on table public.logic_steps is 'Workflow steps';
comment on table public.timeline_items is 'Timeline and task items';
comment on table public.reference_images is 'UI/reference images';
comment on table public.app_users is 'Studio users';
comment on table public.roles is 'Studio roles';
comment on table public.permissions is 'Permission catalogue';
comment on table public.module_access is 'Role/module access matrix';
comment on table public.architecture_items is 'Architecture map items';
comment on table public.technical_architecture_items is 'Technical architecture items';
