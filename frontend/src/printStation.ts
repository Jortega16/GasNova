// Identifica a qué estación/TPV pertenece esta PC/navegador — es la misma
// identidad para el código de TPV (facturación) y para la impresora que le
// corresponde (ver panel "Estaciones de Impresión" en Ajustes). Se guarda en
// localStorage porque es una configuración física de la máquina, no del
// usuario que inició sesión.

const STORAGE_KEY = "gasnova_print_station_id";
const LOCATION_KEY = "gasnova_station_location";

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

export function getStationLocation(): string {
  try {
    return localStorage.getItem(LOCATION_KEY) || "Isla Principal";
  } catch {
    return "Isla Principal";
  }
}

export function setStationLocation(location: string): void {
  try {
    localStorage.setItem(LOCATION_KEY, location);
  } catch {
    /* localStorage no disponible — ignorar */
  }
}
