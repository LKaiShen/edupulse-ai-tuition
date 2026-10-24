create extension if not exists "pgcrypto";

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id text,                       -- parent account that submitted it (app_users.id)
  parent_name text not null,
  phone text not null,
  branch text not null check (branch in ('SS2','SS15')),
  child_age integer not null check (child_age between 1 and 99),
  question text not null,
  category text not null check (category in ('收费','时间','课程','其他')),
  ai_draft text not null,
  needs_human boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now()
);
-- If the table already exists from an earlier version:
alter table public.inquiries add column if not exists user_id text;

create table if not exists public.app_users (
  id text primary key,
  name text not null,
  phone text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_user_idx on public.inquiries (user_id);
alter table public.inquiries enable row level security; -- accessed only via service role key on the server
alter table public.app_users enable row level security;
