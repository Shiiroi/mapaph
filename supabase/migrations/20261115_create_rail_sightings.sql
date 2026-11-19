-- Migration: Anonymous crowd-sourced Metro Manila train arrival & crowd sightings
-- Run this SQL in your Supabase SQL Editor to enable shared live rider check-ins on /tools/train-arrival-ph

create table if not exists public.rail_sightings (
  id uuid primary key default gen_random_uuid(),
  line_key text not null check (line_key in ('lrt1', 'mrt3', 'lrt2')),
  station_id text not null check (char_length(station_id) between 4 and 40),
  direction text not null check (direction in ('fwd', 'rev')),
  report_type text not null check (report_type in ('arriving', 'on_board', 'crowded', 'delayed')),
  source_kind text not null default 'manual' check (source_kind in ('manual', 'gps_snap')),
  crowd_level text check (crowd_level is null or crowd_level in ('light', 'moderate', 'packed')),
  client_token text not null check (char_length(client_token) between 8 and 64),
  created_at timestamptz not null default now()
);

create index if not exists idx_rail_sightings_line_created
  on public.rail_sightings (line_key, created_at desc);

create index if not exists idx_rail_sightings_token_created
  on public.rail_sightings (client_token, created_at desc);

alter table public.rail_sightings enable row level security;

drop policy if exists "Allow public read of recent sightings" on public.rail_sightings;
create policy "Allow public read of recent sightings"
  on public.rail_sightings
  for select
  to anon, authenticated
  using (created_at >= now() - interval '20 minutes');

drop policy if exists "Allow rate-limited anonymous sighting insert" on public.rail_sightings;
create policy "Allow rate-limited anonymous sighting insert"
  on public.rail_sightings
  for insert
  to anon, authenticated
  with check (
    not exists (
      select 1
      from public.rail_sightings r
      where r.client_token = rail_sightings.client_token
        and r.created_at > now() - interval '20 seconds'
    )
  );

create or replace function public.prune_old_rail_sightings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.rail_sightings
  where created_at < now() - interval '2 hours';
  return null;
end;
$$;

drop trigger if exists trg_prune_old_rail_sightings on public.rail_sightings;
create trigger trg_prune_old_rail_sightings
  after insert on public.rail_sightings
  for each statement
  execute function public.prune_old_rail_sightings();
