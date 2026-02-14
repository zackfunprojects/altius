-- ═══════════════════════════════════════════════════════════
-- ALTIUS — Supabase Database Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- 1. PROFILES TABLE
-- Stores user display name and onboarding status
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. USER DATA TABLE
-- Stores all app state as a single JSONB blob per user
-- (courses, books, articles, resources, media, goals, arcs, scoring, etc.)
create table if not exists public.user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. ROW LEVEL SECURITY
-- Users can only read/write their own data

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;

-- Profiles: users can read and update only their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- User data: users can only access their own data
create policy "Users can view own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can update own data"
  on public.user_data for update
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

-- 4. AUTO-UPDATE TIMESTAMPS
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger user_data_updated_at
  before update on public.user_data
  for each row execute function public.handle_updated_at();

-- 5. AUTO-CREATE PROFILE ON SIGN-UP
-- When a new user signs up via Supabase Auth, automatically create their profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));

  insert into public.user_data (user_id, data)
  values (new.id, '{}'::jsonb);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- Done! Your database is ready for Altius.
-- ═══════════════════════════════════════════════════════════
