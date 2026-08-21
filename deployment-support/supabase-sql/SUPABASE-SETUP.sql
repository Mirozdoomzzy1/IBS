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
