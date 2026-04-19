@echo off
cd /d "%~dp0"

echo ================================
echo    naman.atelier API Server
echo ================================

echo [1/3] Starting Docker container...
docker start artshop-db
if errorlevel 1 (
    echo WARNING: Could not start artshop-db. Make sure Docker Desktop is open first!
    pause
    exit
)

echo [2/3] Waiting for database...
timeout /t 3 /nobreak >nul

echo [3/3] Starting API server...
cd /d "%~dp0artifacts\api-server"

set PORT=3000
set NODE_ENV=development
set DATABASE_URL=postgresql://postgres:password@localhost:5432/artshop

REM Load extra vars from .env
for /f "usebackq tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"

call pnpm run build
call pnpm run start
pause
