@echo off
title Genex Localhost Server Launcher
cd /d "%~dp0"
echo ==================================================
echo   Launching Genex Localhost Server...
echo ==================================================
echo.

start "" "http://localhost:3000"
node server.js

pause
