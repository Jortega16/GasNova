/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Bell, X, Fuel, DollarSign, Info } from 'lucide-react';
import type { ShiftAlert } from '../types';

interface NotificationBellProps {
  alerts: ShiftAlert[];
}

/** Ícono por tipo de alerta, inferido del mensaje (sin tocar el modelo de datos existente). */
function iconFor(alert: ShiftAlert) {
  const msg = (alert.message || '').toLowerCase();
  if (msg.includes('precio')) return <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  if (msg.includes('venta') || msg.includes('manguera') || msg.includes('cara')) {
    return <Fuel className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  }
  return <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

export default function NotificationBell({ alerts }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Solo cuenta como "notificación" lo que tiene mensaje (system notes), no cada
  // línea de venta cruda — evita inflar el badge con ruido operativo normal.
  const notifiable = alerts.filter(a => !!a.message);
  const unreadCount = Math.max(0, notifiable.length - lastSeenCount);

  const toggleOpen = () => {
    setOpen(prev => {
      const next = !prev;
      if (next) setLastSeenCount(notifiable.length);
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const recent = notifiable.slice(0, 20);

  return (
    <div className="relative" ref={containerRef} id="notification-bell-container">
      <button
        onClick={toggleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#1b365d]/80 hover:bg-[#133562] border border-[#355e9e]/50 cursor-pointer transition-colors"
        title="Notificaciones"
        id="notification-bell-button"
      >
        <Bell className="w-4 h-4 text-[#93b9ff]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black font-mono flex items-center justify-center border border-[#002046]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white text-slate-800 rounded-xl shadow-2xl border border-neutral-300 z-50 animate-fadeIn overflow-hidden"
          id="notification-dropdown-panel"
        >
          <div className="px-4 py-2.5 border-b border-neutral-100 bg-slate-50 flex items-center justify-between">
            <p className="text-[11px] uppercase font-mono tracking-wider text-slate-500 font-bold">Notificaciones</p>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {recent.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic px-4 py-6 text-center">Sin notificaciones recientes.</p>
            ) : (
              recent.map(a => (
                <div key={a.id} className="px-4 py-2.5 flex items-start gap-2 hover:bg-slate-50">
                  {iconFor(a)}
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">{a.message}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{a.dateTime}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
