# Ciudad Viva · Directorio online autoalojado (Alfa 0.280)

## Estado real

**Proyecto Supabase conectado:** CiudadViva. El directorio de metadatos está alojado en `https://tcglqhxoymnmbxxaaweq.supabase.co`, pero **ninguna partida ni motor de simulación reside allí**. La base de datos solamente registra nombre de ciudad, anfitrión, enlace HTTPS, ocupación y última actividad.

**Los jugadores no necesitan instalar Supabase, Cloudflare ni Node.** El `CiudadViva.exe` ya empaqueta el juego, el motor Node y el conector `cloudflared.exe`. Al elegir **Crear servidor público**, el servidor arranca en su PC y la app crea un túnel HTTPS saliente sin abrir puertos. Al elegir **Servidores públicos**, el ejecutable y GitHub Pages leen el mismo listado global.

La **clave publicable** en `public_directory.json` es segura para distribuir. La **service role key** sólo existe como variable privada gestionada por el runtime de Supabase Edge Functions, **nunca** en GitHub, en el ejecutable ni en un navegador.

## Seguridad de publicación y descubrimiento

- La tabla `public.public_rooms` tiene RLS habilitada y sólo concede `SELECT` sobre columnas públicas, para filas activas de los últimos 90 segundos. Nadie puede leer `owner_secret_hash` ni escribir directamente desde una clave pública.
- La función `public-rooms` permite `publish` y `unpublish` desde el backend local. El anfitrión genera un identificador UUIDv4 y un secreto aleatorio de 256 bits por sesión; Supabase almacena únicamente el hash SHA-256. Las actualizaciones y bajas requieren conocer el secreto original. Es un protocolo por sala, sin registro de usuario ni autenticación de Supabase en cada PC.
- El anuncio se renueva cada 24 segundos y deja de ser visible automáticamente tras 90 segundos sin actividad.
- La función valida el hostname `*.trycloudflare.com`, los límites de jugadores y nombres y restringe la creación de varias salas desde una conexión.
- El proxy local, accesible desde el túnel, sólo entrega archivos públicos y rutas de jugador permitidas. Impide consultar guardados, crear otra sala o ejecutar funciones administrativas. Cada invitado obtiene su propio ID de jugador y una cookie `HttpOnly` y `Secure`.
- LAN, Radmin VPN y Hamachi siguen funcionando como antes. Los cursores públicos utilizan HTTP polling, debido a la restricción de SSE en Cloudflare Quick Tunnels.

## Arquitectura

```text
Ciudad Viva.exe (PC del anfitrión)
  ├── Motor autoritativo offline.js / Node.js
  ├── Guardados locales
  ├── Servidor HTTP LAN
  └── Proxy de invitados → túnel HTTPS de Cloudflare
                                  ↑
                          Invitados remotos

Supabase CiudadViva
  ├── Tabla public_rooms: sólo anuncios efímeros
  └── Edge Function public-rooms: verificar token y publicar / retirar

GitHub Pages y CiudadViva.exe → leen el directorio público
```

## Archivos y mantenimiento

- `public_directory.json`: URL y clave **publicable** del proyecto central, descargadas automáticamente por ejecutables que no tengan configuración embebida.
- `public_servers.py`: gestión del túnel, proxy de visitantes, sesiones individuales y conexión con Supabase.
- `supabase/functions/public-rooms/index.ts`: código de la función Edge; su `verify_jwt` es false **porque implementa autorización propia por secreto de sala de 256 bits**.
- `supabase/public_rooms_schema.sql`: estructura de tabla y permisos de sólo lectura para clientes.
- `scripts/smoke_public_directory.py`: comprobación de publicación, acceso anónimo de sólo lectura, rechazo de un secreto incorrecto y retirada segura.
- `tests/test_public_servers.py`: comprobaciones offline de autorización y resistencia del proxy.

## Límites y seguridad operativa

**Cloudflare Quick Tunnels es un mecanismo experimental destinado a pruebas/desarrollo, no a producción.** Su disponibilidad, latencia y enlace temporal no están garantizados. El directorio está funcional, pero una oferta pública estable para una comunidad grande necesita un servicio de túneles gestionados/retransmisión compatible con sus condiciones de uso. Los jugadores nunca deberían conectar una ciudad importante con desconocidos sin una copia local.

El prototipo todavía no incluye bloqueo/baneo, moderación de chat, sistema antitrampas, reconexión persistente entre reinicios ni defensas completas contra abuso masivo. Quien entra en una partida pública participa en las decisiones, como en LAN.

La base Supabase del plan Free tiene cuotas y límites; si el número de salas y consultas crece, habrá que supervisar su consumo. La simulación nunca deberá trasladarse a esa base.
