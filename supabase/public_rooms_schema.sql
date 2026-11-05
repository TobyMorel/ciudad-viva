-- Esquema auditable del directorio de Ciudad Viva. Migración aplicada por Supabase MCP.
create table if not exists public.public_rooms (
  id uuid primary key,
  owner_secret_hash text not null check (owner_secret_hash ~ '^[0-9a-f]{64}$'),
  city text not null check (char_length(city) between 1 and 64),
  host_name text not null check (char_length(host_name) between 1 and 32),
  join_url text not null default '' check (join_url = '' or join_url ~ '^https://[a-z0-9-]+[.]trycloudflare[.]com/?
  players integer not null check (players between 1 and 13),
  max_players integer not null default 13 check (max_players = 13),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  owner_ip_hash text check (owner_ip_hash is null or owner_ip_hash ~ '^[0-9a-f]{64}$')
);
create index if not exists idx_public_rooms_last_seen on public.public_rooms(last_seen desc);
create index if not exists idx_public_rooms_owner_ip_seen on public.public_rooms(owner_ip_hash,last_seen desc);
alter table public.public_rooms enable row level security;
revoke all privileges on public.public_rooms from public, anon, authenticated;
grant select (id, city, host_name, join_url, rtc_enabled, rtc_public_key, players, max_players, last_seen)
  on public.public_rooms to anon, authenticated;
create policy "Las salas activas son publicas" on public.public_rooms
  for select to anon, authenticated
  using (last_seen > now() - interval '12 minutes');
),
  rtc_enabled boolean not null default false,
  rtc_public_key text check (rtc_public_key is null or char_length(rtc_public_key) between 130 and 600),
  constraint public_rooms_has_transport_check
    check (join_url <> '' or (rtc_enabled and rtc_public_key is not null)),
  players integer not null check (players between 1 and 13),
  max_players integer not null default 13 check (max_players = 13),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  owner_ip_hash text check (owner_ip_hash is null or owner_ip_hash ~ '^[0-9a-f]{64}$')
);
create index if not exists idx_public_rooms_last_seen on public.public_rooms(last_seen desc);
create index if not exists idx_public_rooms_owner_ip_seen on public.public_rooms(owner_ip_hash,last_seen desc);
alter table public.public_rooms enable row level security;
revoke all privileges on public.public_rooms from public, anon, authenticated;
grant select (id, city, host_name, join_url, players, max_players, last_seen)
  on public.public_rooms to anon, authenticated;
create policy "Las salas activas son publicas" on public.public_rooms
  for select to anon, authenticated
  using (last_seen > now() - interval '12 minutes');
