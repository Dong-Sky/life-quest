-- Shared project task parity: task attributes, personal reward ledger, and collaborative milestones.
-- Apply after 001 through 006. This migration is additive and does not replace earlier SQL files.

alter table public.shared_project_tasks
  add column if not exists quest_type text not null default 'standard' check (quest_type in ('micro', 'standard', 'focus', 'milestone', 'boss')),
  add column if not exists difficulty text not null default 'standard' check (difficulty in ('easy', 'standard', 'hard', 'epic')),
  add column if not exists importance text not null default 'helpful' check (importance in ('maintenance', 'helpful', 'goal', 'critical')),
  add column if not exists resistance text not null default 'none' check (resistance in ('none', 'reluctant', 'procrastinated', 'avoided')),
  add column if not exists reward jsonb,
  add column if not exists xp_awarded integer,
  add column if not exists coins_awarded integer;

alter table public.reward_transactions
  add column if not exists shared_project_task_id uuid references public.shared_project_tasks (id) on delete set null;

create unique index if not exists reward_transactions_shared_task_once_idx
  on public.reward_transactions (shared_project_task_id)
  where shared_project_task_id is not null;

create table if not exists public.shared_project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.shared_projects (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  created_at timestamptz not null default now()
);

create table if not exists public.shared_project_milestone_tasks (
  milestone_id uuid not null references public.shared_project_milestones (id) on delete cascade,
  task_id uuid not null references public.shared_project_tasks (id) on delete cascade,
  primary key (milestone_id, task_id)
);

create index if not exists shared_project_milestones_project_idx
  on public.shared_project_milestones (project_id, created_at);

alter table public.shared_project_milestones enable row level security;
alter table public.shared_project_milestone_tasks enable row level security;

drop policy if exists "shared milestones are visible to members" on public.shared_project_milestones;
drop policy if exists "shared milestone task links are visible to members" on public.shared_project_milestone_tasks;

create policy "shared milestones are visible to members" on public.shared_project_milestones
for select using (public.is_shared_project_member(project_id));

create policy "shared milestone task links are visible to members" on public.shared_project_milestone_tasks
for select using (
  exists (
    select 1 from public.shared_project_milestones milestones
    where milestones.id = milestone_id
      and public.is_shared_project_member(milestones.project_id)
  )
);

create or replace function public.create_shared_project_task(
  target_project_id uuid,
  task_title text,
  task_quest_type text default 'standard',
  task_difficulty text default 'standard',
  task_importance text default 'helpful',
  task_resistance text default 'none'
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

  if task_quest_type not in ('micro', 'standard', 'focus', 'milestone', 'boss')
    or task_difficulty not in ('easy', 'standard', 'hard', 'epic')
    or task_importance not in ('maintenance', 'helpful', 'goal', 'critical')
    or task_resistance not in ('none', 'reluctant', 'procrastinated', 'avoided') then
    raise exception 'Invalid task attributes';
  end if;

  insert into public.shared_project_tasks (
    project_id, title, quest_type, difficulty, importance, resistance
  )
  select
    target_project_id,
    trim(task_title),
    task_quest_type,
    task_difficulty,
    task_importance,
    task_resistance
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

create or replace function public.create_shared_project_milestone(
  target_project_id uuid,
  milestone_title text,
  task_ids uuid[] default array[]::uuid[],
  new_task_title text default '',
  new_task_quest_type text default 'standard',
  new_task_difficulty text default 'standard',
  new_task_importance text default 'helpful',
  new_task_resistance text default 'none'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  created_milestone_id uuid;
  created_task_id uuid;
  candidate_task_id uuid;
begin
  if not public.is_shared_project_member(target_project_id) then
    raise exception 'Shared project not found';
  end if;

  if char_length(trim(milestone_title)) not between 1 and 160 then
    raise exception 'Milestone title is required';
  end if;

  if not exists (
    select 1 from public.shared_projects
    where id = target_project_id and status = 'active'
  ) then
    raise exception 'Completed projects cannot receive new milestones';
  end if;

  for candidate_task_id in
    select distinct candidate.value
    from unnest(coalesce(task_ids, array[]::uuid[])) as candidate(value)
  loop
    if not exists (
      select 1 from public.shared_project_tasks
      where id = candidate_task_id and project_id = target_project_id
    ) then
      raise exception 'Milestone tasks must belong to this shared project';
    end if;
  end loop;

  insert into public.shared_project_milestones (project_id, title)
  values (target_project_id, trim(milestone_title))
  returning id into created_milestone_id;

  insert into public.shared_project_milestone_tasks (milestone_id, task_id)
  select created_milestone_id, candidate.value
  from (
    select distinct value
    from unnest(coalesce(task_ids, array[]::uuid[])) as value
  ) candidate
  on conflict do nothing;

  if trim(coalesce(new_task_title, '')) <> '' then
    created_task_id := public.create_shared_project_task(
      target_project_id,
      new_task_title,
      new_task_quest_type,
      new_task_difficulty,
      new_task_importance,
      new_task_resistance
    );

    insert into public.shared_project_milestone_tasks (milestone_id, task_id)
    values (created_milestone_id, created_task_id)
    on conflict do nothing;
  end if;

  return created_milestone_id;
end;
$$;

create or replace function public.complete_shared_project_task(target_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_project_id uuid;
  awarded_xp integer;
  awarded_coins integer;
  task_quest_type text;
  task_difficulty text;
  task_importance text;
  task_resistance text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.shared_project_tasks
  set status = 'completed',
      completed_by = auth.uid(),
      completed_at = now()
  where id = target_task_id
    and status = 'open'
    and public.is_shared_project_member(project_id)
  returning project_id, quest_type, difficulty, importance, resistance
  into target_project_id, task_quest_type, task_difficulty, task_importance, task_resistance;

  if target_project_id is null then
    raise exception 'Shared task not found or already completed';
  end if;

  awarded_xp := round(
    (case task_quest_type
      when 'micro' then 5
      when 'standard' then 10
      when 'focus' then 20
      when 'milestone' then 50
      when 'boss' then 100
    end)
    * (case task_difficulty when 'easy' then 0.8 when 'standard' then 1 when 'hard' then 1.3 when 'epic' then 1.6 end)
    * (case task_importance when 'maintenance' then 0.8 when 'helpful' then 1 when 'goal' then 1.3 when 'critical' then 1.6 end)
    * (case task_resistance when 'none' then 1 when 'reluctant' then 1.1 when 'procrastinated' then 1.3 when 'avoided' then 1.5 end)
  )::integer;
  awarded_coins := case when awarded_xp < 10 then 0 else floor(awarded_xp / 10.0)::integer end;

  update public.shared_project_tasks
  set xp_awarded = awarded_xp,
      coins_awarded = awarded_coins,
      reward = jsonb_build_object(
        'xp', awarded_xp,
        'coins', awarded_coins,
        'calculationVersion', 'v1'
      )
  where id = target_task_id;

  insert into public.reward_transactions (
    user_id,
    shared_project_task_id,
    xp_delta,
    coin_delta,
    calculation_version
  ) values (
    auth.uid(),
    target_task_id,
    awarded_xp,
    awarded_coins,
    'v1'
  );

  if not exists (
    select 1 from public.shared_project_tasks
    where project_id = target_project_id and status = 'open'
  ) then
    update public.shared_projects
    set status = 'completed'
    where id = target_project_id;
  end if;

  return jsonb_build_object('xp', awarded_xp, 'coins', awarded_coins);
end;
$$;

drop function if exists public.list_my_shared_projects();

create function public.list_my_shared_projects()
returns table (
  id uuid,
  name text,
  victory_condition text,
  due_date date,
  status text,
  created_at timestamptz,
  members jsonb,
  tasks jsonb,
  milestones jsonb
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
        'quest_type', tasks.quest_type,
        'difficulty', tasks.difficulty,
        'importance', tasks.importance,
        'resistance', tasks.resistance,
        'status', tasks.status,
        'completed_at', tasks.completed_at,
        'completed_by', tasks.completed_by,
        'xp_awarded', tasks.xp_awarded,
        'coins_awarded', tasks.coins_awarded
      ) order by tasks.created_at)
      from public.shared_project_tasks tasks
      where tasks.project_id = projects.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', milestones.id,
        'title', milestones.title,
        'task_ids', coalesce((
          select jsonb_agg(links.task_id order by links.task_id)
          from public.shared_project_milestone_tasks links
          where links.milestone_id = milestones.id
        ), '[]'::jsonb)
      ) order by milestones.created_at)
      from public.shared_project_milestones milestones
      where milestones.project_id = projects.id
    ), '[]'::jsonb)
  from public.shared_projects projects
  where public.is_shared_project_member(projects.id)
  order by projects.created_at desc;
$$;

grant execute on function public.create_shared_project_task(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.create_shared_project_milestone(uuid, text, uuid[], text, text, text, text, text) to authenticated;
grant execute on function public.complete_shared_project_task(uuid) to authenticated;
grant execute on function public.list_my_shared_projects() to authenticated;
