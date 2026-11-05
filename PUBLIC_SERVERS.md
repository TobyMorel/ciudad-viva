
# Ciudad Viva · Conectividad híbrida WebRTC + Cloudflare (Alfa 0.290)

La app Windows permite **WebRTC directo primero** y, si falla la conexión P2P, **Cloudflare Quick Tunnel como respaldo automático**. No se abren puertos, no hace falta instalar utilidades ni pagar un servidor central.

## Qué hace realmente cada componente

1. El anfitrión crea una sala pública desde `CiudadViva.exe`. La app intenta arrancar el túnel Cloudflare y registra la sala en Supabase. **Si Cloudflare falla**, el anfitrión intenta WebRTC igualmente.
2. La ventana del anfitrión inicia un canal público de **señalización** en Supabase Realtime, genera una clave ECDSA P-256 y registra sólo su clave pública en la ficha de la sala. No manda estados de juego a Supabase.
3. Cada invitado —desde el **.exe Windows o GitHub Pages**— elige una sala e intenta WebRTC: intercambio de SDP a través de Supabase; tráfico de juego por `RTCDataChannel` cifrado por DTLS. El invitado verifica la firma del anfitrión contra la clave registrada en Supabase, para impedir suplantaciones durante la negociación.
4. Si el enlace WebRTC no abre, se utiliza automáticamente el enlace Cloudflare del mismo anuncio, siempre que el anfitrión lo haya conseguido. Si la sesión WebRTC establecida se corta, la app también intenta pasarse al túnel.
5. Si Cloudflare no está disponible, la sala se anuncia como **sólo WebRTC**. Los clientes que no pueden abrir un canal P2P reciben un error comprensible en lugar de perder su partida local.
6. La simulación permanece en el motor Node de la PC anfitriona. El navegador de ésta retransmite únicamente las peticiones permitidas al servidor local, asignando **identidades de jugador exclusivas**, limitando el tráfico y rechazando funciones administrativas por WebRTC.
7. GitHub Pages y la app Windows intentan WebRTC directamente. Si falla y existe un enlace Cloudflare, el navegador lo abre como respaldo. La configuración pública se resuelve respecto de la ruta del sitio, incluso cuando GitHub Pages publica el juego bajo `/ciudad-viva/`.

## Capacidad, directorio y costos

- **Hasta 13 jugadores por sala**, incluido anfitrión, aplicados por el servidor.
- **Sin cupo global de servidores públicos** artificial.
- **Recarga manual cada 30 segundos**; las fichas de sala se actualizan por el anfitrión cada cinco minutos y expiran a los 12 minutos sin actividad.
- Supabase guarda **solamente metadatos, clave pública del anfitrión y mensajes efímeros de señalización**; no partidas, acciones ni guardados.
- El proyecto Free de Supabase tiene límites reales de conexiones Realtime y mensajes. Cada anfitrión mantiene sólo una conexión de señalización mientras tiene una sala pública abierta. Los invitados cierran su conexión de señalización cuando termina la negociación.
- La conexión WebRTC directa **no está garantizada** con NAT simétrico o firewalls restrictivos: sin TURN puede fallar. Por eso se conserva Cloudflare como alternativa. Cloudflare Quick Tunnels sigue siendo **experimental**, sin garantía de disponibilidad para producción pública; tampoco tiene ancho de banda ilimitado garantizado.
- La compatibilidad entre **dos redes domésticas reales** sigue requiriendo una prueba de campo. La prueba local ejecuta dos navegadores Chromium, señalización real en Supabase, un RTCDataChannel con un mensaje grande fragmentado, autorización por jugador y denegación de APIs de administrador. Las pruebas automáticas de GitHub Actions están pausadas hasta el 1 de diciembre de 2026 por el límite mensual de minutos.

## Seguridad

- El anuncio público sólo permite actualizar la sala usando el secreto aleatorio de 256 bits del anfitrión. La clave de servicio de Supabase nunca va al ejecutable.
- La ficha de sala contiene `rtc_enabled` y `rtc_public_key`, una clave ECDSA pública, que es segura para compartir.
- Las ofertas y respuestas SDP viajan por un canal público de señalización y pueden revelar información de conectividad ICE a los participantes del canal. No se deben almacenar como metadatos permanentes.
- El anfitrión firma la respuesta SDP y el invitado valida la firma; la señalización pública no puede reemplazar unilateralmente al anfitrión.
- Las acciones se reciben por un canal SCTP confiable con DTLS. Se imponen tamaño de mensajes, fragmentación de respuestas grandes, control de congestión y lista blanca de APIs. No se exponen guardados ni reinicios de ciudad.
- Esta es una **alfa**, no una infraestructura lista para uso masivo: faltan moderación, antitrampas, mediciones de latencia bajo carga, TURN seguro y garantía de disponibilidad.

## Archivos

- `public_rtc.js`: canal WebRTC, protocolo Supabase Realtime, firma y verificación ECDSA, intercambio de acciones y fallback.
- `public_servers.py`: intenta el túnel, anuncia ambas rutas, soporta RTC sin Cloudflare.
- `server.py`: activación WebRTC sólo desde la PC anfitriona y acceso público local a la configuración publicable.
- `supabase/functions/public-rooms/index.ts`: anuncia salas con uno o ambos transportes, validando la clave ECDSA.
- `supabase/migrations/20261105_webrtc_hybrid_rooms.sql`: esquema y política de la ficha híbrida.
- `tests/test_public_webrtc_ui.mjs`: dos navegadores reales contra Supabase Realtime y la API local simulada.
- `scripts/build_windows_host.ps1`: vuelve a generar `dist/CiudadViva.exe` en Windows sin GitHub Actions.
- `scripts/smoke_public_directory.py`: publicación, edición, retiro, modo sólo RTC y rechazo de registros sin transporte.
- `tests/test_public_servers.py`: pruebas del servidor y del modo sin Cloudflare.
