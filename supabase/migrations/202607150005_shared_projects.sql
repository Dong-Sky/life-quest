-- Shared project MVP.
-- Apply after the existing cloud workspace and friendship migrations.

create table if not exists public.shared_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  victory_condition text not null default '',
  due_date date,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_project_members (
  project_id uuid not null references public.shared_projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.shared_project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.shared_projects (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  status text not null default 'open' check (status in ('open', 'completed')),
  completed_by uuid references public.profiles (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shared_projects_set_updated_at on public.shared_projects;
create trigger shared_projects_set_updated_at before update on public.shared_projects
for each row execute function public.set_updated_at();

drop trigger if exists shared_project_tasks_set_updated_at on public.shared_project_tasks;
create trigger shared_project_tasks_set_updated_at before update on public.shared_project_tasks
for each row execute function public.set_updated_at();

create index if not exists shared_project_members_user_idx on public.shared_project_members (user_id, project_id);
create index if not exists shared_project_tasks_project_idx on public.shared_project_tasks (project_id, status, created_at);

create or replace function public.is_shared_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.shared_project_members
    where project_id = target_project_id
      and user_id = auth.uid()
  );
$$;

alter table public.shared_projects enable row level security;
alter table public.shared_project_members enable row level security;
alter table public.shared_project_tasks enable row level security;

drop policy if exists "shared projects are visible to members" on public.shared_projects;
drop policy if exists "shared project members are visible to members" on public.shared_project_members;
drop policy if exists "shared project tasks are visible to members" on public.shared_project_tasks;

create policy "shared projects are visible to members" on public.shared_projects
for select using (public.is_shared_project_member(id));

create policy "shared project members are visible to members" on public.shared_project_members
for select using (public.is_shared_project_member(project_id));

create policy "shared project tasks are visible to members" on public.shared_project_tasks
for select using (public.is_shared_project_member(project_id));

create or replace function public.create_shared_project(
  project_name text,
  project_victory_condition text default '',
  project_due_date date default null,
  participant_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  created_project_id uuid;
  participant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(project_name)) not between 1 and 120 then
    raise exception 'Project name is required';
  end if;

  for participant_id in
    select distinct value
    from unnest(coalesce(participant_ids, array[]::uuid[])) as value
  loop
    if participant_id <> auth.uid() and not exists (
      select 1
      from public.friendships
      where status = 'accepted'
        and (
          (requester_id = auth.uid() and addressee_id = participant_id)
          or (requester_id = participant_id and addressee_id = auth.uid())
        )
    ) then
      raise exception 'Only confirmed partners can join a shared project';
    end if;
  end loop;

  insert into public.shared_projects (owner_id, name, victory_condition, due_date)
  values (auth.uid(), trim(project_name), trim(coalesce(project_victory_condition, '')), project_due_date)
  returning id into created_project_id;

  insert into public.shared_project_members (project_id, user_id, role)
  values (created_project_id, auth.uid(), 'owner');

  insert into public.shared_project_members (project_id, user_id, role)
  select created_project_id, participant_id, 'member'
  from (
    select distinct value as participant_id
    from unnest(coalesce(participant_ids, array[]::uuid[])) as value
  ) participants
  where participant_id <> auth.uid()
  on conflict do nothing;

  return created_project_id;
end;
$$;

create or replace function public.create_shared_project_task(
  target_project_id uuid,
  task_title text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  created_task_id uuid;
begin
  if not public.is_shared_project_member(target_project_id) then
    raise exception 'Shared project not found';
  end if;

  if char_length(trim(task_title)) not between 1 and 240 then
    raise exception 'Task title is required';
  end if;

  insert into public.shared_project_tasks (project_id, title)
  select target_project_id, trim(task_title)
  where exists (
    select 1 from public.shared_projects
    where id = target_project_id and status = 'active'
  )
  returning id into created_task_id;

  if created_task_id is null then
    raise exception 'Completed projects cannot receive new tasks';
  end if;

  return created_task_id;
end;
$$;

create or replace function public.complete_shared_project_task(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_project_id uuid;
begin
  update public.shared_project_tasks
  set status = 'completed',
      completed_by = auth.uid(),
      completed_at = now()
  where id = target_task_id
    and status = 'open'
    and public.is_shared_project_member(project_id)
  returning project_id into target_project_id;

  if target_project_id is null then
    raise exception 'Shared task not found or already completed';
  end if;

  if not exists (
    select 1 from public.shared_project_tasks
    where project_id = target_project_id and status = 'open'
  ) then
    update public.shared_projects
    set status = 'completed'
    where id = target_project_id;
  end if;
end;
$$;

create or replace function public.list_my_shared_projects()
returns table (
  id uuid,
  name text,
  victory_condition text,
  due_date date,
  status text,
  created_at timestamptz,
  members jsonb,
  tasks jsonb
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    projects.id,
    projects.name,
    projects.victory_condition,
    projects.due_date,
    projects.status,
    projects.created_at,
    coalesce((
      select jsonb_agg(jsonb_build_object('user_id', members.user_id, 'display_name', profiles.display_name) order by members.created_at)
      from public.shared_project_members members
      join public.profiles on profiles.id = members.user_id
      where members.project_id = projects.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tasks.id,
        'title', tasks.title,
        'status', tasks.status,
        'completed_at', tasks.completed_at,
        'completed_by', tasks.completed_by
      ) order by tasks.created_at)
      from public.shared_project_tasks tasks
      where tasks.project_id = projects.id
    ), '[]'::jsonb)
  from public.shared_projects projects
  where public.is_shared_project_member(projects.id)
  order by projects.created_at desc;
$$;

grant execute on function public.create_shared_project(text, text, date, uuid[]) to authenticated;
grant execute on function public.create_shared_project_task(uuid, text) to authenticated;
grant execute on function public.complete_shared_project_task(uuid) to authenticated;
grant execute on function public.list_my_shared_projects() to authenticated;
