# Ciudad Viva — servidores públicos autoalojados (Alfa 0.279)

## Cómo funciona

La persona que crea una partida usa **Crear servidor público** en el ejecutable Windows. La simulación y los guardados permanecen en su PC. El mismo \`server.py\` y el mismo motor \`offline.js\` atienden las conexiones LAN y las que lleguen desde Internet.

La versión Windows incluye el programa auxiliar \`cloudflared.exe\`. Al publicar, la app abre un túnel saliente hacia un proxy HTTP local que expone sólo los recursos y acciones que necesita un invitado. El anfitrión no tiene que abrir puertos del router ni instalar una VPN. Se genera un enlace HTTPS temporal para invitar a otras personas. Al cerrar el ejecutable se cierra el túnel.

**Advertencia:** este primer soporte usa Cloudflare Quick Tunnels. Cloudflare indica que son para desarrollo/pruebas, no para producción, y no ofrecen una URL estable ni garantías de continuidad. Para sostener un directorio público a gran escala debe adoptarse un servicio de túnel/retransmisión adecuado para producción. La simulación puede seguir alojada exclusivamente en la PC del anfitrión.

## Directorio global de salas (configuración única)

Supabase sólo almacenaría metadatos de presencia, jamás la ciudad: UUID de sala, nombre, anfitrión, URL temporal HTTPS, cantidad de participantes y última actualización. La app refresca el registro cada 24 segundos y el directorio deja de mostrar salas sin actualización durante 90 segundos.

Para activar el listado global, el operador de Ciudad Viva debe crear **un solo proyecto Supabase** y habilitar **Anonymous Sign-Ins**. No hace falta que cada jugador cree una cuenta ni configure una base de datos. En el editor SQL del proyecto:

\`\`\`sql
create table if not exists public.public_rooms (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  city text not null check (char_length(city) between 1 and 64),
  host_name text not null check (char_length(host_name) between 1 and 32),
  join_url text not null check (join_url ~ '^https://[a-z0-9-]+[.]trycloudflare[.]com/?$'),
  players integer not null check (players between 1 and 12),
  max_players integer not null default 12 check (max_players = 12),
  last_seen timestamptz not null default now()
);
create index if not exists idx_public_rooms_last_seen on public.public_rooms(last_seen desc);
alter table public.public_rooms enable row level security;
revoke all on public.public_rooms from anon, authenticated;
grant select on public.public_rooms to anon, authenticated;
grant insert, update, delete on public.public_rooms to authenticated;

create policy "Leer salas recientes o propias" on public.public_rooms
  for select to anon, authenticated
  using (last_seen > now() - interval '90 seconds' or owner_id = (select auth.uid()));

create policy "Crear sala propia" on public.public_rooms
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Actualizar sala propia" on public.public_rooms
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Eliminar sala propia" on public.public_rooms
  for delete to authenticated
  using (owner_id = (select auth.uid()));
\`\`\`

Rellenar \`public_directory.json\` con \`supabaseUrl\` (debe ser \`https://...supabase.co\`) y \`supabaseAnonKey\` (clave pública/anon o publishable de Supabase), recompilar el .exe y publicar una nueva versión. Para el desarrollo en Python también se aceptan \`CIUDAD_VIVA_SUPABASE_URL\` y \`CIUDAD_VIVA_SUPABASE_ANON_KEY\`.

**No incluir jamás una service_role key.** La publicación utiliza una sesión anónima de Supabase con JWT y políticas RLS que sólo permiten editar la sala propia. No envía snapshots, datos personales de ciudadanos, chat ni acciones de construcción a Supabase.

**Situación actual:** el repositorio incluye \`public_directory.json\` vacío, porque todavía no se proporcionó un proyecto Supabase. El listado público permanecerá deshabilitado hasta su configuración. Los enlaces HTTPS temporales directos pueden crearse sin Supabase.

## Seguridad

El túnel público llega a un proxy independiente, escuchando sólo en \`127.0.0.1\` en un puerto efímero. El proxy permite servir los archivos estáticos y las rutas de unión, estado, sincronización, cursores, chat y acciones de un jugador autenticado. Bloquea desde Internet las APIs de creación de sala, selección de guardados, guardado/carga y reinicio de partida. Los invitados obtienen un token de sesión aleatorio en una cookie \`HttpOnly; Secure; SameSite=Lax\`; el proxy asigna IDs nuevos para impedir que se hagan pasar por el anfitrión.

El servidor LAN original sigue disponible, conservando Radmin/Hamachi y las conexiones directas en red local. La publicación pública es explícita, no automática para todas las salas.

**Pendiente antes de considerar esto un sistema público definitivo:** controles de expulsión/baneo, limitación de frecuencia por jugador, mitigación de abusos, reconexión fuerte, revisión de límites de recursos, autenticación persistente opcional y pruebas de penetración. Todos los participantes que ingresen pueden construir y tomar decisiones, igual que en LAN. Guardar copias de seguridad antes de abrir ciudades importantes a personas desconocidas.

## Validaciones exigidas

1. Verificar que el artefacto de GitHub Actions contiene Node.js y \`cloudflared.exe\` sin instalaciones adicionales.
2. Crear una partida en un Windows anfitrión y obtener el enlace HTTPS sin abrir puertos.
3. Unirse desde otra conexión a Internet sin Radmin ni Hamachi y probar acciones simultáneas, chat, cursores y persistencia local.
4. Confirmar que los invitados no pueden consultar \`/api/saves\`, guardar/cargar ni crear una sala.
5. Configurar Supabase, comprobar listados, ocupación, desconexión y caducidad.
6. Probar suspensión/reanudación del PC, cortes de Internet, latencia y estabilidad durante varias horas.

No se debe confundir el éxito de las pruebas unitarias o del empaquetado con la verificación real de conectividad entre distintas redes.
