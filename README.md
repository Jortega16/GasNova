# GasNova

Sistema de gestión de estación de servicio integrado con el controlador Technotrade PTS-2 (jsonPTS). Incluye backend FastAPI, frontend React/Vite y despliegue vía Docker.

## Estructura

```text
GasNova/
├── backend/                        # SDK PTS-2, FastAPI, Swagger, WebSocket, Docker, tests
├── frontend/                       # Aplicación web del POS/dashboard
├── docker-compose.yml              # Orquesta db + backend + frontend
├── scripts/
│   ├── build.sh                    # Construye y exporta imágenes a .tar.gz
│   ├── install.sh                  # Instala en una PC nueva (ghcr.io o tarball)
│   └── update.sh                   # Actualiza sin perder datos
└── .github/workflows/
    └── docker-publish.yml          # CI: publica imágenes en ghcr.io
```

## Despliegue con Docker (recomendado)

El stack completo (PostgreSQL + backend + frontend) corre en 3 contenedores orquestados por `docker-compose.yml`. Las imágenes se publican automáticamente en **GitHub Container Registry (ghcr.io)** en cada push a `main` o al crear un tag `v*`.

### Primera instalación en una PC nueva

Requisito: Docker Desktop instalado.

```bash
git clone https://github.com/Jortega16/GasNova.git
cd GasNova
bash scripts/install.sh          # descarga :latest desde ghcr.io
# o una versión específica:
bash scripts/install.sh v1.0.0
```

- Frontend: `http://localhost`
- Backend / Swagger: `http://localhost:8002/docs`

### Actualizar una instalación existente

Los datos de PostgreSQL se conservan (volumen `gasnova_data` independiente de las imágenes).

```bash
bash scripts/update.sh           # actualiza a :latest
bash scripts/update.sh v1.1.0    # versión específica
```

### Publicar una nueva versión (desde el repo de desarrollo)

```bash
git push origin main             # publica :latest automáticamente
git tag v1.1.0 && git push origin v1.1.0   # publica versión etiquetada
```

GitHub Actions construye y sube `ghcr.io/jortega16/gasnova-backend` y `ghcr.io/jortega16/gasnova-frontend`. Las imágenes deben marcarse como públicas una vez en **GitHub → Packages → Package settings → Change visibility** para que la PC destino no necesite login.

### Alternativa sin registro (USB / red local)

```bash
bash scripts/build.sh 1.0.0      # genera gasnova-1.0.0.tar.gz
# copiar el .tar.gz + docker-compose.yml + backend/.env a la PC destino
bash scripts/install.sh gasnova-1.0.0.tar.gz
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
