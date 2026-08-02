@echo off
title Stop DiabetesGuard
taskkill /FI "WINDOWTITLE eq DG-Backend*"  /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq DG-Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq DG-Ngrok*"    /T /F >nul 2>&1
taskkill /IM ngrok.exe /F >nul 2>&1
echo All DiabetesGuard services stopped.
timeout /t 2 >nul
