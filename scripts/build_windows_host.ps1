$ErrorActionPreference = 'Stop'

if ($env:OS -ne 'Windows_NT') {
  throw 'Este empaquetado requiere Windows: PyInstaller genera el ejecutable para el sistema anfitrión.'
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$python = Get-Command py -ErrorAction SilentlyContinue
if (-not $python) {
  throw 'Instalá Python 3.12 y el launcher py antes de empaquetar.'
}
$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
  throw 'Instalá Node.js 22 y verificá que node.exe esté en PATH.'
}

New-Item -ItemType Directory -Force runtime | Out-Null
Copy-Item -Force $node.Source runtime/node.exe
$cloudflared = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
Invoke-WebRequest -Uri $cloudflared -OutFile runtime/cloudflared.exe
& runtime/node.exe --version
& runtime/cloudflared.exe --version

py -3.12 -m pip install -r requirements-desktop.txt
py -3.12 -m PyInstaller --noconfirm --clean desktop_app.spec

$version = py -3.12 -c "import json; print(json.load(open('release_notes.json', encoding='utf-8'))['currentVersion'])"
$exe = Join-Path $root 'dist/CiudadViva.exe'
if (-not (Test-Path $exe)) { throw 'PyInstaller terminó sin generar dist/CiudadViva.exe.' }
Write-Host "Ciudad Viva Alfa $version listo: $exe"
