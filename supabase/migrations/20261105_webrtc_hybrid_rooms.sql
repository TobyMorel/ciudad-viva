-- Ciudad Viva Alfa 0.282 (migración aplicada)
alter table public.public_rooms
  add column if not exists rtc_enabled boolean not null default false,
  add column if not exists rtc_public_key text;
alter table public.public_rooms alter column join_url set default '';
alter table public.public_rooms drop constraint if exists public_rooms_join_url_check;
alter table public.public_rooms add constraint public_rooms_join_url_check
  check (join_url = '' or join_url ~ '^https://[a-z0-9-]+[.]trycloudflare[.]com/?$');
alter table public.public_rooms add constraint public_rooms_has_transport_check
  check (join_url <> '' or (rtc_enabled and rtc_public_key is not null));
alter table public.public_rooms add constraint public_rooms_rtc_key_check
  check (rtc_public_key is null or char_length(rtc_public_key) between 130 and 600);
grant select (rtc_enabled, rtc_public_key) on public.public_rooms to anon, authenticated;
