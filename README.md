# GasNova

Proyecto separado en backend y frontend.

## Estructura

```text
GasNova/
├── backend/   # SDK PTS-2, FastAPI, Swagger, WebSocket, Docker, tests
└── frontend/  # Aplicacion web del POS/dashboard
```

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[all]"
uvicorn pts2_api.main:app --host 0.0.0.0 --port 8000 --reload
```

Documentacion:

```text
http://localhost:8000/docs
http://localhost:8000/redoc
http://localhost:8000/redocs
```

## Frontend

La carpeta `frontend/` queda preparada para crear la interfaz web del POS o dashboard.
