@echo off
:: Script de arranque nativo de GasNova Backend para Windows.
::
:: AVISO: este script es una alternativa de DESARROLLO para correr el
:: backend directamente en Windows con Python, sin Docker. Si ya usas
:: GasNova en produccion, el metodo soportado es "docker compose up -d"
:: (ver README.md) y NO necesitas ejecutar este archivo.
title GasNova Backend Service

echo ===================================================
echo   Iniciando GasNova Backend - Servicio Nativo Windows
echo   (Modo desarrollo sin Docker - Docker Compose es el
echo    metodo recomendado para produccion, ver README.md)
echo ===================================================
echo.

:: 1. Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Python 3.10 o superior y asegurate de marcar
    echo la opcion "Add Python to PATH" en el instalador.
    pause
    exit /b 1
)

:: 2. Crear entorno virtual si no existe
if not exist .venv (
    echo [INFO] Creando entorno virtual .venv...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
)

:: 3. Activar entorno virtual e instalar/actualizar dependencias
echo [INFO] Activando entorno virtual...
call .venv\Scripts\activate.bat

echo [INFO] Instalando/Actualizando dependencias de requirements.txt...
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Error instalando dependencias.
    pause
    exit /b 1
)

:: 4. Lanzar el servidor FastAPI
echo [INFO] Iniciando API de Impresion y SDK en puerto 8002...
uvicorn pts2_api.main:app --host 0.0.0.0 --port 8002 --reload
if %errorlevel% neq 0 (
    echo [ERROR] El servicio de FastAPI se detuvo de forma inesperada.
    pause
)
