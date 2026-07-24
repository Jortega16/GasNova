/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Fuel, Lock, Unlock, PlayCircle, Ban, RefreshCw, Settings,
  Trash2, CheckCircle, DollarSign, StopCircle, Zap, AlertTriangle
} from 'lucide-react';
import { DispenserState, FuelType, NozzleState, PaymentMethod } from '../types';

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
  onStopPump?: (dispenserId: number, fuelType: FuelType) => void;
  unitMeasure?: 'Galones' | 'Litros';
  currencySymbol?: string;
  canBlock?: boolean;
  canPreauth?: boolean;
  canEmergencyStop?: boolean;
}

const NOZZLE_CFG: Record<FuelType, {
  dot: string; bg: string; border: string; text: string;
  label: string; short: string; glow: string;
}> = {
  'Regular Unleaded': {
    dot: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/25',
    text: 'text-blue-400', label: 'Regular', short: 'REG', glow: '0 0 8px #3b82f680',
  },
  'Premium Unleaded': {
    dot: 'bg-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25',
    text: 'text-amber-400', label: 'Súper', short: 'SUP', glow: '0 0 8px #f59e0b80',
  },
  'Diesel': {
    dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25',
    text: 'text-emerald-400', label: 'Diesel', short: 'DSL', glow: '0 0 8px #10b98180',
  },
  'Kerosene': {
    dot: 'bg-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/25',
    text: 'text-purple-400', label: 'Kero', short: 'KER', glow: '0 0 8px #a855f780',
  },
  'LPG': {
    dot: 'bg-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25',
    text: 'text-indigo-400', label: 'LPG', short: 'LPG', glow: '0 0 8px #6366f180',
  },
};

// Card-level state config
const CARD_STATE = {
  dispensing: {
    border: 'border-green-500/40',
    glow: 'shadow-[0_0_20px_rgba(74,222,128,0.08)]',
    accent: 'from-green-500/60 to-transparent',
    badge: 'bg-green-500/15 text-green-300 border-green-500/20',
    badgeText: 'DESPACHANDO',
    ledBg: 'bg-[#021a0a]',
    ledValue: '#4ade80',
    ledDim: '#166534',
  },
  unpaid: {
    border: 'border-rose-500/50',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.10)]',
    accent: 'from-rose-500/60 to-transparent',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
    badgeText: 'COBRO PEND.',
    ledBg: 'bg-[#1a0208]',
    ledValue: '#fb7185',
    ledDim: '#9f1239',
  },
  prepaid: {
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_16px_rgba(251,191,36,0.08)]',
    accent: 'from-amber-500/60 to-transparent',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    badgeText: 'AUTORIZADA',
    ledBg: 'bg-[#1a1002]',
    ledValue: '#fbbf24',
    ledDim: '#92400e',
  },
  blocked: {
    border: 'border-red-700/40',
    glow: '',
    accent: 'from-red-700/40 to-transparent',
    badge: 'bg-red-900/30 text-red-400 border-red-700/30',
    badgeText: 'BLOQUEADA',
    ledBg: 'bg-[#0f0404]',
    ledValue: '#ef4444',
    ledDim: '#7f1d1d',
  },
  idle: {
    border: 'border-slate-700/40 hover:border-slate-600/60',
    glow: '',
    accent: 'from-slate-600/30 to-transparent',
    badge: 'bg-slate-800/60 text-slate-500 border-slate-700/30',
    badgeText: 'EN REPOSO',
    ledBg: 'bg-[#070b0f]',
    ledValue: '#166534',
    ledDim: '#0d2015',
  },
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
  onStopPump,
  unitMeasure = 'Litros',
  currencySymbol = '$',
  canBlock = true,
  canPreauth = true,
  canEmergencyStop = true,
}: CaraCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNozzles, setEditNozzles] = useState<NozzleState[]>([]);

  const isDispensing = dispenser.nozzles.some(n => n.status === 'Dispensing' || n.status === 'Fueling');
  const isAnyReady   = dispenser.nozzles.some(n => n.status === 'Ready');
  const isAnyEot     = dispenser.nozzles.some(n => n.status === 'EndOfTransaction');
  const isAnyUnpaid  = dispenser.nozzles.some(n => n.status === 'Unpaid');
  const isAnyPrepaid = dispenser.nozzles.some(n => n.status === 'Prepaid' || n.status === 'Authorized');
  const isAnyOffline = dispenser.nozzles.some(n => n.status === 'Offline');
  const activeNozzle = dispenser.nozzles.find(n =>
    ['Dispensing', 'Fueling', 'Ready', 'Prepaid', 'Authorized', 'Unpaid', 'EndOfTransaction'].includes(n.status)
  );
  const totalPending = dispenser.nozzles.reduce((s, n) => s + (n.pendingTransactions?.length || 0), 0);
  const firstPending = dispenser.nozzles.find(n => (n.pendingTransactions?.length || 0) > 0);

  const displayNozzle = activeNozzle || dispenser.nozzles[0];
  const displayAmount = displayNozzle?.currentAmount || 0;
  const rawVol = displayNozzle?.currentVolume || 0;
  const displayVolume = rawVol;
  const basePrice = activePrices[displayNozzle?.fuelType || 'Regular Unleaded'] || 4.19;
  const displayPrice = basePrice;

  const state = dispenser.isBlocked ? CARD_STATE.blocked :
                isDispensing        ? CARD_STATE.dispensing :
                isAnyEot            ? CARD_STATE.unpaid :
                isAnyUnpaid         ? CARD_STATE.unpaid :
                isAnyReady          ? CARD_STATE.prepaid :
                isAnyPrepaid        ? CARD_STATE.prepaid :
                                      CARD_STATE.idle;

  // ── EDITOR ─────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-[#0f1623] overflow-hidden text-white text-xs shadow-xl">
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#0b1120] border-b border-slate-800">
          <span className="font-mono font-black text-[11px] text-slate-300 tracking-widest uppercase">{dispenser.name} — Configurar</span>
          <Settings className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="p-3 space-y-2">
          {editNozzles.map((nozzle, i) => {
            const cfg = NOZZLE_CFG[nozzle.fuelType];
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
                <select
                  value={nozzle.fuelType}
                  onChange={e => {
                    const copy = [...editNozzles];
                    copy[i] = { ...copy[i], fuelType: e.target.value as FuelType };
                    setEditNozzles(copy);
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Regular Unleaded">Regular Unleaded (87)</option>
                  <option value="Premium Unleaded">Súper Premium (93)</option>
                  <option value="Diesel">Diesel (D)</option>
                  <option value="Kerosene">Queroseno (K)</option>
                  <option value="LPG">LPG (G)</option>
                </select>
                {editNozzles.length > 1 && (
                  <button
                    onClick={() => setEditNozzles(editNozzles.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-900/70 border border-red-800/40 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          {editNozzles.length < 4 && (
            <button
              onClick={() => {
                const available: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene', 'LPG'];
                const first = available.find(f => !editNozzles.map(n => n.fuelType).includes(f)) || 'LPG';
                setEditNozzles([...editNozzles, { fuelType: first, status: 'Idle', currentAmount: 0, currentVolume: 0, progressPercent: 0 }]);
              }}
              className="w-full py-2 border border-dashed border-blue-500/30 rounded-lg text-[11px] text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-colors"
            >
              + Añadir manguera
            </button>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onUpdateNozzles(dispenser.id, editNozzles); setIsEditing(false); }}
              className="flex-1 py-2 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg cursor-pointer transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN CARD ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden flex flex-col bg-[#0d1117] transition-all duration-300 ${state.border} ${state.glow}`}
      id={`dispenser-cara-${dispenser.id}`}
    >
      {/* Top color accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${state.accent}`} />

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-2">
          {/* Pulse indicator */}
          <div className="relative flex items-center justify-center">
            {(isDispensing || isAnyUnpaid || isAnyEot || isAnyPrepaid || isAnyReady) && (
              <span className={`absolute inline-flex w-4 h-4 rounded-full opacity-40 animate-ping ${
                isDispensing ? 'bg-green-400' : (isAnyEot || isAnyUnpaid) ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
            )}
            <span className={`relative w-2.5 h-2.5 rounded-full ${
              dispenser.isBlocked ? 'bg-red-500' :
              isDispensing        ? 'bg-green-400' :
              isAnyEot || isAnyUnpaid ? 'bg-rose-400' :
              isAnyReady || isAnyPrepaid ? 'bg-amber-400' :
              isAnyOffline        ? 'bg-slate-700' :
                                    'bg-slate-600'
            }`} />
          </div>

          <span className="font-mono font-black text-[13px] text-white tracking-widest uppercase">
            {dispenser.name}
          </span>

          {totalPending > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm">
              {totalPending}
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setEditNozzles([...dispenser.nozzles]); setIsEditing(true); }}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 cursor-pointer transition-all"
            title="Configurar mangueras"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          {canBlock && (
            <button
              onClick={() => onToggleBlockDispenser(dispenser.id)}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                dispenser.isBlocked
                  ? 'text-red-400 hover:bg-red-900/30 bg-red-950/20'
                  : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60'
              }`}
              title={dispenser.isBlocked ? 'Habilitar cara' : 'Bloquear cara'}
            >
              {dispenser.isBlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}
          {canEmergencyStop && (
            <button
              onClick={() => dispenser.nozzles.forEach(n => onEmergencyStop(dispenser.id, n.fuelType))}
              className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-950/30 cursor-pointer transition-all"
              title="Parada de emergencia"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── LED DISPLAY ── */}
      <div className={`mx-3 rounded-xl overflow-hidden border border-slate-800/80 ${state.ledBg}`}>
        {/* Main metrics row */}
        <div className="grid grid-cols-3 divide-x divide-slate-800/60 px-0">
          {/* Price */}
          <div className="px-3 py-2 flex flex-col items-center">
            <span className="text-[8px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: state.ledDim }}>
              {unitMeasure === 'Litros' ? `${currencySymbol}/L` : `${currencySymbol}/GAL`}
            </span>
            <span className="font-mono text-[13px] font-bold tabular-nums"
              style={{ color: state.ledValue, fontFamily: "'Courier New', monospace" }}>
              {displayPrice.toFixed(3)}
            </span>
          </div>
          {/* Amount — center, larger */}
          <div className="px-3 py-2 flex flex-col items-center">
            <span className="text-[8px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: state.ledDim }}>
              MONTO
            </span>
            <span className="font-mono text-[18px] font-black tabular-nums leading-none"
              style={{
                color: state.ledValue,
                fontFamily: "'Courier New', monospace",
                textShadow: displayAmount > 0 ? `0 0 12px ${state.ledValue}60` : 'none',
              }}>
              {currencySymbol}{displayAmount.toFixed(2)}
            </span>
          </div>
          {/* Volume */}
          <div className="px-3 py-2 flex flex-col items-center">
            <span className="text-[8px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: state.ledDim }}>
              {unitMeasure === 'Litros' ? 'LTS' : 'GAL'}
            </span>
            <span className="font-mono text-[13px] font-bold tabular-nums"
              style={{ color: state.ledValue, fontFamily: "'Courier New', monospace" }}>
              {displayVolume.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Progress bar (only when dispensing) */}
        {isDispensing && displayNozzle && (
          <div className="px-3 pb-1.5">
            <div className="bg-green-950/60 h-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${displayNozzle.progressPercent || 0}%`,
                  background: 'linear-gradient(90deg, #166534, #4ade80)',
                  boxShadow: '0 0 6px #4ade8080',
                }}
              />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className={`mx-2 mb-2 rounded-lg border py-1 text-center text-[9px] font-mono font-bold uppercase tracking-widest ${state.badge} ${
          isDispensing || isAnyUnpaid || isAnyEot || isAnyReady ? 'animate-pulse' : ''
        }`}>
          {dispenser.isBlocked  ? '⛔ BLOQUEADA' :
           isDispensing         ? '⛽ DESPACHANDO' :
           isAnyEot             ? '⏸ FIN DESPACHO' :
           isAnyUnpaid          ? '💳 COBRO PENDIENTE' :
           isAnyReady           ? '🖐 MANGUERA LEVANTADA' :
           isAnyPrepaid         ? '✓ AUTORIZADA' :
           isAnyOffline         ? '📡 SIN SEÑAL' :
           totalPending > 0     ? `💳 ${totalPending} PEND.` :
                                  '○ EN REPOSO'}
        </div>
      </div>

      {/* ── NOZZLE ROWS ── */}
      <div className="px-3 pt-2.5 pb-2 space-y-1.5">
        {dispenser.isBlocked ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Lock className="w-5 h-5 text-red-800/60" />
            <p className="text-[9px] font-mono text-red-700/70 uppercase tracking-widest">Cara Deshabilitada</p>
            <button
              onClick={() => onToggleBlockDispenser(dispenser.id)}
              className="px-4 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Unlock className="w-3 h-3" /> Habilitar
            </button>
          </div>
        ) : (
          dispenser.nozzles.map((nozzle) => {
            const cfg = NOZZLE_CFG[nozzle.fuelType];
            const price = activePrices[nozzle.fuelType] || 4.19;
            const lockedByOther = !!(activeNozzle && activeNozzle.fuelType !== nozzle.fuelType);
            const isNozzleDisp    = nozzle.status === 'Dispensing' || nozzle.status === 'Fueling';
            const isNozzlePrep    = nozzle.status === 'Prepaid' || nozzle.status === 'Authorized';
            const isNozzleEot     = nozzle.status === 'EndOfTransaction';
            const isNozzleUnpaid  = nozzle.status === 'Unpaid';
            const isNozzleReady   = nozzle.status === 'Ready';
            const isNozzleBlock   = nozzle.status === 'Blocked';
            const isNozzleIdle    = nozzle.status === 'Idle';
            const isNozzleOffline = nozzle.status === 'Offline';
            const hasPending      = (nozzle.pendingTransactions?.length || 0) > 0;

            return (
              <div
                key={nozzle.fuelType}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all duration-150 ${
                  lockedByOther    ? 'opacity-25 border-transparent bg-transparent' :
                  isNozzleOffline  ? 'opacity-30 border-slate-800/30 bg-slate-900/20' :
                  isNozzleDisp     ? `${cfg.bg} ${cfg.border}` :
                  isNozzleEot      ? 'border-rose-600/30 bg-rose-950/20' :
                  isNozzleUnpaid   ? 'border-rose-600/30 bg-rose-950/20' :
                  isNozzleReady    ? 'border-amber-500/40 bg-amber-950/25' :
                  isNozzlePrep     ? `${cfg.bg} ${cfg.border}` :
                  isNozzleBlock    ? 'border-red-900/30 bg-red-950/15' :
                  hasPending       ? 'border-rose-600/15 bg-rose-950/10' :
                  'border-transparent hover:border-slate-700/40 hover:bg-slate-800/20'
                }`}
              >
                {/* Fuel dot */}
                <div className="relative flex-shrink-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full block ${cfg.dot} ${isNozzleDisp ? 'animate-pulse' : ''}`}
                    style={{ boxShadow: isNozzleDisp ? cfg.glow : 'none' }}
                  />
                  {hasPending && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 text-white text-[7px] font-black rounded-full flex items-center justify-center border border-[#0d1117]">
                      {nozzle.pendingTransactions!.length}
                    </span>
                  )}
                </div>

                {/* Label + price */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-mono font-black ${lockedByOther ? 'text-slate-700' : cfg.text}`}>
                      {cfg.short}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600">
                      {currencySymbol}{price.toFixed(2)}
                    </span>
                  </div>
                  {/* Live amount while active */}
                  {(isNozzleDisp || isNozzleUnpaid || isNozzleEot) && (
                    <div className={`text-[10px] font-mono font-bold ${isNozzleUnpaid || isNozzleEot ? 'text-rose-400' : 'text-green-400'}`}>
                      {currencySymbol}{nozzle.currentAmount.toFixed(2)} · {nozzle.currentVolume.toFixed(3)} {unitMeasure === 'Litros' ? 'L' : 'G'}
                    </div>
                  )}
                  {isNozzleReady && (
                    <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                      Manguera levantada
                    </div>
                  )}
                </div>

                {/* Status chip */}
                {isNozzleOffline ? (
                  <span className="text-[9px] font-mono text-slate-700 bg-slate-800/40 px-1.5 py-0.5 rounded">OFFLINE</span>
                ) : isNozzleBlock ? (
                  <span className="text-[9px] font-mono text-red-700 bg-red-950/40 px-1.5 py-0.5 rounded">BLOQ.</span>
                ) : null}

                {/* Action buttons */}
                {!lockedByOther && !isNozzleOffline && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isNozzleIdle && onDirectLiftAndStart && (
                      <button
                        onClick={() => onDirectLiftAndStart(dispenser.id, nozzle.fuelType)}
                        className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 flex items-center justify-center cursor-pointer transition-colors border border-amber-500/20"
                        title="Descolgar e iniciar"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isNozzleIdle || isNozzleReady) && canPreauth && (
                      <button
                        onClick={() => onPreAuthorize(dispenser.id, nozzle.fuelType)}
                        className="w-7 h-7 rounded-lg bg-slate-700/60 hover:bg-emerald-700/60 text-slate-400 hover:text-emerald-300 flex items-center justify-center cursor-pointer transition-all border border-slate-700/50 hover:border-emerald-600/40"
                        title="Pre-autorizar despacho"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isNozzlePrep && (
                      <button
                        onClick={() => onStartFueling(dispenser.id, nozzle.fuelType)}
                        className="w-7 h-7 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 flex items-center justify-center cursor-pointer animate-pulse border border-amber-500/30"
                        title="Iniciar surtido"
                      >
                        <Fuel className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isNozzleDisp && (
                      <button
                        onClick={() => onEmergencyStop(dispenser.id, nozzle.fuelType)}
                        className="w-7 h-7 rounded-lg bg-red-700/40 hover:bg-red-600/60 text-red-300 flex items-center justify-center cursor-pointer transition-colors border border-red-700/30"
                        title="Detener despacho"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isNozzleUnpaid && (
                      <button
                        onClick={() => { if (onPressNozzle) onPressNozzle(dispenser.id, nozzle.fuelType); }}
                        className="w-7 h-7 rounded-lg bg-rose-600/40 hover:bg-rose-500/60 text-rose-200 flex items-center justify-center cursor-pointer animate-bounce border border-rose-500/30"
                        title="Cobrar transacción"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isNozzleBlock && (
                      <button
                        onClick={() => onResetPump(dispenser.id, nozzle.fuelType)}
                        className="w-7 h-7 rounded-lg bg-sky-900/30 text-sky-400 hover:bg-sky-800/40 flex items-center justify-center cursor-pointer border border-sky-800/30"
                        title="Resetear manguera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasPending && !isNozzleDisp && !isNozzlePrep && !isNozzleUnpaid && !isNozzleBlock && (
                      <button
                        onClick={() => { if (onPressNozzle) onPressNozzle(dispenser.id, nozzle.fuelType); }}
                        className="w-7 h-7 rounded-lg bg-rose-900/40 text-rose-400 hover:bg-rose-800/50 flex items-center justify-center cursor-pointer animate-pulse border border-rose-800/30"
                        title="Gestionar pendientes"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pending dispatches button */}
      {totalPending > 0 && !dispenser.isBlocked && (
        <button
          onClick={() => { if (firstPending && onPressNozzle) onPressNozzle(dispenser.id, firstPending.fuelType); }}
          className="mx-3 mb-3 py-2 rounded-xl border border-rose-500/25 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
            {totalPending}
          </span>
          Gestionar Despachos Pendientes
        </button>
      )}
    </div>
  );
}
