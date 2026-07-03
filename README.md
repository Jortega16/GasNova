# GasNova

Sistema de gestión de estación de servicio integrado con el controlador Technotrade PTS-2 (jsonPTS). Incluye backend FastAPI, frontend React/Vite y despliegue vía Docker.

## Estructura

```text
GasNova/
├── backend/                        # SDK PTS-2, FastAPI, Swagger, WebSocket, tests
├── frontend/                       # Aplicación web del POS/dashboard
├── docker-compose.yml              # Producción: descarga imágenes desde ghcr.io
├── docker-compose.dev.yml          # Desarrollo: construye desde el código local
└── .github/workflows/
    └── docker-publish.yml          # CI: publica imágenes en ghcr.io en cada push/tag
```

## Despliegue con Docker (recomendado)

El stack completo (PostgreSQL + backend + frontend) corre en 3 contenedores. Las imágenes se publican automáticamente en **GitHub Container Registry (ghcr.io)** en cada push a `main` o al crear un tag `v*`. En la PC destino la instalación y las actualizaciones son un solo comando de `docker compose` — no requiere clonar el código fuente ni scripts adicionales.

### Requisitos en la PC destino

- Docker Desktop (o Docker Engine + Compose plugin) instalado.
- Dos archivos: `docker-compose.yml` y `backend/.env` (con la configuración del PTS-2 de esa estación).

### Instalación / actualización

```bash
docker compose pull       # descarga la última versión de las imágenes
docker compose up -d      # levanta db + backend + frontend
```

Ese mismo comando sirve para actualizar más adelante: `docker compose pull && docker compose up -d` descarga las imágenes nuevas y reinicia los contenedores sin tocar los datos — el volumen `gasnova_data` de PostgreSQL es independiente de las imágenes y persiste entre actualizaciones.

- Frontend: `http://localhost`
- Backend / Swagger: `http://localhost:8002/docs`

Para fijar una versión específica en vez de `:latest`, exporta las variables antes de `pull`/`up`:

```bash
export BACKEND_IMAGE=ghcr.io/jortega16/gasnova-backend:v1.1.0
export FRONTEND_IMAGE=ghcr.io/jortega16/gasnova-frontend:v1.1.0
docker compose pull && docker compose up -d
```

### Publicar una nueva versión (desde el repo de desarrollo)

```bash
git push origin main             # publica :latest automáticamente
git tag v1.1.0 && git push origin v1.1.0   # publica versión etiquetada
```

GitHub Actions construye y sube `ghcr.io/jortega16/gasnova-backend` y `ghcr.io/jortega16/gasnova-frontend`. Las imágenes deben marcarse como públicas una vez en **GitHub → Packages → Package settings → Change visibility** para que la PC destino no necesite login.

### Desarrollo local (build desde el código fuente)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
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

Flujo de transacciones pendientes:

```text
PTS-2 termina venta
  -> backend guarda en pending_transactions
  -> POS lista GET /pumps/pending-transactions
  -> POS cobra/factura
  -> POS procesa POST /pumps/{pump_id}/pending-transactions/{trx_id}/process
  -> backend mueve a pump_transactions
```

Endpoints principales para pendientes:

```text
GET    /pumps/pending-transactions
POST   /pumps/{pump_id}/pending-transactions
POST   /pumps/{pump_id}/pending-transactions/capture
POST   /pumps/{pump_id}/pending-transactions/{trx_id}/process
DELETE /pumps/{pump_id}/pending-transactions/{trx_id}
```

Ejemplo para procesar una pendiente:

```json
{
  "payment_type": "Cash",
  "status": "Completed"
}
```

## Frontend

Aplicación React + TypeScript (Vite + Tailwind) con la interfaz del POS/dashboard.

```bash
cd frontend
npm install
npm run dev          # servidor de desarrollo en http://localhost:3000
npm run build         # build de producción a dist/
```

En producción (contenedor Docker) el frontend se sirve con nginx y llama al backend vía proxy interno (`/api/`, `/ws/`) — ver `frontend/Dockerfile` y `frontend/nginx.conf`.
