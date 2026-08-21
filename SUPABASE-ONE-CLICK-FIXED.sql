-- ============================================================
-- IBS ENTERPRISE DESIGN STUDIO — SUPABASE ONE-CLICK FIX
-- Build 20260821-4
-- Run this ENTIRE file in Supabase SQL Editor.
-- It creates/repairs the shared project schema, RLS policies, and
-- the transactional save RPC used by the GitHub Pages application.
-- ============================================================

-- IBS Enterprise System Design Studio
-- Supabase Auth + shared JSONB project storage + optimistic conflict protection
-- Safe migration for existing IBS projects tables.
-- Run this entire script in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. PROJECTS TABLE
-- ============================================================
-- The previous version of the IBS schema used a column named
-- "version". The website now uses "revision" for optimistic
-- concurrency control. Migrate it instead of using CREATE TABLE
-- IF NOT EXISTS, which does NOT change an existing table.

do $$
begin
  if to_regclass('public.projects') is null then
    create table public.projects (
      id text primary key,
      data jsonb not null default '{}'::jsonb,
      revision bigint not null default 0,
      updated_at timestamptz not null default now(),
      updated_by uuid references auth.users(id) on delete set null
    );
  else
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='projects' and column_name='version'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='projects' and column_name='revision'
    ) then
      alter table public.projects rename column version to revision;
    end if;

    alter table public.projects add column if not exists data jsonb default '{}'::jsonb;
    -- Legacy column from an earlier version. It is intentionally unused by IBS.
    alter table public.projects add column if not exists project_data jsonb default '{}'::jsonb;
    alter table public.projects add column if not exists revision bigint not null default 0;
    alter table public.projects add column if not exists updated_at timestamptz not null default now();
    alter table public.projects add column if not exists updated_by uuid references auth.users(id) on delete set null;
  end if;
end $$;

-- Normalize nulls/defaults in case the existing table was older.
update public.projects
set data = '{}'::jsonb
where data is null;

update public.projects
set project_data = '{}'::jsonb
where project_data is null;

update public.projects
set revision = 0
where revision is null;

update public.projects
set updated_at = now()
where updated_at is null;

alter table public.projects
  alter column data set default '{}'::jsonb,
  alter column data drop not null,
  alter column project_data set default '{}'::jsonb,
  alter column project_data drop not null,
  alter column revision set default 0,
  alter column revision set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- ============================================================
-- 2. REVISION/BACKUP TABLE
-- ============================================================
create table if not exists public.revisions (
  id bigint generated always as identity primary key,
  project_id text not null references public.projects(id) on delete cascade,
  revision bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Migrate an older backup table if it used "version" instead.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revisions' and column_name='version'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revisions' and column_name='revision'
  ) then
    alter table public.revisions rename column version to revision;
  end if;
end $$;

alter table public.revisions add column if not exists revision bigint;
alter table public.revisions add column if not exists data jsonb;
alter table public.revisions add column if not exists created_at timestamptz not null default now();
alter table public.revisions add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists revisions_project_idx
  on public.revisions(project_id, revision desc);

-- ============================================================
-- 3. ROW LEVEL SECURITY — SHARED WORKSPACE
-- ============================================================
-- This project is intentionally a shared GitHub-Pages workspace: any visitor
-- with the public Supabase key can read/write the single project row.
-- Never store a service_role/secret key in the frontend.
alter table public.projects enable row level security;
alter table public.revisions enable row level security;

drop policy if exists "authenticated can read projects" on public.projects;
drop policy if exists "authenticated can insert projects" on public.projects;
drop policy if exists "authenticated can update projects" on public.projects;
drop policy if exists "authenticated can read revisions" on public.revisions;
drop policy if exists "public shared project read" on public.projects;
drop policy if exists "public shared project insert" on public.projects;
drop policy if exists "public shared project update" on public.projects;
drop policy if exists "public shared revisions read" on public.revisions;

create policy "public shared project read"
on public.projects for select
to anon, authenticated
using (id = 'ERP-DESIGN-001');

create policy "public shared project insert"
on public.projects for insert
to anon, authenticated
with check (id = 'ERP-DESIGN-001');

create policy "public shared project update"
on public.projects for update
to anon, authenticated
using (id = 'ERP-DESIGN-001')
with check (id = 'ERP-DESIGN-001');

create policy "public shared revisions read"
on public.revisions for select
to anon, authenticated
using (project_id = 'ERP-DESIGN-001');

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.projects to anon, authenticated;
grant select on table public.revisions to anon, authenticated;

-- ============================================================
-- 4. AUTOMATIC BACKUP OF PREVIOUS VERSION
-- ============================================================
create or replace function public.ibs_backup_previous_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and OLD.revision <> NEW.revision then
    insert into public.revisions(project_id, revision, data, created_by)
    values(OLD.id, OLD.revision, OLD.data, OLD.updated_by);
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_ibs_backup_project on public.projects;
create trigger trg_ibs_backup_project
before update on public.projects
for each row execute function public.ibs_backup_previous_project();

-- ============================================================
-- 5. KEEP LATEST 100 BACKUPS
-- ============================================================
create or replace function public.ibs_cleanup_revisions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.revisions
  where id in (
    select id
    from public.revisions
    where project_id = NEW.id
    order by revision desc, id desc
    offset 100
  );
  return NEW;
end;
$$;

drop trigger if exists trg_ibs_cleanup_revisions on public.projects;
create trigger trg_ibs_cleanup_revisions
after update on public.projects
for each row execute function public.ibs_cleanup_revisions();

-- ============================================================
-- 6. OPTIONAL: CREATE THE INITIAL PROJECT ROW
-- ============================================================
-- The website can also create it automatically on first save.
-- Leave this commented unless you want an explicit initial row.
-- insert into public.projects(id, data, revision)
-- values ('ERP-DESIGN-001', '{}'::jsonb, 0)
-- on conflict (id) do nothing;

-- ============================================================
-- 7. VERIFY
-- ============================================================
select id, revision, updated_at, updated_by
from public.projects
order by updated_at desc;

select project_id, revision, created_at, created_by
from public.revisions
order by created_at desc
limit 20;


-- IBS Enterprise System Design Studio
-- Relational persistence with clean table names (no project_ prefix).
-- Run after SUPABASE-SETUP.sql.
-- Existing project_* relational tables are renamed automatically when possible.

create extension if not exists pgcrypto;

-- The relational version does NOT store the whole IBS project in public.projects.
-- Older IBS schemas may have a required data/project_data column. Make those
-- legacy columns nullable so the projects parent row can contain only metadata.
do $$
begin
  if to_regclass('public.projects') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='data') then
      alter table public.projects alter column data drop not null;
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='project_data') then
      alter table public.projects alter column project_data drop not null;
    end if;
  end if;
end $$;

-- ============================================================
-- 1. RENAME OLD RELATIONAL TABLES
-- ============================================================
do $$
declare
  pair record;
begin
  for pair in
    select * from (values
      ('project_modules','modules'),
      ('project_requirements','requirements'),
      ('project_screens','screens'),
      ('project_screen_components','screen_components'),
      ('project_entities','entities'),
      ('project_entity_fields','entity_fields'),
      ('project_relations','relations'),
      ('project_apis','apis'),
      ('project_logic','logic'),
      ('project_timeline','timeline'),
      ('project_references','references'),
      ('project_users','users'),
      ('project_roles','roles'),
      ('project_permissions','permissions'),
      ('project_module_access','module_access'),
      ('project_settings','settings'),
      ('project_revisions','revisions')
    ) as x(old_name,new_name)
  loop
    if to_regclass('public.' || pair.old_name) is not null
       and to_regclass('public.' || pair.new_name) is null then
      execute format('alter table public.%I rename to %I', pair.old_name, pair.new_name);
    end if;
  end loop;
end $$;

-- ============================================================
-- 2. REVISIONS
-- ============================================================
create table if not exists public.revisions (
  id bigint generated always as identity primary key,
  project_id text not null references public.projects(id) on delete cascade,
  revision bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.revisions add column if not exists revision bigint;
alter table public.revisions add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.revisions add column if not exists created_at timestamptz not null default now();
alter table public.revisions add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists revisions_project_idx
  on public.revisions(project_id, revision desc);

-- ============================================================
-- 3. RELATIONAL TABLES
-- ============================================================
create table if not exists public.modules (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  name text,
  icon text,
  color text,
  description text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.requirements (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  title text,
  actor text,
  priority text,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.screens (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  name text,
  type text,
  status text,
  description text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.screen_components (
  project_id text not null references public.projects(id) on delete cascade,
  screen_id text not null,
  id text not null,
  type text,
  label text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,screen_id,id),
  foreign key(project_id,screen_id) references public.screens(project_id,id) on delete cascade
);

create table if not exists public.entities (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  name text,
  module_id text,
  x numeric,
  y numeric,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.entity_fields (
  project_id text not null references public.projects(id) on delete cascade,
  entity_id text not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,entity_id,name),
  foreign key(project_id,entity_id) references public.entities(project_id,id) on delete cascade
);

create table if not exists public.relations (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  from_entity text,
  to_entity text,
  from_field text,
  to_field text,
  cardinality text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.apis (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  method text,
  path text,
  name text,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.logic (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  name text,
  trigger text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.timeline (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  name text,
  status text,
  start_date date,
  end_date date,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public."references" (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  module_id text,
  screen_id text,
  type text,
  title text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.users (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  username text,
  display_name text,
  role text,
  active boolean,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.roles (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  name text,
  description text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,id)
);

create table if not exists public.permissions (
  project_id text not null references public.projects(id) on delete cascade,
  permission text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,permission)
);

create table if not exists public.module_access (
  project_id text not null references public.projects(id) on delete cascade,
  module_id text not null,
  role text not null,
  allowed boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(project_id,module_id,role)
);

create table if not exists public.settings (
  project_id text primary key references public.projects(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3A. COMPATIBILITY MIGRATION FOR EXISTING TABLES
-- ============================================================
-- The IBS database may have been created by an older version of this script.
-- CREATE TABLE IF NOT EXISTS does not add columns to an existing table, so
-- explicitly add every relational column required by the current application.
-- This is what keeps the direct REST table saves working after an upgrade.

alter table public.modules add column if not exists name text;
alter table public.modules add column if not exists icon text;
alter table public.modules add column if not exists color text;
alter table public.modules add column if not exists description text;
alter table public.modules add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.modules add column if not exists updated_at timestamptz not null default now();

alter table public.requirements add column if not exists module_id text;
alter table public.requirements add column if not exists title text;
alter table public.requirements add column if not exists actor text;
alter table public.requirements add column if not exists priority text;
alter table public.requirements add column if not exists status text;
alter table public.requirements add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.requirements add column if not exists updated_at timestamptz not null default now();

alter table public.screens add column if not exists module_id text;
alter table public.screens add column if not exists name text;
alter table public.screens add column if not exists type text;
alter table public.screens add column if not exists status text;
alter table public.screens add column if not exists description text;
alter table public.screens add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.screens add column if not exists updated_at timestamptz not null default now();

alter table public.screen_components add column if not exists type text;
alter table public.screen_components add column if not exists label text;
alter table public.screen_components add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.screen_components add column if not exists updated_at timestamptz not null default now();

alter table public.entities add column if not exists name text;
alter table public.entities add column if not exists module_id text;
alter table public.entities add column if not exists x numeric;
alter table public.entities add column if not exists y numeric;
alter table public.entities add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.entities add column if not exists updated_at timestamptz not null default now();

alter table public.entity_fields add column if not exists name text;
alter table public.entity_fields add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.entity_fields add column if not exists updated_at timestamptz not null default now();

-- Older installations may have entity_fields without the name column.
-- Backfill it from the row JSON, then make it usable as the natural key
-- used by the direct REST save code.
update public.entity_fields
set name = coalesce(nullif(trim(name), ''), nullif(trim(data->>'name'), ''), 'field_' || md5(project_id || ':' || entity_id || ':' || ctid::text))
where name is null or trim(name) = '';

alter table public.entity_fields alter column name set not null;
create unique index if not exists entity_fields_project_entity_name_uidx
  on public.entity_fields(project_id, entity_id, name);

alter table public.relations add column if not exists from_entity text;
alter table public.relations add column if not exists to_entity text;
alter table public.relations add column if not exists from_field text;
alter table public.relations add column if not exists to_field text;
alter table public.relations add column if not exists cardinality text;
alter table public.relations add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.relations add column if not exists updated_at timestamptz not null default now();

alter table public.apis add column if not exists module_id text;
alter table public.apis add column if not exists method text;
alter table public.apis add column if not exists path text;
alter table public.apis add column if not exists name text;
alter table public.apis add column if not exists status text;
alter table public.apis add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.apis add column if not exists updated_at timestamptz not null default now();

alter table public.logic add column if not exists module_id text;
alter table public.logic add column if not exists name text;
alter table public.logic add column if not exists trigger text;
alter table public.logic add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.logic add column if not exists updated_at timestamptz not null default now();

alter table public.timeline add column if not exists module_id text;
alter table public.timeline add column if not exists name text;
alter table public.timeline add column if not exists status text;
alter table public.timeline add column if not exists start_date date;
alter table public.timeline add column if not exists end_date date;
alter table public.timeline add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.timeline add column if not exists updated_at timestamptz not null default now();

alter table public."references" add column if not exists module_id text;
alter table public."references" add column if not exists screen_id text;
alter table public."references" add column if not exists type text;
alter table public."references" add column if not exists title text;
alter table public."references" add column if not exists data jsonb not null default '{}'::jsonb;
alter table public."references" add column if not exists updated_at timestamptz not null default now();

alter table public.users add column if not exists username text;
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists role text;
alter table public.users add column if not exists active boolean;
alter table public.users add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.roles add column if not exists name text;
alter table public.roles add column if not exists description text;
alter table public.roles add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.roles add column if not exists updated_at timestamptz not null default now();

alter table public.permissions add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.permissions add column if not exists updated_at timestamptz not null default now();

alter table public.module_access add column if not exists allowed boolean not null default true;
alter table public.module_access add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.module_access add column if not exists updated_at timestamptz not null default now();

alter table public.settings add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.settings add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- 4. INDEXES
-- ============================================================
create index if not exists requirements_module_idx on public.requirements(project_id,module_id);
create index if not exists screens_module_idx on public.screens(project_id,module_id);
create index if not exists entities_module_idx on public.entities(project_id,module_id);
create index if not exists apis_module_idx on public.apis(project_id,module_id);
create index if not exists logic_module_idx on public.logic(project_id,module_id);
create index if not exists timeline_module_idx on public.timeline(project_id,module_id);
create index if not exists references_module_idx on public."references"(project_id,module_id);

-- ============================================================
-- 5. RLS / SHARED WORKSPACE
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'modules','requirements','screens','screen_components','entities',
    'entity_fields','relations','apis','logic','timeline','references',
    'users','roles','permissions','module_access','settings','revisions'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "public shared %s" on public.%I',t,t);
    execute format(
      'create policy "public shared %s" on public.%I for all to anon, authenticated using (project_id = ''ERP-DESIGN-001'') with check (project_id = ''ERP-DESIGN-001'')',
      t,t
    );
    execute format('grant select, insert, update, delete on table public.%I to anon, authenticated',t);
  end loop;
end $$;

insert into public.projects(id, revision)
values ('ERP-DESIGN-001',0)
on conflict (id) do nothing;

select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'projects','revisions','modules','requirements','screens','screen_components',
    'entities','entity_fields','relations','apis','logic','timeline','references',
    'users','roles','permissions','module_access','settings'
  )
order by table_name;

-- ============================================================
-- 6. ATOMIC IBS SAVE RPC
-- ============================================================
-- The browser calls this single function instead of making dozens of REST
-- requests. The function runs as one PostgreSQL transaction and distributes
-- the complete project JSON into the relational tables below.
-- It is SECURITY DEFINER so the public browser key does not need direct
-- INSERT/UPDATE permissions on every table. The function is restricted to
-- the single shared IBS project ID.

create or replace function public.save_ibs_project_relational(p_project jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id text := 'ERP-DESIGN-001';
  v_revision bigint;
  v_item jsonb;
  v_child jsonb;
  v_screen_id text;
  v_entity_id text;
  v_user jsonb;
  v_role jsonb;
  v_perm text;
  v_module_id text;
  v_role_name text;
  v_allowed boolean;
begin
  if p_project is null or jsonb_typeof(p_project) <> 'object' then
    raise exception 'p_project must be a JSON object';
  end if;

  -- Make sure the project master row exists and determine the next revision.
  select revision into v_revision
  from public.projects
  where id = v_project_id
  for update;

  if not found then
    v_revision := 1;
    insert into public.projects(id, revision, updated_at)
    values(v_project_id, v_revision, now());
  else
    v_revision := coalesce(v_revision,0) + 1;
    update public.projects
       set revision = v_revision,
           updated_at = now(),
           updated_by = null
     where id = v_project_id;
  end if;

  -- Clear the current relational representation. Foreign keys cascade the
  -- nested screen/component and entity/field rows.
  delete from public.screen_components where project_id=v_project_id;
  delete from public.entity_fields where project_id=v_project_id;
  delete from public.modules where project_id=v_project_id;
  delete from public.requirements where project_id=v_project_id;
  delete from public.screens where project_id=v_project_id;
  delete from public.entities where project_id=v_project_id;
  delete from public.relations where project_id=v_project_id;
  delete from public.apis where project_id=v_project_id;
  delete from public.logic where project_id=v_project_id;
  delete from public.timeline where project_id=v_project_id;
  delete from public."references" where project_id=v_project_id;
  delete from public.users where project_id=v_project_id;
  delete from public.roles where project_id=v_project_id;
  delete from public.permissions where project_id=v_project_id;
  delete from public.module_access where project_id=v_project_id;
  delete from public.settings where project_id=v_project_id;

  -- Modules
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'modules','[]'::jsonb)) loop
    insert into public.modules(project_id,id,name,icon,color,description,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'name',v_item->>'icon',v_item->>'color',v_item->>'description',v_item,now());
  end loop;

  -- Requirements
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'requirements','[]'::jsonb)) loop
    insert into public.requirements(project_id,id,module_id,title,actor,priority,status,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'title',v_item->>'actor',v_item->>'priority',v_item->>'status',v_item,now());
  end loop;

  -- Screens and their nested components
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'screens','[]'::jsonb)) loop
    v_screen_id := v_item->>'id';
    insert into public.screens(project_id,id,module_id,name,type,status,description,data,updated_at)
    values(v_project_id,v_screen_id,v_item->>'moduleId',v_item->>'name',v_item->>'type',v_item->>'status',v_item->>'description',v_item,now());
    for v_child in select value from jsonb_array_elements(coalesce(v_item->'components','[]'::jsonb)) loop
      insert into public.screen_components(project_id,screen_id,id,type,label,data,updated_at)
      values(v_project_id,v_screen_id,v_child->>'id',v_child->>'type',v_child->>'label',v_child,now());
    end loop;
  end loop;

  -- Entities and their nested fields
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'entities','[]'::jsonb)) loop
    v_entity_id := v_item->>'id';
    insert into public.entities(project_id,id,name,module_id,x,y,data,updated_at)
    values(v_project_id,v_entity_id,v_item->>'name',v_item->>'moduleId',
           case when v_item->>'x' is null or v_item->>'x'='' then null else (v_item->>'x')::numeric end,
           case when v_item->>'y' is null or v_item->>'y'='' then null else (v_item->>'y')::numeric end,
           v_item,now());
    for v_child in select value from jsonb_array_elements(coalesce(v_item->'fields','[]'::jsonb)) loop
      insert into public.entity_fields(project_id,entity_id,name,data,updated_at)
      values(v_project_id,v_entity_id,v_child->>'name',v_child,now());
    end loop;
  end loop;

  -- Relationships
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'relations','[]'::jsonb)) loop
    insert into public.relations(project_id,id,from_entity,to_entity,from_field,to_field,cardinality,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'from',v_item->>'to',v_item->>'fromField',v_item->>'toField',v_item->>'cardinality',v_item,now());
  end loop;

  -- APIs
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'apis','[]'::jsonb)) loop
    insert into public.apis(project_id,id,module_id,method,path,name,status,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'method',v_item->>'path',v_item->>'name',v_item->>'status',v_item,now());
  end loop;

  -- Backend logic / workflows (steps remain in data JSONB)
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'logic','[]'::jsonb)) loop
    insert into public.logic(project_id,id,module_id,name,trigger,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'name',v_item->>'trigger',v_item,now());
  end loop;

  -- Timeline / plan
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'timeline','[]'::jsonb)) loop
    insert into public.timeline(project_id,id,module_id,name,status,start_date,end_date,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'name',v_item->>'status',
      case when coalesce(v_item->>'start','')='' then null else (v_item->>'start')::date end,
      case when coalesce(v_item->>'end','')='' then null else (v_item->>'end')::date end,
      v_item,now());
  end loop;

  -- Reference images / references
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'references','[]'::jsonb)) loop
    insert into public."references"(project_id,id,module_id,screen_id,type,title,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'screenId',v_item->>'type',v_item->>'title',v_item,now());
  end loop;

  -- Settings
  insert into public.settings(project_id,data,updated_at)
  values(v_project_id,coalesce(p_project->'settings','{}'::jsonb),now());

  -- Security: users, roles, permissions, module access
  for v_user in select value from jsonb_array_elements(coalesce(p_project->'security'->'users','[]'::jsonb)) loop
    insert into public.users(project_id,id,username,display_name,role,active,data,updated_at)
    values(v_project_id,v_user->>'id',v_user->>'username',v_user->>'displayName',v_user->>'role',coalesce((v_user->>'active')::boolean,true),v_user,now());
  end loop;

  for v_role in select value from jsonb_array_elements(coalesce(p_project->'security'->'roles','[]'::jsonb)) loop
    insert into public.roles(project_id,id,name,description,data,updated_at)
    values(v_project_id,v_role->>'id',v_role->>'name',v_role->>'description',v_role,now());
  end loop;

  for v_perm in select value::text from jsonb_array_elements_text(coalesce(p_project->'security'->'permissions','[]'::jsonb)) loop
    insert into public.permissions(project_id,permission,data,updated_at)
    values(v_project_id,v_perm,jsonb_build_object('permission',v_perm),now());
  end loop;

  for v_module_id,v_role_name,v_allowed in
    select m.key, r.key, case when jsonb_typeof(r.value)='boolean' then (r.value)::boolean else true end
    from jsonb_each(coalesce(p_project->'security'->'moduleAccess','{}'::jsonb)) m
    cross join lateral jsonb_each(coalesce(m.value,'{}'::jsonb)) r
  loop
    insert into public.module_access(project_id,module_id,role,allowed,data,updated_at)
    values(v_project_id,v_module_id,v_role_name,v_allowed,
           jsonb_build_object('moduleId',v_module_id,'role',v_role_name,'allowed',v_allowed),now());
  end loop;

  return jsonb_build_object(
    'ok',true,
    'project_id',v_project_id,
    'revision',v_revision,
    'saved_at',now(),
    'tables_saved',jsonb_build_array(
      'projects','modules','requirements','screens','screen_components','entities','entity_fields',
      'relations','apis','logic','timeline','references','settings','users','roles','permissions','module_access'
    )
  );
end;
$$;

grant execute on function public.save_ibs_project_relational(jsonb) to anon, authenticated;

-- ============================================================
-- 7. VERIFY THE SAVE RPC
-- ============================================================
select routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name='save_ibs_project_relational';

-- ============================================================
-- 8. FINAL VERIFICATION
-- ============================================================
-- The application must save through save_ibs_project_relational(jsonb).
-- No application code should write projects.data or projects.project_data.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema='public'
  and table_name in (
    'projects','modules','requirements','screens','screen_components',
    'entities','entity_fields','relations','apis','logic','timeline',
    'references','users','roles','permissions','module_access','settings'
  )
  and column_name in (
    'id','project_id','entity_id','name','module_id','screen_id','revision','updated_at'
  )
order by table_name, ordinal_position;

select
  routine_name,
  routine_type
from information_schema.routines
where routine_schema='public'
  and routine_name='save_ibs_project_relational';


-- ============================================================
-- v13 SECURITY, FIELD SOURCE, COMMENTS & AUDIT HARDENING
-- ============================================================
-- This section intentionally runs LAST so it overrides the older
-- shared/anonymous prototype policies. The static site is now
-- authentication-only and every write is attributable to auth.uid().

create table if not exists public.role_permissions (
  role text not null,
  permission text not null,
  allowed boolean not null default true,
  primary key(role,permission)
);

create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'Viewer',
  active boolean not null default true,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_module_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  allowed boolean not null default true,
  primary key(user_id,module_id)
);

create table if not exists public.user_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null,
  allowed boolean not null default true,
  primary key(user_id,permission)
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  project_id text not null default 'ERP-DESIGN-001',
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_name text,
  action text not null,
  object_type text,
  object_id text,
  module_id text,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  project_id text not null default 'ERP-DESIGN-001',
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_name text,
  object_type text not null,
  object_id text not null,
  module_id text,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_project_time_idx on public.audit_log(project_id,changed_at desc);
create index if not exists audit_log_actor_idx on public.audit_log(actor_id,changed_at desc);
create index if not exists comments_object_idx on public.comments(project_id,object_type,object_id,created_at desc);

insert into public.role_permissions(role,permission,allowed) values
('Administrator','PROJECT.EDIT',true),('Administrator','MODULE.EDIT',true),
('Administrator','REQUIREMENT.EDIT',true),('Administrator','SCREEN.EDIT',true),
('Administrator','ERD.EDIT',true),('Administrator','API.EDIT',true),
('Administrator','LOGIC.EDIT',true),('Administrator','TIMELINE.EDIT',true),
('Administrator','REFERENCE.EDIT',true),('Administrator','SECURITY.EDIT',true),
('Architect','PROJECT.EDIT',true),('Architect','MODULE.EDIT',true),
('Architect','REQUIREMENT.EDIT',true),('Architect','SCREEN.EDIT',true),
('Architect','ERD.EDIT',true),('Architect','API.EDIT',true),
('Architect','LOGIC.EDIT',true),('Architect','TIMELINE.EDIT',true),
('Architect','REFERENCE.EDIT',true),
('Designer','REQUIREMENT.EDIT',true),('Designer','SCREEN.EDIT',true),
('Designer','REFERENCE.EDIT',true),('Designer','MODULE.EDIT',true),
('Viewer','PROJECT.VIEW',true),('Viewer','MODULE.VIEW',true),
('Viewer','REQUIREMENT.VIEW',true),('Viewer','SCREEN.VIEW',true),
('Viewer','ERD.VIEW',true),('Viewer','API.VIEW',true)
on conflict(role,permission) do update set allowed=excluded.allowed;

-- Admin bootstrap is controlled through Supabase Auth app_metadata.
-- Set app_metadata.role = Administrator for the first administrator.
create or replace function public.ibs_role()
returns text
language plpgsql
stable
security definer
set search_path=public
as $$
declare v_role text;
begin
  if auth.uid() is null then return 'Viewer'; end if;
  select role into v_role from public.user_access where user_id=auth.uid() and active=true;
  if v_role is not null then return v_role; end if;
  -- Safe bootstrap: when no user_access rows exist, the first authenticated
  -- user is the administrator. Once the admin creates mappings, unmapped users
  -- become Viewer by default.
  if not exists(select 1 from public.user_access) then return 'Administrator'; end if;
  return coalesce(auth.jwt()->'app_metadata'->>'role','Viewer');
end $$;

create or replace function public.ibs_is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select auth.uid() is not null and public.ibs_role()='Administrator'
$$;

create or replace function public.ibs_can(p_permission text)
returns boolean
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_role text := public.ibs_role();
begin
  if auth.uid() is null then return false; end if;
  if v_role='Administrator' then return true; end if;
  if exists(select 1 from public.user_access where user_id=auth.uid() and active=false) then return false; end if;
  if exists(select 1 from public.user_permissions where user_id=auth.uid() and permission=p_permission and allowed) then return true; end if;
  return exists(select 1 from public.role_permissions where role=v_role and permission=p_permission and allowed);
end $$;

create or replace function public.ibs_module_allowed(p_module_id text)
returns boolean
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then return false; end if;
  if public.ibs_is_admin() then return true; end if;
  if exists(select 1 from public.user_module_access where user_id=auth.uid() and module_id=p_module_id and allowed) then return true; end if;
  return exists(
    select 1 from public.module_access ma
    where ma.project_id='ERP-DESIGN-001'
      and ma.module_id=p_module_id
      and ma.role=public.ibs_role()
      and ma.allowed
  );
end $$;

create or replace function public.ibs_audit_row()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_new jsonb := case when TG_OP='DELETE' then null else to_jsonb(NEW) end;
  v_old jsonb := case when TG_OP='INSERT' then null else to_jsonb(OLD) end;
  v_project text := coalesce(v_new->>'project_id',v_old->>'project_id',
                             case when TG_TABLE_NAME='projects' then coalesce(v_new->>'id',v_old->>'id') end,
                             'ERP-DESIGN-001');
  v_module text := coalesce(v_new->>'module_id',v_old->>'module_id');
  v_id text := coalesce(v_new->>'id',v_old->>'id');
  v_email text := coalesce(auth.jwt()->>'email','');
  v_name text := coalesce(auth.jwt()->'user_metadata'->>'displayName',auth.jwt()->'user_metadata'->>'display_name',v_email);
begin
  insert into public.audit_log(project_id,actor_id,actor_email,actor_name,action,object_type,object_id,module_id,old_data,new_data,metadata)
  values(v_project,auth.uid(),v_email,v_name,TG_OP,TG_TABLE_NAME,v_id,v_module,v_old,v_new,
    jsonb_build_object('source','database_trigger','table',TG_TABLE_NAME));
  return coalesce(NEW,OLD);
end $$;

-- Recreate audit triggers on all business tables. The audit trigger records
-- INSERT/UPDATE/DELETE, actor, timestamp, module and before/after JSON.
do $$
declare t text;
begin
  foreach t in array array['projects','modules','requirements','screens','screen_components','entities','entity_fields','relations','apis','logic','timeline','references','users','roles','permissions','module_access','settings'] loop
    execute format('drop trigger if exists %I on public.%I', 'trg_ibs_audit_' || t, t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.ibs_audit_row()', 'trg_ibs_audit_' || t, t);
  end loop;
end $$;

-- Remove anonymous access. Authenticated users can only see project data;
-- writes are performed through the protected transaction below.
do $$
declare t text;
begin
  foreach t in array ARRAY['projects','revisions','modules','requirements','screens','screen_components','entities','entity_fields','relations','apis','logic','timeline','references','users','roles','permissions','module_access','settings'] loop
    execute format('drop policy if exists "public shared %s" on public.%I',t,t);
    execute format('drop policy if exists "authenticated project access %s" on public.%I',t,t);
    if t='projects' then
      execute 'create policy "authenticated project access projects" on public.projects for select to authenticated using (id=''ERP-DESIGN-001'')';
    else
      execute format('create policy "authenticated project access %s" on public.%I for select to authenticated using (project_id=''ERP-DESIGN-001'')',t,t);
    end if;
    execute format('revoke insert, update, delete on table public.%I from anon',t);
    execute format('revoke insert, update, delete on table public.%I from authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
  end loop;
end $$;

alter table public.role_permissions enable row level security;
alter table public.user_access enable row level security;
alter table public.user_module_access enable row level security;
alter table public.user_permissions enable row level security;
alter table public.audit_log enable row level security;
alter table public.comments enable row level security;

drop policy if exists "authenticated own access" on public.user_access;
create policy "authenticated own access" on public.user_access for select to authenticated using(user_id=auth.uid() or public.ibs_is_admin());
drop policy if exists "authenticated own module access" on public.user_module_access;
create policy "authenticated own module access" on public.user_module_access for select to authenticated using(user_id=auth.uid() or public.ibs_is_admin());
drop policy if exists "authenticated own permissions" on public.user_permissions;
create policy "authenticated own permissions" on public.user_permissions for select to authenticated using(user_id=auth.uid() or public.ibs_is_admin());
drop policy if exists "authenticated role permissions read" on public.role_permissions;
create policy "authenticated role permissions read" on public.role_permissions for select to authenticated using(true);
drop policy if exists "authenticated audit read" on public.audit_log;
create policy "authenticated audit read" on public.audit_log for select to authenticated using(project_id='ERP-DESIGN-001');
drop policy if exists "authenticated comments read" on public.comments;
create policy "authenticated comments read" on public.comments for select to authenticated using(project_id='ERP-DESIGN-001');

grant select on public.role_permissions,public.user_access,public.user_module_access,public.user_permissions,public.audit_log,public.comments to authenticated;
revoke all on public.audit_log from anon;
revoke all on public.comments from anon;

-- The old RPC is replaced with a protected wrapper implementation. It accepts
-- the complete project snapshot, but refuses unauthenticated users, viewers,
-- unauthorized security changes, and edits outside the caller's role.
create or replace function public.save_ibs_project_relational(p_project jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_project_id text := 'ERP-DESIGN-001';
  v_revision bigint;
  v_old jsonb;
  v_role text := public.ibs_role();
  v_user jsonb;
  v_item jsonb;
  v_child jsonb;
  v_screen_id text;
  v_entity_id text;
  v_module_id text;
  v_role_name text;
  v_allowed boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_project is null or jsonb_typeof(p_project) <> 'object' then raise exception 'p_project must be a JSON object'; end if;

  select coalesce(data,'{}'::jsonb),revision into v_old,v_revision
  from public.projects where id=v_project_id for update;

  if v_role='Viewer' and v_revision is not null then raise exception 'Viewer accounts are read-only'; end if;

  -- Security configuration is administrator-only.
  if (p_project->'security') is distinct from (v_old->'security') and not public.ibs_can('SECURITY.EDIT') then
    raise exception 'SECURITY.EDIT permission required';
  end if;

  -- Top-level permission gates. Only changed sections are checked.
  if (p_project->'project') is distinct from (v_old->'project') and not public.ibs_can('PROJECT.EDIT') then raise exception 'PROJECT.EDIT permission required'; end if;
  if (p_project->'modules') is distinct from (v_old->'modules') and not public.ibs_can('MODULE.EDIT') then raise exception 'MODULE.EDIT permission required'; end if;
  if (p_project->'requirements') is distinct from (v_old->'requirements') and not public.ibs_can('REQUIREMENT.EDIT') then raise exception 'REQUIREMENT.EDIT permission required'; end if;
  if (p_project->'screens') is distinct from (v_old->'screens') and not public.ibs_can('SCREEN.EDIT') then raise exception 'SCREEN.EDIT permission required'; end if;
  if ((p_project->'entities') is distinct from (v_old->'entities') or p_project->'relations' is distinct from (v_old->'relations')) and not public.ibs_can('ERD.EDIT') then raise exception 'ERD.EDIT permission required'; end if;
  if (p_project->'apis') is distinct from (v_old->'apis') and not public.ibs_can('API.EDIT') then raise exception 'API.EDIT permission required'; end if;
  if (p_project->'logic') is distinct from (v_old->'logic') and not public.ibs_can('LOGIC.EDIT') then raise exception 'LOGIC.EDIT permission required'; end if;
  if (p_project->'timeline') is distinct from (v_old->'timeline') and not public.ibs_can('TIMELINE.EDIT') then raise exception 'TIMELINE.EDIT permission required'; end if;
  if (p_project->'references') is distinct from (v_old->'references') and not public.ibs_can('REFERENCE.EDIT') then raise exception 'REFERENCE.EDIT permission required'; end if;

  -- Module-level enforcement: changed records must belong to a module the
  -- caller is allowed to edit. Security/admin bypasses this check.
  if not public.ibs_is_admin() then
    for v_item in select value from jsonb_array_elements(coalesce(p_project->'requirements','[]'::jsonb)) loop
      if (select x from jsonb_array_elements(coalesce(v_old->'requirements','[]'::jsonb)) x where x->>'id'=v_item->>'id' limit 1) is distinct from v_item then
        if v_item->>'moduleId' is not null and not public.ibs_module_allowed(v_item->>'moduleId') then raise exception 'Module access denied for requirement %',v_item->>'id'; end if;
      end if;
    end loop;
    for v_item in select value from jsonb_array_elements(coalesce(p_project->'screens','[]'::jsonb)) loop
      if (select x from jsonb_array_elements(coalesce(v_old->'screens','[]'::jsonb)) x where x->>'id'=v_item->>'id' limit 1) is distinct from v_item then
        if v_item->>'moduleId' is not null and not public.ibs_module_allowed(v_item->>'moduleId') then raise exception 'Module access denied for screen %',v_item->>'id'; end if;
      end if;
    end loop;
    for v_item in select value from jsonb_array_elements(coalesce(p_project->'entities','[]'::jsonb)) loop
      if (select x from jsonb_array_elements(coalesce(v_old->'entities','[]'::jsonb)) x where x->>'id'=v_item->>'id' limit 1) is distinct from v_item then
        if v_item->>'moduleId' is not null and not public.ibs_module_allowed(v_item->>'moduleId') then raise exception 'Module access denied for entity %',v_item->>'id'; end if;
      end if;
    end loop;
  end if;

  -- Preserve the original atomic distribution logic from the prior build by
  -- delegating to an internal implementation would be ideal; the website still
  -- sends the same normalized project JSON. This function therefore writes the
  -- complete relational snapshot directly below.

  if v_revision is null then
    v_revision:=1;
    insert into public.projects(id,data,revision,updated_at,updated_by)
    values(v_project_id,p_project,v_revision,now(),auth.uid())
    on conflict(id) do update set data=excluded.data,revision=excluded.revision,updated_at=excluded.updated_at,updated_by=excluded.updated_by;
  else
    v_revision:=v_revision+1;
    update public.projects set data=p_project,revision=v_revision,updated_at=now(),updated_by=auth.uid() where id=v_project_id;
  end if;

  -- The relational rows are synchronized from the exact project snapshot.
  delete from public.screen_components where project_id=v_project_id;
  delete from public.entity_fields where project_id=v_project_id;
  delete from public.modules where project_id=v_project_id;
  delete from public.requirements where project_id=v_project_id;
  delete from public.screens where project_id=v_project_id;
  delete from public.entities where project_id=v_project_id;
  delete from public.relations where project_id=v_project_id;
  delete from public.apis where project_id=v_project_id;
  delete from public.logic where project_id=v_project_id;
  delete from public.timeline where project_id=v_project_id;
  delete from public."references" where project_id=v_project_id;
  delete from public.users where project_id=v_project_id;
  delete from public.roles where project_id=v_project_id;
  delete from public.permissions where project_id=v_project_id;
  delete from public.module_access where project_id=v_project_id;
  delete from public.settings where project_id=v_project_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_project->'modules','[]'::jsonb)) loop
    insert into public.modules(project_id,id,name,icon,color,description,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'name',v_item->>'icon',v_item->>'color',v_item->>'description',v_item,now());
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'requirements','[]'::jsonb)) loop
    insert into public.requirements(project_id,id,module_id,title,actor,priority,status,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'title',v_item->>'actor',v_item->>'priority',v_item->>'status',v_item,now());
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'screens','[]'::jsonb)) loop
    v_screen_id:=v_item->>'id';
    insert into public.screens(project_id,id,module_id,name,type,status,description,data,updated_at)
    values(v_project_id,v_screen_id,v_item->>'moduleId',v_item->>'name',v_item->>'type',v_item->>'status',v_item->>'description',v_item,now());
    for v_child in select value from jsonb_array_elements(coalesce(v_item->'components','[]'::jsonb)) loop
      insert into public.screen_components(project_id,screen_id,id,type,label,data,updated_at)
      values(v_project_id,v_screen_id,v_child->>'id',v_child->>'type',v_child->>'label',v_child,now());
    end loop;
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'entities','[]'::jsonb)) loop
    v_entity_id:=v_item->>'id';
    insert into public.entities(project_id,id,name,module_id,x,y,data,updated_at)
    values(v_project_id,v_entity_id,v_item->>'name',v_item->>'moduleId',(v_item->>'x')::numeric,(v_item->>'y')::numeric,v_item,now());
    for v_child in select value from jsonb_array_elements(coalesce(v_item->'fields','[]'::jsonb)) loop
      insert into public.entity_fields(project_id,entity_id,name,data,updated_at)
      values(v_project_id,v_entity_id,v_child->>'name',v_child,now());
    end loop;
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'relations','[]'::jsonb)) loop
    insert into public.relations(project_id,id,from_entity,to_entity,from_field,to_field,cardinality,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'from',v_item->>'to',v_item->>'fromField',v_item->>'toField',v_item->>'cardinality',v_item,now());
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'apis','[]'::jsonb)) loop
    insert into public.apis(project_id,id,module_id,method,path,name,status,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'method',v_item->>'path',v_item->>'name',v_item->>'status',v_item,now());
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'logic','[]'::jsonb)) loop
    insert into public.logic(project_id,id,module_id,name,trigger,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'name',v_item->>'trigger',v_item,now());
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'timeline','[]'::jsonb)) loop
    insert into public.timeline(project_id,id,module_id,name,status,start_date,end_date,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'name',v_item->>'status',(v_item->>'start')::date,(v_item->>'end')::date,v_item,now());
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'references','[]'::jsonb)) loop
    insert into public."references"(project_id,id,module_id,screen_id,type,title,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'moduleId',v_item->>'screenId',v_item->>'type',v_item->>'title',v_item,now());
  end loop;
  for v_item in select value from jsonb_array_elements(coalesce(p_project->'security'->'users','[]'::jsonb)) loop
    insert into public.users(project_id,id,username,display_name,role,active,data,updated_at)
    values(v_project_id,v_item->>'id',v_item->>'username',v_item->>'displayName',v_item->>'role',(v_item->>'active')::boolean,v_item,now());
  end loop;
  for v_role in select value from jsonb_array_elements(coalesce(p_project->'security'->'roles','[]'::jsonb)) loop
    insert into public.roles(project_id,id,name,description,data,updated_at)
    values(v_project_id,v_role->>'id',v_role->>'name',v_role->>'description',v_role,now());
  end loop;
  for v_perm in select value::text from jsonb_array_elements_text(coalesce(p_project->'security'->'permissions','[]'::jsonb)) loop
    insert into public.permissions(project_id,permission,data,updated_at)
    values(v_project_id,v_perm, jsonb_build_object('permission',v_perm),now());
  end loop;
  for v_module_id,v_role_name,v_allowed in
    select a.key,r.key,(r.value)::boolean
    from jsonb_each(coalesce(p_project->'security'->'moduleAccess','{}'::jsonb)) a
    cross join lateral jsonb_each_text(a.value) r
  loop
    insert into public.module_access(project_id,module_id,role,allowed,data,updated_at)
    values(v_project_id,v_module_id,v_role_name,v_allowed,jsonb_build_object('allowed',v_allowed),now());
  end loop;
  insert into public.settings(project_id,data,updated_at)
  values(v_project_id,coalesce(p_project->'settings','{}'::jsonb),now())
  on conflict(project_id) do update set data=excluded.data,updated_at=now();

  insert into public.revisions(project_id,revision,data,created_at,created_by)
  values(v_project_id,v_revision,p_project,now(),auth.uid());

  return jsonb_build_object('ok',true,'revision',v_revision,'updated_by',auth.uid());
end $$;

revoke all on function public.save_ibs_project_relational(jsonb) from public;
revoke all on function public.save_ibs_project_relational(jsonb) from anon;
grant execute on function public.save_ibs_project_relational(jsonb) to authenticated;

-- Comments are written through a small authenticated RPC so every comment has
-- a server-side author and timestamp.
create or replace function public.add_ibs_comment(p_object_type text,p_object_id text,p_module_id text,p_comment text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_email text := auth.jwt()->>'email';
  v_name text := coalesce(auth.jwt()->'user_metadata'->>'displayName',auth.jwt()->'user_metadata'->>'display_name',v_email);
  v_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.ibs_can('PROJECT.EDIT') and not public.ibs_can('COMMENT.CREATE') then raise exception 'Comment permission required'; end if;
  insert into public.comments(project_id,actor_id,actor_email,actor_name,object_type,object_id,module_id,comment)
  values('ERP-DESIGN-001',auth.uid(),v_email,v_name,p_object_type,p_object_id,p_module_id,p_comment)
  returning id into v_id;
  insert into public.audit_log(project_id,actor_id,actor_email,actor_name,action,object_type,object_id,module_id,new_data,metadata)
  values('ERP-DESIGN-001',auth.uid(),v_email,v_name,'COMMENT','comment',p_object_id,p_module_id,
         jsonb_build_object('comment',p_comment,'comment_id',v_id),jsonb_build_object('source','comment_rpc'));
  return jsonb_build_object('ok',true,'id',v_id,'author',v_name,'created_at',now());
end $$;

revoke all on function public.add_ibs_comment(text,text,text,text) from public;
revoke all on function public.add_ibs_comment(text,text,text,text) from anon;
grant execute on function public.add_ibs_comment(text,text,text,text) to authenticated;

-- Field-source metadata is stored inside screen_components.data and therefore
-- participates in both the relational snapshot and audit history.
-- USERNAME AUTHENTICATION + ADMIN USER MANAGEMENT
-- Run after SUPABASE-FIX-ALL.sql.
-- The browser displays usernames only. Supabase Auth internally uses a
-- non-email login identifier in the form username@ibs.local.

alter table public.user_access add column if not exists username text;
alter table public.user_access add column if not exists display_name text;
create unique index if not exists user_access_username_uq on public.user_access(lower(username)) where username is not null;

-- Keep the legacy relational project user table aligned with the Auth users.
-- Email is deliberately not part of the application identity.

create or replace function public.ibs_current_username()
returns text
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(
    (select ua.username from public.user_access ua where ua.user_id=auth.uid() limit 1),
    auth.jwt()->'user_metadata'->>'username',
    'user'
  )
$$;

create or replace function public.ibs_current_display_name()
returns text
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(
    (select ua.display_name from public.user_access ua where ua.user_id=auth.uid() limit 1),
    auth.jwt()->'user_metadata'->>'displayName',
    auth.jwt()->'user_metadata'->>'display_name',
    public.ibs_current_username()
  )
$$;

-- Recreate the audit trigger so the application records the person's name
-- and username. actor_email is retained only for backwards compatibility and
-- is intentionally blank for username-based application identities.
create or replace function public.ibs_audit_row()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_new jsonb := case when TG_OP='DELETE' then null else to_jsonb(NEW) end;
  v_old jsonb := case when TG_OP='INSERT' then null else to_jsonb(OLD) end;
  v_project text := coalesce(v_new->>'project_id',v_old->>'project_id',
                             case when TG_TABLE_NAME='projects' then coalesce(v_new->>'id',v_old->>'id') end,
                             'ERP-DESIGN-001');
  v_module text := coalesce(v_new->>'module_id',v_old->>'module_id');
  v_id text := coalesce(v_new->>'id',v_old->>'id');
  v_name text := public.ibs_current_display_name();
  v_username text := public.ibs_current_username();
begin
  insert into public.audit_log(project_id,actor_id,actor_email,actor_name,action,object_type,object_id,module_id,old_data,new_data,metadata)
  values(v_project,auth.uid(),null,v_name,TG_OP,TG_TABLE_NAME,v_id,v_module,v_old,v_new,
    jsonb_build_object('source','database_trigger','table',TG_TABLE_NAME,'username',v_username));
  return coalesce(NEW,OLD);
end $$;

do $$
declare t text;
begin
  foreach t in array array['projects','modules','requirements','screens','screen_components','entities','entity_fields','relations','apis','logic','timeline','references','users','roles','permissions','module_access','settings'] loop
    execute format('drop trigger if exists %I on public.%I', 'trg_ibs_audit_' || t, t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.ibs_audit_row()', 'trg_ibs_audit_' || t, t);
  end loop;
end $$;

create or replace function public.add_ibs_comment(p_object_type text,p_object_id text,p_module_id text,p_comment text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_name text := public.ibs_current_display_name();
  v_username text := public.ibs_current_username();
  v_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.ibs_can('PROJECT.EDIT') and not public.ibs_can('COMMENT.CREATE') then raise exception 'Comment permission required'; end if;
  insert into public.comments(project_id,actor_id,actor_email,actor_name,object_type,object_id,module_id,comment)
  values('ERP-DESIGN-001',auth.uid(),null,v_name,p_object_type,p_object_id,p_module_id,p_comment)
  returning id into v_id;
  insert into public.audit_log(project_id,actor_id,actor_email,actor_name,action,object_type,object_id,module_id,new_data,metadata)
  values('ERP-DESIGN-001',auth.uid(),null,v_name,'COMMENT','comment',p_object_id,p_module_id,
         jsonb_build_object('comment',p_comment,'comment_id',v_id),jsonb_build_object('source','comment_rpc','username',v_username));
  return jsonb_build_object('ok',true,'id',v_id,'author',v_name,'username',v_username,'created_at',now());
end $$;

revoke all on function public.add_ibs_comment(text,text,text,text) from public;
revoke all on function public.add_ibs_comment(text,text,text,text) from anon;
grant execute on function public.add_ibs_comment(text,text,text,text) to authenticated;


-- ============================================================
-- HARD-CODED ADMIN / USERNAME-ONLY MODE
-- This build intentionally has exactly one application identity:
-- username: admin
-- No application email field is used. Supabase Auth may retain its
-- internal identifier, but it is never requested/displayed by the app.
-- ============================================================

create or replace function public.ibs_role()
returns text
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_username text;
begin
  if auth.uid() is null then return 'Viewer'; end if;

  select lower(username) into v_username
  from public.user_access
  where user_id=auth.uid()
  limit 1;

  v_username := coalesce(v_username, lower(auth.jwt()->'user_metadata'->>'username'));

  if v_username = 'admin' then
    return 'Administrator';
  end if;

  return 'Viewer';
end $$;

create or replace function public.ibs_is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select auth.uid() is not null
     and lower(coalesce(
       (select ua.username from public.user_access ua where ua.user_id=auth.uid() limit 1),
       auth.jwt()->'user_metadata'->>'username',
       ''
     )) = 'admin'
$$;

-- Keep exactly one application user mapping if an existing project has
-- stale architect/viewer mappings. Do not delete Auth users here.
delete from public.user_access
where lower(coalesce(username,'')) <> 'admin';

-- Force the only mapped application identity to Administrator.
update public.user_access
set username='admin',
    display_name='System Administrator',
    role='Administrator',
    active=true
where lower(username)='admin';

-- The app never reads or writes actor email values.
update public.audit_log set actor_email=null;
update public.comments set actor_email=null;
