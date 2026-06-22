/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, Clock, AlertTriangle, Play, Pause } from 'lucide-react';

interface FooterProps {
  shiftId: string;
  shiftName?: string;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  onManualSync: () => void;
  pendingAutoConsolidationInfo?: { shortestTrxId: string; secLeft: number; totalPending: number } | null;
  isApiOnline?: boolean;
  isPts2Online?: boolean;
}

export default function Footer({ 
  shiftId, 
  shiftName,
  isSimulating, 
  setIsSimulating, 
  onManualSync,
  pendingAutoConsolidationInfo,
  isApiOnline = false,
  isPts2Online = false
}: FooterProps) {
  const [lastSyncTime, setLastSyncTime] = useState<string>('10:31 AM');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Update local clock format
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncClick = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSyncing(false);
      onManualSync();
    }, 1000);
  };

  return (
    <footer className="bg-[#191c1e] text-[#e0e3e5] px-4 py-2 border-t border-[#44474e]/40 text-xs font-mono select-none shrink-0 flex flex-wrap items-center justify-between gap-4" id="global-footer">
      
      {/* Left side: System status */}
      <div className="flex items-center gap-4">
        {/* Red / API Status */}
        <div className="flex items-center gap-1.5" id="network-status">
          <Wifi className={`w-4 h-4 animate-pulse ${isApiOnline ? 'text-[#2E7D32]' : 'text-[#c62828]'}`} />
          <span>Red API: </span>
          <span className={`font-semibold font-sans ${isApiOnline ? 'text-[#2E7D32]' : 'text-[#c62828]'}`}>
            {isApiOnline ? 'CONECTADO' : 'DESCONECTADO'}
          </span>
        </div>

        <div className="h-4 w-px bg-[#44474e]" />

        {/* PTS-2 Status */}
        <div className="flex items-center gap-1.5" id="pts2-status">
          <span className={`relative flex h-2 w-2 shrink-0`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSimulating ? 'bg-amber-400' : isPts2Online ? 'bg-green-400' : 'bg-red-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isSimulating ? 'bg-amber-500' : isPts2Online ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
          </span>
          <span>PTS-2: </span>
          <span className={`font-semibold font-sans ${
            isSimulating ? 'text-amber-400' : isPts2Online ? 'text-[#2E7D32]' : 'text-[#c62828]'
          }`}>
            {isSimulating ? 'SIMULADOR' : isPts2Online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {pendingAutoConsolidationInfo && (
          <>
            <div className="h-4 w-px bg-[#44474e]" />
            <div className="flex items-center gap-1.5 text-[#e2f1af]/90 font-sans" id="auto-consolidation-status" title="Cada despacho tiene un ciclo individual de 5 minutos antes de auto-consolidarse">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] text-slate-300">Autoconsolidación ({pendingAutoConsolidationInfo.totalPending} pend.):</span>
              <span className="font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 font-bold text-[10px] tracking-tight">
                {pendingAutoConsolidationInfo.shortestTrxId} en {Math.floor(pendingAutoConsolidationInfo.secLeft / 60)}:
                {String(pendingAutoConsolidationInfo.secLeft % 60).padStart(2, '0')}
              </span>
            </div>
          </>
        )}

        <div className="h-4 w-px bg-[#44474e]" />

        <div className="flex items-center gap-1.5" id="active-shift">
          <span>Turno Activo: </span>
          <span className="font-semibold text-[#aec7f7]">{shiftName || 'Matutino'} ({shiftId})</span>
        </div>
      </div>

      {/* Middle: Simulation toggle play/pause */}
      <div className="flex items-center gap-2 bg-[#2d3133] px-3 py-1 rounded border border-[#44474e]/50" id="simulation-indicator">
        <span className="text-[10px] text-[#87a0cd] font-sans font-bold">SIMULADOR DE FLUJO:</span>
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
            isSimulating
              ? 'bg-[#ba1a1a] hover:bg-[#ba1a1a]/80 text-white font-bold'
              : 'bg-[#2E7D32] hover:bg-[#2E7D32]/80 text-white font-bold'
          }`}
          title={isSimulating ? 'Pausar simulación de consumo' : 'Reanudar simulación de consumo'}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3 h-3 fill-white" />
              <span>PAUSAR</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-white" />
              <span>INICIAR</span>
            </>
          )}
        </button>
        {isSimulating && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D32] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E7D32]"></span>
          </span>
        )}
      </div>

      {/* Right side: Sync controls & clocks */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-[11px] text-[#87a0cd]">
          <Clock className="w-3.5 h-3.5 text-[#87a0cd]" />
          <span>Sincronizado: {lastSyncTime}</span>
        </div>

        <button
          onClick={handleSyncClick}
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border border-[#355e9e] text-[#93b9ff] hover:bg-[#355e9e]/30 cursor-pointer transition-colors ${
            syncing ? 'animate-spin' : ''
          }`}
          id="sync-now-button"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>

        <div className="h-4 w-px bg-[#44474e]" />

        <div className="font-semibold text-white tracking-widest text-xs bg-[#2d3133] px-2 py-1 rounded">
          {currentTime || '10:31:00 AM'}
        </div>
      </div>
    </footer>
  );
}
