@echo off
setlocal
cd /d "%~dp0"
set "TEMP=D:\DevTemp"
set "TMP=D:\DevTemp"
set "npm_config_cache=%~dp0.cache\npm"
echo Starlight Observation Lab
echo Open http://localhost:5183/ in your browser.
if not exist "node_modules\vite\bin\vite.js" (
  echo Dependencies are missing. Run npm install in this folder first.
  pause
  exit /b 1
)
call npm.cmd run dev
pause
