#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Python syntax =="
python -m py_compile server.py public_servers.py shared_engine.py desktop_app.py scripts/smoke_public_directory.py scripts/build_wasm_route.py

echo "== JavaScript syntax =="
find . -maxdepth 1 -type f \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -r -n1 node --check

echo "== JSON files =="
python -m json.tool public_directory.json >/dev/null
python -m json.tool release_notes.json >/dev/null
python -m json.tool offline_seed.json >/dev/null

echo "== Python regression suite =="
python -m unittest discover -s tests -p 'test_*.py' -v

echo "== Offline JavaScript regression suite =="
node --test tests/*_offline.mjs tests/test_city_guide.mjs tests/test_beginner_tutorial.mjs tests/test_city_insights.mjs tests/test_city_spectacle.mjs tests/test_living_city.mjs tests/test_city_immersive.mjs tests/test_cursor_motion.mjs tests/test_cursor_presence.mjs tests/test_traffic_model.mjs tests/test_simulation_time.mjs tests/test_metro_visuals.mjs

echo "== Offline recovered save slots and browser delete controls =="
node tests/test_offline_slot_management.mjs

echo "== Rust/WebAssembly road routing =="
node tests/test_wasm_route.mjs

echo "== WebGPU renderer and automatic WebGL 2 fallback =="
node tests/test_render_backend.mjs

echo "== Public WebRTC browser integration (uses Supabase Realtime, no database writes) =="
node tests/test_public_webrtc_ui.mjs

echo "== Public room directory UI and RTC-only rooms =="
node tests/test_public_room_directory_ui.mjs

if [[ "${RUN_RESPONSIVE:-0}" == "1" ]]; then
  echo "== Responsive browser suite =="
  for test in tests/*_ui.mjs; do node "$test"; done
fi

if [[ "${RUN_STRESS:-0}" == "1" ]]; then
  echo "== 30-year economic stress profiles =="
  python tests/stress_30_years.py
fi

if [[ "${RUN_SUPABASE_DIRECTORY_SMOKE:-0}" == "1" ]]; then
  echo "== Temporary Supabase directory smoke (publishes and then deletes a test room) =="
  python scripts/smoke_public_directory.py
fi

echo "== Patch whitespace =="
git diff --check HEAD

echo "Validación local completada. La prueba Supabase de smoke que crea un anuncio efímero se ejecuta aparte: python scripts/smoke_public_directory.py"
