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

    alter table public.projects add column if not exists data jsonb not null default '{}'::jsonb;
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
set revision = 0
where revision is null;

update public.projects
set updated_at = now()
where updated_at is null;

alter table public.projects
  alter column data set default '{}'::jsonb,
  alter column data set not null,
  alter column revision set default 0,
  alter column revision set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- ============================================================
-- 2. REVISION/BACKUP TABLE
-- ============================================================
create table if not exists public.project_revisions (
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
    where table_schema='public' and table_name='project_revisions' and column_name='version'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='project_revisions' and column_name='revision'
  ) then
    alter table public.project_revisions rename column version to revision;
  end if;
end $$;

alter table public.project_revisions add column if not exists revision bigint;
alter table public.project_revisions add column if not exists data jsonb;
alter table public.project_revisions add column if not exists created_at timestamptz not null default now();
alter table public.project_revisions add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists project_revisions_project_idx
  on public.project_revisions(project_id, revision desc);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;

drop policy if exists "authenticated can read projects" on public.projects;
drop policy if exists "authenticated can insert projects" on public.projects;
drop policy if exists "authenticated can update projects" on public.projects;
drop policy if exists "authenticated can read revisions" on public.project_revisions;

create policy "authenticated can read projects"
on public.projects for select
to authenticated
using (true);

create policy "authenticated can insert projects"
on public.projects for insert
to authenticated
with check (true);

create policy "authenticated can update projects"
on public.projects for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read revisions"
on public.project_revisions for select
to authenticated
using (true);

-- Explicit PostgREST privileges for the authenticated role.
-- RLS policies above control which rows may be accessed.
grant usage on schema public to authenticated;
grant select, insert, update on table public.projects to authenticated;
grant select on table public.project_revisions to authenticated;

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
    insert into public.project_revisions(project_id, revision, data, created_by)
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
create or replace function public.ibs_cleanup_project_revisions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.project_revisions
  where id in (
    select id
    from public.project_revisions
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
for each row execute function public.ibs_cleanup_project_revisions();

-- ============================================================
-- 6. OPTIONAL: CREATE THE INITIAL PROJECT ROW
-- ============================================================
-- The website can also create it automatically on first save.
-- Leave this commented unless you want an explicit initial row.
-- insert into public.projects(id, data, revision)
-- values ('ibs-main-project', '{}'::jsonb, 0)
-- on conflict (id) do nothing;

-- ============================================================
-- 7. VERIFY
-- ============================================================
select id, revision, updated_at, updated_by
from public.projects
order by updated_at desc;

select project_id, revision, created_at, created_by
from public.project_revisions
order by created_at desc
limit 20;
