-- Questline cloud foundation
-- Apply through Supabase SQL Editor after this PR is reviewed and merged.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '旅人',
  timezone text not null default 'Asia/Shanghai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mainlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  vision text not null default '',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mainline_id uuid references public.mainlines (id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  victory_condition text not null default '',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mainline_id uuid references public.mainlines (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  quest_type text not null default 'standard' check (quest_type in ('micro', 'standard', 'focus', 'milestone', 'boss')),
  difficulty text not null default 'standard' check (difficulty in ('easy', 'standard', 'hard', 'epic')),
  importance text not null default 'helpful' check (importance in ('maintenance', 'helpful', 'goal', 'critical')),
  resistance text not null default 'none' check (resistance in ('none', 'reluctant', 'procrastinated', 'avoided')),
  status text not null default 'open' check (status in ('open', 'completed', 'archived')),
  recurrence jsonb,
  reward jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quest_id uuid references public.quests (id) on delete set null,
  xp_delta integer not null check (xp_delta >= 0),
  coin_delta integer not null check (coin_delta >= 0),
  calculation_version text not null,
  cycle_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  coin_cost integer not null check (coin_cost > 0),
  is_repeatable boolean not null default true,
  is_wishlisted boolean not null default false,
  wishlisted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reward_id uuid references public.rewards (id) on delete set null,
  reward_name text not null,
  coin_cost integer not null check (coin_cost > 0),
  redeemed_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  created_at timestamptz not null default now()
);

create table if not exists public.milestone_quests (
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  quest_id uuid not null references public.quests (id) on delete cascade,
  primary key (milestone_id, quest_id)
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_week_key date not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_week_key)
);

create table if not exists public.weekly_plan_quests (
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  quest_id uuid not null references public.quests (id) on delete cascade,
  primary key (weekly_plan_id, quest_id)
);

create index if not exists quests_user_status_idx on public.quests (user_id, status, created_at desc);
create index if not exists projects_user_idx on public.projects (user_id, created_at desc);
create index if not exists transactions_user_created_idx on public.reward_transactions (user_id, created_at desc);
create index if not exists redemptions_user_redeemed_idx on public.reward_redemptions (user_id, redeemed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists mainlines_set_updated_at on public.mainlines;
create trigger mainlines_set_updated_at before update on public.mainlines
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists quests_set_updated_at on public.quests;
create trigger quests_set_updated_at before update on public.quests
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '旅人'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.mainlines enable row level security;
alter table public.projects enable row level security;
alter table public.quests enable row level security;
alter table public.reward_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.milestones enable row level security;
alter table public.milestone_quests enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.weekly_plan_quests enable row level security;

create policy "profiles are private" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "mainlines are private" on public.mainlines for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "projects are private" on public.projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "quests are private" on public.quests for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions are private" on public.reward_transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "rewards are private" on public.rewards for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "redemptions are private" on public.reward_redemptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "milestones are private" on public.milestones for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "milestone links are private" on public.milestone_quests for all
using (exists (select 1 from public.milestones where milestones.id = milestone_id and milestones.user_id = auth.uid()))
with check (
  exists (select 1 from public.milestones where milestones.id = milestone_id and milestones.user_id = auth.uid())
  and exists (select 1 from public.quests where quests.id = quest_id and quests.user_id = auth.uid())
);
create policy "weekly plans are private" on public.weekly_plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "weekly plan links are private" on public.weekly_plan_quests for all
using (exists (select 1 from public.weekly_plans where weekly_plans.id = weekly_plan_id and weekly_plans.user_id = auth.uid()))
with check (
  exists (select 1 from public.weekly_plans where weekly_plans.id = weekly_plan_id and weekly_plans.user_id = auth.uid())
  and exists (select 1 from public.quests where quests.id = quest_id and quests.user_id = auth.uid())
);
