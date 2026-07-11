-- Rent & Flatmate Finder — Database Schema
-- Run this in the Supabase SQL editor

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- users (mirrored from Clerk via webhook)
-- ─────────────────────────────────────────────
create table users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text not null,
  name text,
  role text check (role in ('tenant','owner','admin')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- room listings
-- ─────────────────────────────────────────────
create table listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) on delete cascade,
  title text not null,
  location text not null,
  rent numeric not null,
  available_from date not null,
  room_type text,
  furnishing_status text,
  photo_urls text[] default '{}',
  is_filled boolean default false,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- tenant profiles
-- ─────────────────────────────────────────────
create table tenant_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references users(id) on delete cascade unique,
  preferred_location text,
  budget_min numeric,
  budget_max numeric,
  move_in_date date,
  notes text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- compatibility scores (cached — computed once per pair)
-- ─────────────────────────────────────────────
create table compatibility_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  score int check (score between 0 and 100),
  explanation text,
  source text check (source in ('llm','fallback')) default 'llm',
  created_at timestamptz default now(),
  unique(tenant_id, listing_id)
);

-- ─────────────────────────────────────────────
-- interest requests
-- ─────────────────────────────────────────────
create table interests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  status text check (status in ('pending','accepted','declined')) default 'pending',
  created_at timestamptz default now(),
  unique(tenant_id, listing_id)
);

-- ─────────────────────────────────────────────
-- chat messages (unlocked once interest is accepted)
-- ─────────────────────────────────────────────
create table messages (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid references interests(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- notification log
-- ─────────────────────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text,
  payload jsonb,
  sent_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table users enable row level security;
alter table listings enable row level security;
alter table tenant_profiles enable row level security;
alter table compatibility_scores enable row level security;
alter table interests enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- NOTE: This app calls Supabase from Next.js server-side routes/actions using
-- the SERVICE ROLE key, and authorization is enforced in application code
-- against the Clerk session — not via Supabase's own auth.uid(). So these
-- policies simply block all direct client-side access (anon key), which is
-- intentional: the browser never talks to Supabase directly in this app.

create policy "no direct client access" on users for all using (false);
create policy "no direct client access" on listings for all using (false);
create policy "no direct client access" on tenant_profiles for all using (false);
create policy "no direct client access" on compatibility_scores for all using (false);
create policy "no direct client access" on interests for all using (false);
create policy "no direct client access" on messages for all using (false);
create policy "no direct client access" on notifications for all using (false);

-- Public read of non-filled listings is handled server-side (service role),
-- so no public SELECT policy is needed here.

create index idx_listings_location on listings(location);
create index idx_listings_filled on listings(is_filled);
create index idx_scores_tenant_listing on compatibility_scores(tenant_id, listing_id);
create index idx_messages_interest on messages(interest_id, created_at);
