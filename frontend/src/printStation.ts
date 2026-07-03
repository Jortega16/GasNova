// Identifica a qué estación de impresión pertenece esta PC/navegador.
// Se guarda en localStorage porque es una configuración física de la
// máquina (qué impresora tiene conectada), no del usuario que inició sesión.

const STORAGE_KEY = "gasnova_print_station_id";

export function getPrintStationId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setPrintStationId(stationId: string): void {
  try {
    if (stationId) {
      localStorage.setItem(STORAGE_KEY, stationId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* localStorage no disponible — ignorar */
  }
}
