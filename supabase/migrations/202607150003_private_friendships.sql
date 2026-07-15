-- Private friend invitations for Questline.
-- Friends are created only by an intentional invite link; users cannot browse all profiles.

alter table public.profiles add column if not exists invite_code uuid default gen_random_uuid();

update public.profiles
set invite_code = gen_random_uuid()
where invite_code is null;

alter table public.profiles alter column invite_code set not null;

create unique index if not exists profiles_invite_code_unique on public.profiles (invite_code);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at before update on public.friendships
for each row execute function public.set_updated_at();

alter table public.friendships enable row level security;

drop policy if exists "friendships are visible to participants" on public.friendships;
create policy "friendships are visible to participants" on public.friendships
for select using (requester_id = auth.uid() or addressee_id = auth.uid());

create or replace function public.send_friend_request(code uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  recipient_id uuid;
  existing_friendship public.friendships;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select id into recipient_id
  from public.profiles
  where invite_code = code;

  if recipient_id is null then
    raise exception 'Invite link is invalid';
  end if;

  if recipient_id = auth.uid() then
    raise exception 'You cannot add yourself';
  end if;

  select * into existing_friendship
  from public.friendships
  where (requester_id = auth.uid() and addressee_id = recipient_id)
     or (requester_id = recipient_id and addressee_id = auth.uid())
  limit 1;

  if found then
    if existing_friendship.status = 'pending' and existing_friendship.addressee_id = auth.uid() then
      update public.friendships
      set status = 'accepted'
      where id = existing_friendship.id;
      return 'accepted';
    end if;

    return existing_friendship.status;
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (auth.uid(), recipient_id);

  return 'pending';
end;
$$;

create or replace function public.accept_friend_request(friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.friendships
  set status = 'accepted'
  where id = friendship_id
    and addressee_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'Friend request not found';
  end if;
end;
$$;

create or replace function public.list_my_friendships()
returns table (
  friendship_id uuid,
  friend_id uuid,
  display_name text,
  status text,
  direction text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    friendships.id,
    case when friendships.requester_id = auth.uid() then friendships.addressee_id else friendships.requester_id end,
    profiles.display_name,
    friendships.status,
    case when friendships.requester_id = auth.uid() then 'sent' else 'received' end
  from public.friendships
  join public.profiles on profiles.id = case when friendships.requester_id = auth.uid() then friendships.addressee_id else friendships.requester_id end
  where friendships.requester_id = auth.uid() or friendships.addressee_id = auth.uid()
  order by friendships.updated_at desc;
$$;

grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.list_my_friendships() to authenticated;
