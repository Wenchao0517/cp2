@echo off
title DiabetesGuard Launcher
cd /d E:\cp2\cp2

echo Starting DiabetesGuard...
echo.

start "DG-Backend"  cmd /k "cd /d E:\cp2\cp2 && call venv\Scripts\activate && cd backend && python run.py"
timeout /t 3 /nobreak >nul

start "DG-Frontend" cmd /k "cd /d E:\cp2\cp2\frontend && npm run dev"
timeout /t 5 /nobreak >nul

start "DG-Ngrok"    cmd /k "E:\cp2\ngrok.exe http 5173"

echo.
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173
echo   Public   : see the DG-Ngrok window for the https link
echo.
echo Three windows opened. Closing THIS window is safe.
echo To stop everything, close the three DG-* windows.
echo.
pause
