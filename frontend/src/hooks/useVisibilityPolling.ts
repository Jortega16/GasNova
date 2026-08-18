import { useEffect, useRef } from 'react';

/**
 * Ejecuta `callback` en un intervalo de `intervalMs` ms.
 *
 * ANTES pausaba del todo cuando `document.hidden` era true (pestaña sin
 * foco/minimizada) para ahorrar carga en la red local y el PTS-2. Se quitó:
 * en un POS de estación, esta pantalla es la fuente de verdad para ventas
 * en vivo — si el operador cambia de ventana un momento (o el SO la marca
 * oculta por cualquier razón) el polling se congelaba por completo y una
 * venta ya guardada en el backend podía tardar minutos en aparecer, hasta
 * que alguien volvía a mirar la pestaña o recargaba la página a mano. El
 * costo de red de seguir sondeando en segundo plano es mínimo comparado
 * con mostrar una venta pendiente con retraso indefinido.
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

    callbackRef.current();

    const id = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
