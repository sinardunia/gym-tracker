-- Gym Tracker Supabase schema - offline-first with local cache
-- Run this in Supabase Dashboard > SQL Editor

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workouts: store full workout JSON in `data` + indexed fields for queries
create table if not exists public.workouts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid,
  day_id uuid,
  started_at timestamptz not null,
  finished_at timestamptz,
  note text,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_workouts_user_id on public.workouts(user_id);
create index if not exists idx_workouts_started_at on public.workouts(started_at desc);

-- Routines: store full routine JSON in `data`
create table if not exists public.routines (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_routines_user_id on public.routines(user_id);

-- Single-row per user state for activeWorkout + metadata (simplifies sync)
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_workout jsonb,
  saved_at timestamptz,
  updated_at timestamptz default now()
);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workouts_updated_at on public.workouts;
create trigger trg_workouts_updated_at before update on public.workouts for each row execute function public.handle_updated_at();

drop trigger if exists trg_routines_updated_at on public.routines;
create trigger trg_routines_updated_at before update on public.routines for each row execute function public.handle_updated_at();

drop trigger if exists trg_user_state_updated_at on public.user_state;
create trigger trg_user_state_updated_at before update on public.user_state for each row execute function public.handle_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.routines enable row level security;
alter table public.user_state enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Workouts policies
drop policy if exists "Users can manage own workouts" on public.workouts;
create policy "Users can manage own workouts" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Routines policies
drop policy if exists "Users can manage own routines" on public.routines;
create policy "Users can manage own routines" on public.routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User_state policies
drop policy if exists "Users can manage own user_state" on public.user_state;
create policy "Users can manage own user_state" on public.user_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enable realtime (optional, for multi-device live sync)
-- Uncomment if you want realtime:
-- alter publication supabase_realtime add table public.workouts;
-- alter publication supabase_realtime add table public.routines;
-- alter publication supabase_realtime add table public.user_state;
