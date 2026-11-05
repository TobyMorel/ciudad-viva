-- Migración aplicada en CiudadViva: 13 jugadores y 12 minutos de vigencia.
ALTER TABLE public.public_rooms
  DROP CONSTRAINT IF EXISTS public_rooms_players_check,
  DROP CONSTRAINT IF EXISTS public_rooms_max_players_check;
ALTER TABLE public.public_rooms
  ALTER COLUMN max_players SET DEFAULT 13;
ALTER TABLE public.public_rooms
  ADD CONSTRAINT public_rooms_players_check CHECK (players BETWEEN 1 AND 13),
  ADD CONSTRAINT public_rooms_max_players_check CHECK (max_players = 13);
DROP POLICY IF EXISTS "Las salas activas son publicas" ON public.public_rooms;
CREATE POLICY "Las salas activas son publicas"
  ON public.public_rooms FOR SELECT TO anon, authenticated
  USING (last_seen > now() - interval '12 minutes');
