@echo off
REM Starts the CivicFix React app on http://localhost:5173
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing frontend packages...
    call npm install
)
call npm run dev
pause
