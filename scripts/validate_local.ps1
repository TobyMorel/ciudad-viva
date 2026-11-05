$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '== Python syntax =='
python -m py_compile server.py public_servers.py shared_engine.py desktop_app.py scripts/smoke_public_directory.py

Write-Host '== JavaScript syntax =='
Get-ChildItem -File -Path $root | Where-Object { $_.Extension -in '.js', '.mjs' } | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Error de sintaxis: $($_.Name)" }
}

Write-Host '== JSON files =='
python -m json.tool public_directory.json | Out-Null
python -m json.tool release_notes.json | Out-Null
python -m json.tool offline_seed.json | Out-Null

Write-Host '== Python regression suite =='
python -m unittest discover -s tests -p 'test_*.py' -v
if ($LASTEXITCODE -ne 0) { throw 'Falló la regresión Python.' }

Write-Host '== Offline JavaScript regression suite =='
$offlineTests = Get-ChildItem tests -Filter '*_offline.mjs' | ForEach-Object { $_.FullName }
$namedTests = @('test_city_guide.mjs','test_beginner_tutorial.mjs','test_city_insights.mjs','test_city_spectacle.mjs','test_living_city.mjs','test_city_immersive.mjs','test_cursor_motion.mjs','test_cursor_presence.mjs','test_traffic_model.mjs','test_simulation_time.mjs','test_metro_visuals.mjs') | ForEach-Object { Join-Path (Join-Path $root 'tests') $_ }
$nodeTests = @($offlineTests) + @($namedTests)
node --test $nodeTests
if ($LASTEXITCODE -ne 0) { throw 'Falló la regresión JavaScript.' }

Write-Host '== Public WebRTC browser integration (Supabase Realtime, no database writes) =='
node tests/test_public_webrtc_ui.mjs
if ($LASTEXITCODE -ne 0) { throw 'Falló la prueba WebRTC.' }
node tests/test_public_room_directory_ui.mjs
if ($LASTEXITCODE -ne 0) { throw 'Falló la interfaz del directorio público.' }

if ($env:RUN_RESPONSIVE -eq '1') {
  Write-Host '== Responsive browser suite =='
  Get-ChildItem tests -Filter '*_ui.mjs' | ForEach-Object {
    node $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Falló la prueba responsive $($_.Name)" }
  }
}
if ($env:RUN_STRESS -eq '1') {
  Write-Host '== 30-year economic stress profiles =='
  python tests/stress_30_years.py
  if ($LASTEXITCODE -ne 0) { throw 'Falló el estrés económico.' }
}
if ($env:RUN_SUPABASE_DIRECTORY_SMOKE -eq '1') {
  Write-Host '== Temporary Supabase room smoke (publishes then removes a test room) =='
  python scripts/smoke_public_directory.py
  if ($LASTEXITCODE -ne 0) { throw 'Falló el smoke de Supabase.' }
}

git diff --check HEAD
if ($LASTEXITCODE -ne 0) { throw 'El diff tiene errores de whitespace.' }
Write-Host 'Validación local completada.'
