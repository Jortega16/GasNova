@echo off
REM Agente de impresion local GasNova - Windows
cd /d "%~dp0"

if not exist ".venv" (
    echo Creando entorno virtual...
    python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo.
echo ══════════════════════════════════════════════
echo   GasNova Print Agent
echo   Escuchando en el puerto 9200
echo ══════════════════════════════════════════════
echo.

python agent.py
pause
