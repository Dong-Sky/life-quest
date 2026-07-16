-- Shared projects: explicit closure instead of auto-closing when the current task list is complete.
-- Apply after 001 through 007. This migration is additive and keeps all existing task and reward history.

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

  -- Intentionally do not change shared_projects.status here.
  -- A shared project remains open until a participant explicitly closes it.
  return jsonb_build_object('xp', awarded_xp, 'coins', awarded_coins);
end;
$$;

create or replace function public.complete_shared_project(target_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_shared_project_member(target_project_id) then
    raise exception 'Shared project not found';
  end if;

  if not exists (
    select 1 from public.shared_project_tasks
    where project_id = target_project_id
  ) then
    raise exception 'Add at least one task before completing a shared project';
  end if;

  if exists (
    select 1 from public.shared_project_tasks
    where project_id = target_project_id and status = 'open'
  ) then
    raise exception 'Complete all current tasks before completing this shared project';
  end if;

  update public.shared_projects
  set status = 'completed'
  where id = target_project_id;
end;
$$;

create or replace function public.reopen_shared_project(target_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_shared_project_member(target_project_id) then
    raise exception 'Shared project not found';
  end if;

  update public.shared_projects
  set status = 'active'
  where id = target_project_id;
end;
$$;

grant execute on function public.complete_shared_project_task(uuid) to authenticated;
grant execute on function public.complete_shared_project(uuid) to authenticated;
grant execute on function public.reopen_shared_project(uuid) to authenticated;
