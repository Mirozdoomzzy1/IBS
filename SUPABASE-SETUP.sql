-- IBS / Enterprise System Design Studio - Supabase setup
-- Run this entire script in Supabase Dashboard -> SQL Editor.

create table if not exists public.projects (
  id text primary key,
  project_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "IBS public read projects" on public.projects;
drop policy if exists "IBS public insert projects" on public.projects;
drop policy if exists "IBS public update projects" on public.projects;

create policy "IBS public read projects"
on public.projects for select
to anon, authenticated
using (true);

create policy "IBS public insert projects"
on public.projects for insert
to anon, authenticated
with check (true);

create policy "IBS public update projects"
on public.projects for update
to anon, authenticated
using (true)
with check (true);

-- Optional: useful index for the single project used by the current Studio.
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);
