@echo off
title Genex MedTech - Cloudflare Secure Tunnel
echo ===================================================
echo   Starting Genex Local Server and Cloudflare Tunnel
echo ===================================================
start /B node server.js
timeout /t 2 /nobreak >nul
.\cloudflared.exe tunnel --url http://localhost:3000
