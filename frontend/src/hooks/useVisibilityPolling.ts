import { useEffect, useRef } from 'react';

/**
 * Ejecuta `callback` en un intervalo de `intervalMs` ms, pero lo pausa
 * automáticamente cuando la pestaña no es visible (document.hidden).
 *
 * Esto evita hacer requests al backend cuando el usuario no está mirando
 * el dashboard, ahorrando carga en la red local y en el controlador PTS-2.
 */
export function useVisibilityPolling(
  callback: () => void,
  intervalMs: number,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    // Run once immediately
    if (!document.hidden) {
      callbackRef.current();
    }

    const id = setInterval(() => {
      if (!document.hidden) {
        callbackRef.current();
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
