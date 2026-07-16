-- Fix shared project participant creation after 202607150005.
-- The original function used the same identifier for a PL/pgSQL variable and query column.

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
  candidate_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(project_name)) not between 1 and 120 then
    raise exception 'Project name is required';
  end if;

  for candidate_user_id in
    select distinct candidate.value
    from unnest(coalesce(participant_ids, array[]::uuid[])) as candidate(value)
  loop
    if candidate_user_id <> auth.uid() and not exists (
      select 1
      from public.friendships
      where status = 'accepted'
        and (
          (requester_id = auth.uid() and addressee_id = candidate_user_id)
          or (requester_id = candidate_user_id and addressee_id = auth.uid())
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
  select created_project_id, invitees.user_id, 'member'
  from (
    select distinct candidate.value as user_id
    from unnest(coalesce(participant_ids, array[]::uuid[])) as candidate(value)
  ) as invitees
  where invitees.user_id <> auth.uid()
  on conflict do nothing;

  return created_project_id;
end;
$$;

grant execute on function public.create_shared_project(text, text, date, uuid[]) to authenticated;
