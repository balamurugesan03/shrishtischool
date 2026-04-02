@echo off
echo Starting School Management System...
echo.
echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Both servers started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause
