# GasNova

Sistema de gestión de estación de servicio integrado con el controlador Technotrade PTS-2 (jsonPTS). Incluye backend FastAPI, frontend React/Vite y despliegue vía Docker.

## Funcionalidades

- **Consola de dispensadores en tiempo real** — estado de cada cara/manguera vía WebSocket, autorización, bloqueo y parada de emergencia.
- **Configuración de caras y combustibles** — wizard guiado (`PumpConfigWizard`) para dar de alta una cara nueva, y botón **"Recuperar desde PTS-2"** en Ajustes que lee el mapeo real del controlador (caras, mangueras, grados de combustible) sin alterar la instalación física.
- **Conexión al controlador PTS-2** — IP configurable desde Ajustes; al guardar, el backend reconecta el cliente PTS-2 sin reiniciar el contenedor.
- **Cierre de turno con doble confirmación** — resumen de ventas por manguera, contadores mecánicos del PTS-2 vs. contadores del sistema (con diferencia), impresión térmica con firmas, y desbloqueo automático de todas las caras al confirmar el cierre.
- **Persistencia de auditoría** — cada cierre de turno guarda su desglose de contadores (`counter_breakdown`) en `shift_closures` para trazabilidad histórica.
- **Permisos por rol** — control de acceso a pantallas y acciones (`usePermissions`, `permissions.ts`) para Administrador, Supervisor y Operador.
- **Recuperación de transacciones** — sincronización desde la tarjeta SD del PTS-2 (`sync.py`) para no perder ventas si el WebSocket estuvo caído.

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
- Dos archivos: `docker-compose.yml` y `backend/.env` (copiar desde `backend/.env.example` y ajustar `PTS2_HOST` y los PINes de usuarios semilla para esa estación — la IP del PTS-2 también puede cambiarse luego desde **Ajustes** sin reiniciar).

### Instalación / actualización

```bash
docker compose pull       # descarga la última versión de las imágenes
docker compose up -d      # levanta db + backend + frontend
```

Ese mismo comando sirve para actualizar más adelante: `docker compose pull && docker compose up -d` descarga las imágenes nuevas y reinicia los contenedores sin tocar los datos — el volumen `gasnova_data` de PostgreSQL es independiente de las imágenes y persiste entre actualizaciones.

- Frontend: `http://localhost`
- Backend / Swagger: `http://localhost:8002/docs`

### Acceder como `http://gasnova.local` en la red local

`gasnova.local` es un nombre mDNS que resuelve el sistema operativo, no algo que se configure dentro de Docker. Dos formas de habilitarlo:

- **Windows / macOS (recomendado, sin tocar Docker):** renombrar la PC como `gasnova` en la configuración del equipo. Ambos sistemas traen resolución mDNS nativa y responden automáticamente en `gasnova.local` a cualquier otro dispositivo de la misma red.
- **Linux:** el `docker-compose.yml` incluye el servicio `gasnova-mdns` (imagen `flungo/avahi`, `network_mode: host`) que anuncia el hostname `gasnova` por mDNS. Se levanta automáticamente con `docker compose up -d`; para desactivarlo, comentar el servicio en `docker-compose.yml`.

Solo funciona dentro de la misma red local (no es un dominio público) y requiere que los dispositivos que acceden tengan soporte mDNS/Bonjour (Windows, macOS y la mayoría de móviles ya lo traen).

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
