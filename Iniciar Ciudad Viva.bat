@echo off
set "GAME_DIR=%~dp0"
where pyw >nul 2>nul
if %errorlevel%==0 (
  start "Ciudad Viva" pyw -3 "%GAME_DIR%server.py" --no-browser
) else (
  where pythonw >nul 2>nul
  if %errorlevel%==0 (start "Ciudad Viva" pythonw "%GAME_DIR%server.py" --no-browser) else (
    echo No se encontro Python 3.9 o superior. Instala Python y volve a abrir este archivo.
    pause
    exit /b 1
  )
)
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/"
