# GitHub Actions en pausa

Los workflows se movieron fuera de `.github/workflows/` el 5 de noviembre de 2026 porque la cuenta agotó los 2.000 minutos incluidos. GitHub Actions no iniciará validaciones, paquetes Windows ni limpieza programada desde este repositorio mientras permanezcan en esta carpeta.

Revisar la cuota el **1 de diciembre de 2026**. Para reactivar las automatizaciones, mover `*.yml` de esta carpeta a `.github/workflows/` y hacer un commit. La publicación web sigue dependiendo de la integración Git de Vercel, no de estos workflows.

Durante la pausa, ejecutar `bash scripts/validate_local.sh` o `powershell -ExecutionPolicy Bypass -File scripts/validate_local.ps1` en una máquina con Python, Node.js, Playwright y Chromium. La prueba de WebRTC usa Supabase Realtime para señalización, sin escribir registros en la base. `RUN_RESPONSIVE=1` corre también los escenarios UI; `RUN_STRESS=1` activa los perfiles económicos; `RUN_SUPABASE_DIRECTORY_SMOKE=1` crea y elimina un anuncio temporal.

El empaquetado de Windows se puede hacer localmente en una PC Windows con Python 3.12 y Node.js 22 ejecutando `powershell -ExecutionPolicy Bypass -File scripts/build_windows_host.ps1`; genera `dist/CiudadViva.exe`. La publicación del archivo en GitHub Releases se hace manualmente desde esa PC.
