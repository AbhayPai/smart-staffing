-- ─────────────────────────────────────────────────────────────────────────────
-- Luminary — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- Clean up existing objects (if re-running) - drop in reverse dependency order
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_updated_at() cascade;
drop table if exists public.profiles cascade;
drop type if exists user_role cascade;
drop type if exists user_department cascade;

-- 1. Create ENUM types
create type user_role as enum (
  'admin',
  'manager',
  'engineer',
  'designer',
  'analyst',
  'hr',
  'finance',
  'marketing',
  'other'
);

create type user_department as enum (
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Finance',
  'Human Resources',
  'Operations',
  'Legal',
  'Other'
);

-- 2. Create profiles table
--    `id` is a FK to auth.users so each profile maps 1-to-1 to an auth user.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null unique,
  first_name    text not null,
  middle_name   text,
  last_name     text not null,
  department    user_department not null,
  role          user_role not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. Auto-update `updated_at` on every row change
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 4. Trigger: Automatically create profile when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, middle_name, last_name, department, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    new.raw_user_meta_data->>'middle_name',
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'department', 'Other')::user_department,
    coalesce(new.raw_user_meta_data->>'role', 'other')::user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
