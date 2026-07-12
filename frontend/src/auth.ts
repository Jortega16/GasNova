// Sesión de la API: token Bearer emitido por POST /users/login y el perfil
// del usuario que inició sesión, persistidos en localStorage para sobrevivir
// recargas de página. Cuando el backend responde 401, client.ts limpia la
// sesión y emite el evento 'gasnova:unauthorized' para que App muestre la
// pantalla de login de nuevo.

const TOKEN_KEY = "gasnova_api_token";
const USER_KEY = "gasnova_api_user";

export const UNAUTHORIZED_EVENT = "gasnova:unauthorized";

export interface StoredAuthUser {
  id: string;
  name: string;
  username: string;
  role: string;
  avatar?: string;
}

export function getAuthToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredAuthUser(): StoredAuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: StoredAuthUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* localStorage no disponible — la sesión durará solo esta carga */
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignorar */
  }
}

export function notifyUnauthorized(): void {
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}
