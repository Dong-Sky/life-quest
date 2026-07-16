-- Shared task deadlines: optional date-only DDL for direct and milestone task creation.
-- Apply after migrations 001 through 008. This migration is additive and keeps all existing tasks.

alter table public.shared_project_tasks
  add column if not exists due_date date;

drop function if exists public.create_shared_project_task(uuid, text, text, text, text, text);

create function public.create_shared_project_task(
  target_project_id uuid,
  task_title text,
  task_quest_type text default 'standard',
  task_difficulty text default 'standard',
  task_importance text default 'helpful',
  task_resistance text default 'none',
  task_due_date date default null
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
    project_id, title, quest_type, difficulty, importance, resistance, due_date
  )
  select
    target_project_id,
    trim(task_title),
    task_quest_type,
    task_difficulty,
    task_importance,
    task_resistance,
    task_due_date
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

drop function if exists public.create_shared_project_milestone(uuid, text, uuid[], text, text, text, text, text);

create function public.create_shared_project_milestone(
  target_project_id uuid,
  milestone_title text,
  task_ids uuid[] default array[]::uuid[],
  new_task_title text default '',
  new_task_quest_type text default 'standard',
  new_task_difficulty text default 'standard',
  new_task_importance text default 'helpful',
  new_task_resistance text default 'none',
  new_task_due_date date default null
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
      new_task_resistance,
      new_task_due_date
    );

    insert into public.shared_project_milestone_tasks (milestone_id, task_id)
    values (created_milestone_id, created_task_id)
    on conflict do nothing;
  end if;

  return created_milestone_id;
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
        'due_date', tasks.due_date,
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

grant execute on function public.create_shared_project_task(uuid, text, text, text, text, text, date) to authenticated;
grant execute on function public.create_shared_project_milestone(uuid, text, uuid[], text, text, text, text, text, date) to authenticated;
grant execute on function public.list_my_shared_projects() to authenticated;
