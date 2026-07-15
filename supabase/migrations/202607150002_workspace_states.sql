-- Persist each user's existing Questline workspace in Supabase.
-- Apply after the initial cloud schema migration.

create table if not exists public.workspace_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists workspace_states_set_updated_at on public.workspace_states;
create trigger workspace_states_set_updated_at before update on public.workspace_states
for each row execute function public.set_updated_at();

alter table public.workspace_states enable row level security;

drop policy if exists "workspace states are private" on public.workspace_states;
create policy "workspace states are private" on public.workspace_states
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
