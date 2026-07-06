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
- **Impresión multi-POS** — soporta varias PCs accediendo a la misma estación, cada una con su propia impresora (USB, red o vía agente remoto). Ver [Impresión en múltiples POS](#impresión-en-múltiples-pos).

## Estructura

```text
GasNova/
├── backend/                        # SDK PTS-2, FastAPI, Swagger, WebSocket, tests
├── frontend/                       # Aplicación web del POS/dashboard
├── scripts/
│   └── generate-certs.sh           # Genera el certificado HTTPS para gasnova.local
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

- Frontend: `http://localhost` (redirige a `https://localhost` — ver sección HTTPS)
- Backend / Swagger: `http://localhost:8002/docs`

### Acceder como `http://gasnova.local` en la red local

`gasnova.local` es un nombre mDNS que resuelve el sistema operativo, no algo que se configure dentro de Docker. Dos formas de habilitarlo:

- **Windows / macOS (recomendado, sin tocar Docker):** renombrar la PC como `gasnova` en la configuración del equipo. Ambos sistemas traen resolución mDNS nativa y responden automáticamente en `gasnova.local` a cualquier otro dispositivo de la misma red.
- **Linux:** el `docker-compose.yml` incluye el servicio `gasnova-mdns` (imagen `flungo/avahi`, `network_mode: host`) que anuncia el hostname `gasnova` por mDNS. Se levanta automáticamente con `docker compose up -d`; para desactivarlo, comentar el servicio en `docker-compose.yml`.

Solo funciona dentro de la misma red local (no es un dominio público) y requiere que los dispositivos que acceden tengan soporte mDNS/Bonjour (Windows, macOS y la mayoría de móviles ya lo traen).

### HTTPS para `gasnova.local`

El frontend sirve HTTPS en el puerto 443 (con redirect automático desde 80). **Totalmente automático, no hay que ejecutar nada**: la primera vez que arranca el contenedor, genera él mismo:

1. Una **CA (autoridad certificadora) propia** de esa instalación, persistida en `./certs/` — se crea una sola vez y se reutiliza en cada reinicio o actualización.
2. Un **certificado para `gasnova.local`** firmado por esa CA.

Con esto, `https://gasnova.local` funciona de inmediato, aunque el navegador seguirá mostrando advertencia de "no seguro" hasta que esa CA se marque como confiable.

**Único paso manual restante (y es inevitable por diseño de seguridad — ninguna herramienta puede saltárselo):** decirle a cada dispositivo que confíe en esa CA. Se hace visitando, desde el navegador de ese dispositivo (PC, tablet, celular en la misma red):

```
http://<IP-o-nombre-de-esta-PC>/gasnova-ca.crt
```

y aceptando instalarlo como certificado de confianza raíz. Una vez hecho, `https://gasnova.local` deja de mostrar advertencias en ese dispositivo — sin terminal, sin scripts, un solo clic por dispositivo.

`./certs/` no se versiona en git (contiene claves privadas).

**Alternativa avanzada:** si prefieres usar [mkcert](https://github.com/FiloSottile/mkcert) en vez de la CA autogenerada (por ejemplo, para instalar la CA automáticamente en la máquina donde corres el script), sigue disponible:

```bash
bash scripts/generate-certs.sh [IP_DE_LA_ESTACION]
docker compose restart gasnova-frontend
```

### Administrar la base de datos (pgAdmin)

El `docker-compose.yml` incluye [pgAdmin](https://www.pgadmin.org/) para explorar/editar la base de datos PostgreSQL desde el navegador — útil para depurar datos sin entrar por `psql`.

```
http://localhost:5050
```

Login por defecto: `admin@gasnova.com` / `gasnova_admin` (cambiar con las variables de entorno `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` antes de `docker compose up`). Al conectar un servidor nuevo dentro de pgAdmin:

- **Host:** `gasnova-db`
- **Puerto:** `5432`
- **Usuario/clave:** los mismos de `gasnova-db` en `docker-compose.yml` (`gasnova` / `gasnova_secret` por defecto)

Para desactivarlo, comentar el servicio `gasnova-pgadmin` en `docker-compose.yml`.

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

## Impresión en múltiples POS

Todas las PCs de una estación acceden al mismo backend central (`https://gasnova.local`), pero cada una puede tener su **propia impresora física**. GasNova separa "qué imprimir" (calculado en el backend) de "dónde se imprime físicamente" (por PC), a través de **estaciones de impresión** configurables en **Ajustes → Impresora → Estaciones de Impresión (Multi-POS)**.

Cada estación (`POS-1`, `POS-2`, ...) define un modo de impresión:

| Modo | Cuándo usarlo | Campo destino |
|---|---|---|
| **Local** | Impresora USB conectada a la misma PC donde corre el backend (`gasnova-backend`). | Vacío = autodetecta; o el nombre exacto de la impresora. |
| **Red directa** | Impresora térmica con IP propia (Ethernet/WiFi). El backend le envía los bytes ESC/POS directo por TCP, sin importar qué PC hizo la venta. | `IP:puerto`, ej. `192.168.1.50:9100`. |
| **Agente remoto** | Impresora USB conectada a **otra PC** (no la del backend). Esa PC corre un agente liviano (`backend/print_agent/`) que recibe los bytes por HTTP y los envía a su impresora local. | URL del agente, ej. `http://192.168.1.20:9200`. |

### Configurar una PC con impresora USB remota

En la PC que tiene la impresora conectada (no necesita el resto del backend):

```bash
cd backend/print_agent
bash run_agent.sh        # o run_agent.bat en Windows
```

Esto instala sus dependencias en un venv local y deja el agente escuchando en el puerto `9200`. Luego, en **Ajustes → Impresora**, se crea la estación con modo **Agente remoto** apuntando a `http://IP_DE_ESA_PC:9200`.

### Identificar cada PC como su estación

Cada navegador guarda localmente (vía `localStorage`) a qué estación pertenece, en el selector **"Esta PC es la estación"** dentro del mismo panel. Así, cuando esa PC imprime un ticket o un cierre de turno, el backend sabe a cuál impresora enviarlo.

Si no se configura ninguna estación, el sistema usa la impresora local única del servidor (comportamiento original, válido para instalaciones de un solo POS).

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
