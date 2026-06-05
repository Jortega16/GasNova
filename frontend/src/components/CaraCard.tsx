/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Fuel, Lock, Unlock, PlayCircle, Ban, RefreshCw, Settings,
  Trash2, CheckCircle, DollarSign, Zap, AlertCircle, StopCircle
} from 'lucide-react';
import { DispenserState, FuelType, PumpStatus, NozzleState, PaymentMethod, NozzleTransaction } from '../types';

interface CaraCardProps {
  key?: any;
  dispenser: DispenserState;
  onPreAuthorize: (dispenserId: number, fuelType: FuelType) => void;
  onStartFueling: (dispenserId: number, fuelType: FuelType) => void;
  onEmergencyStop: (dispenserId: number, fuelType: FuelType) => void;
  onResetPump: (dispenserId: number, fuelType: FuelType) => void;
  activePrices: { [key in FuelType]: number };
  onToggleBlockDispenser: (dispenserId: number) => void;
  onUpdateNozzles: (dispenserId: number, nozzles: NozzleState[]) => void;
  onCollectPayment: (dispenserId: number, fuelType: FuelType, paymentType: string) => void;
  onDirectLiftAndStart?: (dispenserId: number, fuelType: FuelType) => void;
  enabledPaymentMethods?: string[];
  paymentMethods?: PaymentMethod[];
  onPressNozzle?: (dispenserId: number, fuelType: FuelType) => void;
}

const NOZZLE_CFG: Record<FuelType, { dot: string; label: string; short: string; octane: string; glow: string; accent: string; active: string; ring: string }> = {
  'Regular Unleaded': {
    dot: 'bg-blue-500', label: 'Regular', short: 'REG', octane: '87',
    glow: 'shadow-blue-500/30', accent: 'text-blue-400', active: 'bg-blue-500/10 border-blue-500/30',
    ring: 'ring-blue-400/20',
  },
  'Premium Unleaded': {
    dot: 'bg-amber-400', label: 'Súper', short: 'SUP', octane: '93',
    glow: 'shadow-amber-500/30', accent: 'text-amber-400', active: 'bg-amber-500/10 border-amber-500/30',
    ring: 'ring-amber-400/20',
  },
  'Diesel': {
    dot: 'bg-emerald-500', label: 'Diesel', short: 'DSL', octane: 'D',
    glow: 'shadow-emerald-500/30', accent: 'text-emerald-400', active: 'bg-emerald-500/10 border-emerald-500/30',
    ring: 'ring-emerald-400/20',
  },
  'Kerosene': {
    dot: 'bg-purple-500', label: 'Kero', short: 'KER', octane: 'K',
    glow: 'shadow-purple-500/30', accent: 'text-purple-400', active: 'bg-purple-500/10 border-purple-500/30',
    ring: 'ring-purple-400/20',
  },
};

const STATUS_DOT: Record<string, string> = {
  'Dispensing': 'bg-green-400 animate-pulse shadow-green-400/60',
  'Prepaid':    'bg-amber-400 animate-pulse shadow-amber-400/60',
  'Unpaid':     'bg-rose-400 animate-bounce shadow-rose-400/60',
  'Blocked':    'bg-red-500 shadow-red-500/60',
  'Ready':      'bg-emerald-400 shadow-emerald-400/60',
  'Idle':       'bg-slate-600',
  'Fueling':    'bg-sky-400 animate-pulse shadow-sky-400/60',
};

export default function CaraCard({
  dispenser,
  onPreAuthorize,
  onStartFueling,
  onEmergencyStop,
  onResetPump,
  activePrices,
  onToggleBlockDispenser,
  onUpdateNozzles,
  onCollectPayment,
  onDirectLiftAndStart,
  enabledPaymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Fleet Card'],
  paymentMethods = [],
  onPressNozzle,
}: CaraCardProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [editNozzles, setEditNozzles] = useState<NozzleState[]>([]);

  const isDispensing  = dispenser.nozzles.some(n => n.status === 'Dispensing');
  const isAnyUnpaid   = dispenser.nozzles.some(n => n.status === 'Unpaid');
  const isAnyPrepaid  = dispenser.nozzles.some(n => n.status === 'Prepaid');
  const isAnyBlocked  = dispenser.nozzles.some(n => n.status === 'Blocked');
  const activeNozzle  = dispenser.nozzles.find(n => ['Dispensing','Prepaid','Unpaid'].includes(n.status));
  const totalPending  = dispenser.nozzles.reduce((s, n) => s + (n.pendingTransactions?.length || 0), 0);
  const firstPending  = dispenser.nozzles.find(n => (n.pendingTransactions?.length || 0) > 0);

  const displayNozzle = activeNozzle || dispenser.nozzles[0];
  const displayAmount = displayNozzle?.currentAmount || 0;
  const displayVolume = displayNozzle?.currentVolume || 0;
  const displayPrice  = activePrices[displayNozzle?.fuelType || 'Regular Unleaded'] || 4.19;

  const cardBorder = dispenser.isBlocked   ? 'border-red-700/40' :
                     isDispensing          ? 'border-green-500/35 shadow-green-500/8' :
                     isAnyUnpaid           ? 'border-rose-500/40 shadow-rose-500/10' :
                     isAnyPrepaid          ? 'border-amber-500/35' :
                     totalPending > 0      ? 'border-rose-600/30' :
                                            'border-slate-700/40 hover:border-slate-600/50';

  // ── EDITOR ────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-600/40 bg-[#111827] overflow-hidden text-white text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-2.5 py-2 bg-[#0f1923] border-b border-slate-800/60">
          <span className="font-mono font-black text-[11px] text-white">{dispenser.name}</span>
          <Settings className="w-3 h-3 text-slate-400" />
        </div>
        <div className="p-2.5 space-y-1.5">
          {editNozzles.map((nozzle, i) => {
            const cfg = NOZZLE_CFG[nozzle.fuelType];
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                <select
                  value={nozzle.fuelType}
                  onChange={e => {
                    const copy = [...editNozzles];
                    copy[i] = { ...copy[i], fuelType: e.target.value as FuelType };
                    setEditNozzles(copy);
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white focus:outline-none cursor-pointer"
                >
                  <option value="Regular Unleaded">Regular (87)</option>
                  <option value="Premium Unleaded">Súper Premium (93)</option>
                  <option value="Diesel">Diesel (D)</option>
                  <option value="Kerosene">Queroseno (K)</option>
                </select>
                {editNozzles.length > 1 && (
                  <button onClick={() => setEditNozzles(editNozzles.filter((_, idx) => idx !== i))}
                    className="p-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/60 border border-red-700/30 cursor-pointer">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
          {editNozzles.length < 4 && (
            <button
              onClick={() => {
                const available: FuelType[] = ['Regular Unleaded','Premium Unleaded','Diesel','Kerosene'];
                const first = available.find(f => !editNozzles.map(n => n.fuelType).includes(f)) || 'Kerosene';
                setEditNozzles([...editNozzles, { fuelType: first, status: 'Idle', currentAmount: 0, currentVolume: 0, progressPercent: 0 }]);
              }}
              className="w-full py-1.5 border border-dashed border-sky-500/30 rounded text-[10px] text-sky-400 hover:bg-sky-500/10 cursor-pointer"
            >+ Añadir</button>
          )}
          <div className="flex gap-1.5 pt-1">
            <button onClick={() => setIsEditing(false)} className="flex-1 py-1.5 text-[10px] font-bold bg-slate-700 hover:bg-slate-600 rounded cursor-pointer">Cancelar</button>
            <button onClick={() => { onUpdateNozzles(dispenser.id, editNozzles); setIsEditing(false); }} className="flex-1 py-1.5 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded cursor-pointer">Guardar</button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN CARD ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-200 flex flex-col bg-[#111827] shadow-lg ${cardBorder} ${isDispensing ? 'shadow-md' : ''}`}
      id={`dispenser-cara-${dispenser.id}`}
    >
      {/* Top accent line */}
      <div className={`h-px w-full ${
        isDispensing   ? 'bg-gradient-to-r from-transparent via-green-400/70 to-transparent' :
        isAnyUnpaid    ? 'bg-gradient-to-r from-transparent via-rose-400/70 to-transparent' :
        isAnyPrepaid   ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent' :
        totalPending>0 ? 'bg-gradient-to-r from-transparent via-rose-500/40 to-transparent' :
                         'bg-gradient-to-r from-transparent via-slate-700/50 to-transparent'
      }`} />

      {/* ── HEADER: name + status LED + toolbar ── */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0f1923]/80 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5">
          {/* Status LED */}
          <div className={`w-2 h-2 rounded-full shadow-sm ${
            dispenser.isBlocked ? 'bg-red-500 shadow-red-500/70 animate-pulse' :
            isDispensing        ? 'bg-green-400 shadow-green-400/80 animate-pulse' :
            isAnyUnpaid         ? 'bg-rose-400 shadow-rose-400/80 animate-bounce' :
            isAnyPrepaid        ? 'bg-amber-400 shadow-amber-400/80 animate-pulse' :
            totalPending>0      ? 'bg-rose-500 shadow-rose-500/60 animate-pulse' :
                                  'bg-slate-600'
          }`} />
          <span className="font-mono font-black text-[11px] text-white tracking-wider uppercase">
            {dispenser.name}
          </span>
          {totalPending > 0 && (
            <span className="bg-rose-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full leading-none">
              {totalPending}
            </span>
          )}
        </div>

        {/* Icon toolbar */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setEditNozzles([...dispenser.nozzles]); setIsEditing(true); }}
            className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-300 cursor-pointer transition-all"
            title="Configurar mangueras"
          >
            <Settings className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => onToggleBlockDispenser(dispenser.id)}
            className={`p-1 rounded cursor-pointer transition-all ${
              dispenser.isBlocked ? 'text-red-400 hover:bg-red-900/30' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'
            }`}
            title={dispenser.isBlocked ? 'Habilitar' : 'Bloquear cara'}
          >
            {dispenser.isBlocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
          </button>
          <button
            onClick={() => dispenser.nozzles.forEach(n => onEmergencyStop(dispenser.id, n.fuelType))}
            className="p-1 rounded text-red-600 hover:bg-red-900/30 hover:text-red-400 cursor-pointer transition-all"
            title="Parada de emergencia"
          >
            <Ban className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* ── LED DISPLAY (compact) ── */}
      <div className="mx-2 mt-2 rounded-lg overflow-hidden border border-slate-700/40 bg-[#070b0f]">
        {/* Display values */}
        <div className="px-2.5 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono text-green-800 uppercase tracking-widest">$/GAL</span>
            <span className="text-[9px] font-mono font-bold text-green-600/70"
              style={{ fontFamily: "'Courier New', monospace" }}>
              {displayPrice.toFixed(3)}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-[8px] font-mono text-green-800 uppercase tracking-widest">MONTO</span>
            <span className="text-sm font-black text-green-400 font-mono"
              style={{ fontFamily: "'Courier New', monospace", textShadow: displayAmount > 0 ? '0 0 10px #4ade80' : 'none' }}>
              ${displayAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[8px] font-mono text-green-800 uppercase tracking-widest">GAL</span>
            <span className="text-xs font-bold text-green-300/60 font-mono"
              style={{ fontFamily: "'Courier New', monospace", textShadow: displayVolume > 0 ? '0 0 6px #4ade80' : 'none' }}>
              {displayVolume.toFixed(3)}
            </span>
          </div>

          {/* Progress bar */}
          {isDispensing && displayNozzle && (
            <div className="mt-1 bg-green-950 h-0.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-300 rounded-full transition-all duration-500"
                style={{ width: `${displayNozzle.progressPercent || 0}%`, boxShadow: '0 0 4px #4ade80' }}
              />
            </div>
          )}
        </div>

        {/* Status strip */}
        <div className={`px-2 py-0.5 text-center text-[8px] font-mono font-bold uppercase tracking-widest ${
          dispenser.isBlocked ? 'bg-red-950/60 text-red-500' :
          isDispensing        ? 'bg-green-950/60 text-green-400 animate-pulse' :
          isAnyUnpaid         ? 'bg-rose-950/60 text-rose-400 animate-pulse' :
          isAnyPrepaid        ? 'bg-amber-950/60 text-amber-400' :
          totalPending>0      ? 'bg-rose-950/40 text-rose-500 animate-pulse' :
                                'bg-slate-900/40 text-slate-700'
        }`}>
          {dispenser.isBlocked   ? '⛔ BLOQUEADA' :
           isDispensing          ? '⛽ DESPACHANDO' :
           isAnyUnpaid           ? '💳 COBRO PEND.' :
           isAnyPrepaid          ? '✓ AUTORIZADA' :
           totalPending > 0      ? `💳 ${totalPending} PEND.` :
           '○ EN ESPERA'}
        </div>
      </div>

      {/* ── NOZZLE ROWS ── */}
      <div className="flex flex-col gap-0 mx-2 my-2">
        {dispenser.isBlocked ? (
          <div className="flex flex-col items-center gap-1.5 py-3">
            <Lock className="w-6 h-6 text-red-700/50" />
            <p className="text-[9px] font-mono text-red-700/70 uppercase tracking-widest">Cara Deshabilitada</p>
            <button
              onClick={() => onToggleBlockDispenser(dispenser.id)}
              className="px-3 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white text-[9px] font-bold rounded cursor-pointer flex items-center gap-1"
            >
              <Unlock className="w-2.5 h-2.5" /> Habilitar
            </button>
          </div>
        ) : (
          dispenser.nozzles.map((nozzle) => {
            const cfg = NOZZLE_CFG[nozzle.fuelType];
            const price = activePrices[nozzle.fuelType] || 4.19;
            const lockedByOther = activeNozzle && activeNozzle.fuelType !== nozzle.fuelType;
            const isNozzleDisp   = nozzle.status === 'Dispensing';
            const isNozzlePrep   = nozzle.status === 'Prepaid';
            const isNozzleUnpaid = nozzle.status === 'Unpaid';
            const isNozzleBlock  = nozzle.status === 'Blocked';
            const isNozzleIdle   = nozzle.status === 'Idle' || nozzle.status === 'Ready';
            const hasPending     = (nozzle.pendingTransactions?.length || 0) > 0;

            return (
              <div
                key={nozzle.fuelType}
                className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg border transition-all duration-150 mb-1 ${
                  lockedByOther  ? 'opacity-30 border-transparent' :
                  isNozzleDisp   ? 'border-green-700/30 bg-green-950/20' :
                  isNozzleUnpaid ? 'border-rose-600/40 bg-rose-950/25' :
                  isNozzlePrep   ? 'border-amber-600/30 bg-amber-950/20' :
                  isNozzleBlock  ? 'border-red-700/25 bg-red-950/15' :
                  hasPending     ? 'border-rose-600/20 bg-rose-950/10' :
                  'border-transparent hover:border-slate-700/30 hover:bg-slate-800/20'
                }`}
              >
                {/* Nozzle color dot + label */}
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full block ${cfg.dot} ${
                      isNozzleDisp ? 'animate-pulse shadow-sm' : ''
                    }`} style={{ boxShadow: isNozzleDisp ? `0 0 4px ${cfg.dot.includes('blue') ? '#3b82f6' : cfg.dot.includes('amber') ? '#f59e0b' : cfg.dot.includes('emerald') ? '#10b981' : '#a855f7'}` : 'none' }} />
                    {hasPending && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 text-white text-[6px] font-black rounded-full flex items-center justify-center border border-[#111827]">
                        {nozzle.pendingTransactions!.length}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono font-black ${lockedByOther ? 'text-slate-700' : cfg.accent}`}>
                    {cfg.short}
                  </span>
                  <span className={`text-[9px] font-mono ${lockedByOther ? 'text-slate-800' : 'text-slate-600'}`}>
                    ${price.toFixed(2)}
                  </span>
                  {/* Live amount if dispensing */}
                  {isNozzleDisp && (
                    <span className="text-[9px] font-mono font-bold text-green-400 ml-auto">
                      ${nozzle.currentAmount.toFixed(2)}
                    </span>
                  )}
                  {isNozzleUnpaid && (
                    <span className="text-[9px] font-mono font-bold text-rose-400 ml-auto">
                      ${nozzle.currentAmount.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Status dot */}
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ${STATUS_DOT[nozzle.status] || 'bg-slate-700'}`} />

                {/* Action buttons (icon-only) */}
                {!lockedByOther && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {isNozzleIdle && onDirectLiftAndStart && (
                      <button
                        onClick={() => onDirectLiftAndStart(dispenser.id, nozzle.fuelType)}
                        className="p-1 rounded bg-amber-500/80 hover:bg-amber-400 text-amber-900 cursor-pointer transition-all"
                        title="Descolgar e iniciar"
                      >
                        <PlayCircle className="w-3 h-3" />
                      </button>
                    )}
                    {isNozzleIdle && (
                      <button
                        onClick={() => onPreAuthorize(dispenser.id, nozzle.fuelType)}
                        className="p-1 rounded bg-slate-700 hover:bg-emerald-700 text-slate-300 hover:text-white cursor-pointer transition-all"
                        title="Pre-Autorizar"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                    )}
                    {isNozzlePrep && (
                      <button
                        onClick={() => onStartFueling(dispenser.id, nozzle.fuelType)}
                        className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-amber-900 cursor-pointer animate-pulse"
                        title="Surtir"
                      >
                        <Fuel className="w-3 h-3" />
                      </button>
                    )}
                    {isNozzleDisp && (
                      <button
                        onClick={() => onEmergencyStop(dispenser.id, nozzle.fuelType)}
                        className="p-1 rounded bg-red-700 hover:bg-red-600 text-white cursor-pointer transition-all"
                        title="Detener → agrega a despachos pendientes"
                      >
                        <StopCircle className="w-3 h-3" />
                      </button>
                    )}
                    {isNozzleUnpaid && (
                      <button
                        onClick={() => { if (onPressNozzle) onPressNozzle(dispenser.id, nozzle.fuelType); }}
                        className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white cursor-pointer animate-bounce"
                        title="Ver despachos pendientes"
                      >
                        <DollarSign className="w-3 h-3" />
                      </button>
                    )}
                    {isNozzleBlock && (
                      <button
                        onClick={() => onResetPump(dispenser.id, nozzle.fuelType)}
                        className="p-1 rounded bg-sky-900/40 text-sky-400 hover:bg-sky-900/60 cursor-pointer"
                        title="Resetear manguera"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                    {hasPending && !isNozzleDisp && !isNozzlePrep && !isNozzleUnpaid && !isNozzleBlock && (
                      <button
                        onClick={() => { if (onPressNozzle) onPressNozzle(dispenser.id, nozzle.fuelType); }}
                        className="p-1 rounded bg-rose-900/50 text-rose-400 hover:bg-rose-900/70 cursor-pointer animate-pulse"
                        title="Gestionar despachos pendientes"
                      >
                        <DollarSign className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── PENDING DISPATCHES quick button ── */}
      {totalPending > 0 && !dispenser.isBlocked && (
        <button
          onClick={() => { if (firstPending && onPressNozzle) onPressNozzle(dispenser.id, firstPending.fuelType); }}
          className="mx-2 mb-2 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/25 hover:bg-rose-900/35 text-rose-300 text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{totalPending}</span>
          <span>Gestionar Despachos</span>
        </button>
      )}

      {/* ── BOTTOM LED strip ── */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-[#0a0e14]/80 border-t border-slate-800/40">
        {/* Progress LEDs */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${
              isDispensing && i <= Math.floor((displayNozzle?.progressPercent || 0) / 20)
                ? 'bg-green-400 shadow-sm'
                : 'bg-slate-800 border border-slate-700/20'
            }`} />
          ))}
        </div>
        {/* Bolt decorations */}
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700/30" />
        </div>
      </div>
    </div>
  );
}
