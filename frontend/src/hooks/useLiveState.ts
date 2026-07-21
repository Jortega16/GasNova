import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useVisibilityPolling } from './useVisibilityPolling';
import type { BackendPumpStatusItem, BackendTankMeasurement } from '../api/types';

export interface LiveState {
  pumps: BackendPumpStatusItem[] | null;
  tanks: BackendTankMeasurement[] | null;
}

const FAST_POLL_MS = 2000;
const WS_HEARTBEAT_POLL_MS = 10000;
const WS_RECONNECT_BASE_MS = 1000;
const WS_RECONNECT_MAX_MS = 15000;

function liveStateWsUrl(): string {
  const baseApiUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8002';
  const isAbsolute = /^https?:\/\//.test(baseApiUrl);

  // /ws/ vive en la raíz del sitio, proxiado aparte por nginx con los headers
  // de upgrade — nunca bajo el prefijo de la API (/api/), aunque
  // VITE_API_BASE_URL lo tenga (como en producción: VITE_API_BASE_URL=/api).
  // Por eso no se deriva de baseApiUrl con un simple replace de esquema:
  // en dev es una URL absoluta (http://localhost:8002, sin /api) y en
  // producción es una ruta relativa (/api) que resolvería mal contra sí misma.
  if (isAbsolute) {
    const url = new URL(baseApiUrl);
    const wsScheme = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsScheme}//${url.host}/ws/live-state`;
  }

  const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsScheme}//${window.location.host}/ws/live-state`;
}

/**
 * Sondea GET /live/state (bombas + tanques en una sola llamada, con la
 * caché de precios del PTS-2 ya resuelta) y expone el último snapshot
 * recibido. Además abre /ws/live-state: cuando el PTS-2 real empuja un
 * paquete (venta, medición de tanque, cambio de estado), el backend avisa
 * por ese socket y este hook vuelve a pedir /live/state de inmediato en
 * vez de esperar al siguiente tick del polling.
 *
 * El polling nunca se apaga del todo — mientras el WS está conectado baja
 * de cadencia a un "latido" de respaldo (por si se pierde algún push); si
 * el WS se cae, vuelve a la cadencia rápida y reintenta la conexión con
 * backoff exponencial. Así el dashboard sigue funcionando igual de bien
 * si el PTS-2 nunca llega a empujar nada (WS deshabilitado, red distinta).
 */
export function useLiveState(
  pumpCount: number,
  enabled: boolean,
): LiveState {
  const [state, setState] = useState<LiveState>({ pumps: null, tanks: null });
  const [wsConnected, setWsConnected] = useState(false);

  const fetchNow = useCallback(async () => {
    const res = await api.getLiveState(pumpCount);
    if (res.ok) {
      setState({ pumps: res.pumps ?? null, tanks: res.tanks ?? null });
    }
  }, [pumpCount]);

  const fetchNowRef = useRef(fetchNow);
  fetchNowRef.current = fetchNow;

  // Polling: cadencia rápida sin WS, latido lento de respaldo con WS activo.
  useVisibilityPolling(
    () => { fetchNowRef.current(); },
    wsConnected ? WS_HEARTBEAT_POLL_MS : FAST_POLL_MS,
    enabled,
  );

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = WS_RECONNECT_BASE_MS;

    const connect = () => {
      if (stopped) return;
      ws = new WebSocket(liveStateWsUrl());

      ws.onopen = () => {
        reconnectDelay = WS_RECONNECT_BASE_MS;
        setWsConnected(true);
        fetchNowRef.current();
      };
      ws.onmessage = () => {
        fetchNowRef.current();
      };
      ws.onerror = () => {
        // El backoff y la caída a polling rápido se manejan en onclose.
      };
      ws.onclose = () => {
        setWsConnected(false);
        if (stopped) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, WS_RECONNECT_MAX_MS);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setWsConnected(false);
      ws?.close();
    };
  }, [enabled]);

  return state;
}
