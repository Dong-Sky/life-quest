-- Private friendship management actions.
-- Safe to apply after 202607150003_private_friendships.sql.

create or replace function public.decline_friend_request(friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from public.friendships
  where id = friendship_id
    and addressee_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'Friend request not found';
  end if;
end;
$$;

create or replace function public.cancel_friend_request(friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from public.friendships
  where id = friendship_id
    and requester_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'Pending invitation not found';
  end if;
end;
$$;

create or replace function public.remove_friendship(friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from public.friendships
  where id = friendship_id
    and status = 'accepted'
    and (requester_id = auth.uid() or addressee_id = auth.uid());

  if not found then
    raise exception 'Friendship not found';
  end if;
end;
$$;

grant execute on function public.decline_friend_request(uuid) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.remove_friendship(uuid) to authenticated;
