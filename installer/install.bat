@echo off
REM GasNova — instalacion / actualizacion con un solo script.
REM
REM Descarga docker-compose.yml desde el repositorio y levanta (o actualiza)
REM los contenedores. Correr este mismo script mas adelante actualiza la
REM instalacion existente sin perder datos (el volumen de PostgreSQL persiste).
REM
REM Uso: doble clic en install.bat, o desde cmd: install.bat
REM
REM Requisitos: Docker Desktop instalado y corriendo.

setlocal
set REPO_RAW=https://raw.githubusercontent.com/Jortega16/GasNova/main
cd /d "%~dp0"

echo ===================================================
echo   GasNova - Instalacion / Actualizacion
echo ===================================================

echo.
echo [INFO] Descargando docker-compose.yml...
curl -fsSL "%REPO_RAW%/docker-compose.yml" -o docker-compose.yml
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo descargar docker-compose.yml. Verifica tu conexion a internet.
    pause
    exit /b 1
)

if not exist backend mkdir backend
if not exist backend\logs mkdir backend\logs
if not exist backend\reports mkdir backend\reports

if not exist backend\.env (
    echo.
    echo [INFO] No existe backend\.env - descargando plantilla...
    curl -fsSL "%REPO_RAW%/backend/.env.example" -o backend\.env
    echo [AVISO] Edita backend\.env y ajusta PTS2_HOST con la IP del controlador de esta estacion.
) else (
    echo.
    echo [INFO] backend\.env ya existe - se conserva tal cual.
)

echo.
echo [INFO] Descargando la ultima version de las imagenes...
docker compose pull
if %errorlevel% neq 0 (
    echo [ERROR] Fallo docker compose pull. Verifica que Docker Desktop este corriendo.
    pause
    exit /b 1
)

echo.
echo [INFO] Levantando los contenedores...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Fallo docker compose up.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   GasNova instalado/actualizado correctamente
echo.
echo   Frontend:  http://localhost
echo   Backend:   http://localhost:8002/docs
echo   pgAdmin:   http://localhost:5050
echo ===================================================
pause
