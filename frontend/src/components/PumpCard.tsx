/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Fuel, Lock, Check, DollarSign, AlertCircle, PlayCircle } from 'lucide-react';
import { PumpState, FuelType } from '../types';

interface PumpCardProps {
  key?: any;
  pump: PumpState;
  onPreAuthorize: (pumpId: number) => void;
  onEmergencyStop: (pumpId: number) => void;
  onResetPump: (pumpId: number) => void;
  activeFuelPrice: number;
}

const fuelTypeTranslations: { [key: string]: string } = {
  'Regular Unleaded': 'Gasolina Regular',
  'Premium Unleaded': 'Gasolina Premium',
  'Diesel': 'Diesel',
  'Kerosene': 'Queroseno'
};

export default function PumpCard({ pump, onPreAuthorize, onEmergencyStop, onResetPump, activeFuelPrice }: PumpCardProps) {
  
  // Status config
  const getStatusConfig = () => {
    switch (pump.status) {
      case 'Dispensing':
        return {
          bg: 'bg-[#1b365d]',
          border: 'border-[#93b9ff] shadow-[0_0_15px_rgba(147,185,255,0.25)]',
          chipBg: 'bg-[#2E7D32]/20 text-[#4CAF50]',
          chipText: 'Despachando',
          icon: <Fuel className="w-5 h-5 text-[#93b9ff] animate-bounce" />,
        };
      case 'Fueling':
        return {
          bg: 'bg-[#1b365d]',
          border: 'border-[#355e9e] shadow-[0_0_10px_rgba(53,94,158,0.25)]',
          chipBg: 'bg-[#355e9e]/20 text-[#93b9ff]',
          chipText: 'Cargando',
          icon: <Fuel className="w-5 h-5 text-[#93b9ff]" />,
        };
      case 'Blocked':
        return {
          bg: 'bg-[#212327]/90',
          border: 'border-red-800/60',
          chipBg: 'bg-red-950/40 text-[#ba1a1a]', // alert red
          chipText: 'Bloqueado',
          icon: <Lock className="w-10 h-10 text-red-500 animate-pulse" />,
        };
      case 'Ready':
        return {
          bg: 'bg-[#1b365d]/40',
          border: 'border-[#2E7D32]/50',
          chipBg: 'bg-green-950/30 text-[#4CAF50]',
          chipText: 'Listo',
          icon: <Check className="w-10 h-10 text-[#4CAF50]" />,
        };
      case 'Prepaid':
        return {
          bg: 'bg-[#1b365d]/90',
          border: 'border-amber-700/60',
          chipBg: 'bg-amber-950/40 text-amber-500',
          chipText: 'Pre-pagado',
          icon: <DollarSign className="w-10 h-10 text-amber-500 animate-pulse" />,
        };
      case 'Idle':
      default:
        return {
          bg: 'bg-[#191c1e]',
          border: 'border-slate-800',
          chipBg: 'bg-slate-800/50 text-[#87a0cd]',
          chipText: 'Libre',
          icon: <PlayCircle className="w-5 h-5 text-[#87a0cd]" />,
        };
    }
  };

  const config = getStatusConfig();
  const isBlocked = pump.status === 'Blocked';
  const isDispensingOrFueling = pump.status === 'Dispensing' || pump.status === 'Fueling';
  const showPreauthOption = pump.status === 'Idle' || pump.status === 'Ready';

  return (
    <div
      className={`relative rounded-xl p-4 border transition-all duration-300 flex flex-col justify-between min-h-[220px] ${config.bg} ${config.border}`}
      id={`pump-card-${pump.id}`}
    >
      {/* Top Banner Row */}
      <div className="flex items-center justify-between pb-3 border-b border-[#355e9e]/20">
        <div>
          <h3 className="font-sans font-bold text-base text-white tracking-tight">
            {pump.name}
          </h3>
          <span className="text-xs text-[#87a0cd] font-mono tracking-wider">
            {pump.nozzle} • {fuelTypeTranslations[pump.fuelType] || pump.fuelType}
          </span>
        </div>
        
        {/* Status indicator badge */}
        <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-black ${config.chipBg}`}>
          ● {config.chipText}
        </span>
      </div>

      {/* Main Stats Segment */}
      <div className="py-4 flex-1 flex items-center justify-between gap-4">
        
        {/* Large Icons on Left if blocked/ready/prepaid */}
        {(pump.status === 'Blocked' || pump.status === 'Ready' || pump.status === 'Prepaid') ? (
          <div className="flex-1 flex flex-col items-center justify-center p-2">
            {config.icon}
            {pump.status === 'Prepaid' && (
              <span className="text-white font-mono font-bold mt-1 text-sm">
                Prepago: ${pump.limitAmount?.toFixed(2)}
              </span>
            )}
            {pump.status === 'Blocked' && (
              <span className="text-red-400 font-mono text-[11px] mt-1 text-center font-bold">
                ¡Bomba Bloqueada!
              </span>
            )}
            {pump.status === 'Ready' && (
              <span className="text-green-400 font-mono text-[11px] mt-1 text-center font-bold">
                Lista para Servir
              </span>
            )}
          </div>
        ) : (
          /* Pumping numbers */
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-[#87a0cd] font-sans">Monto:</span>
              <span className="text-xl font-bold font-mono tracking-normal text-[#aec7f7]" id={`pump-${pump.id}-amount`}>
                ${pump.currentAmount.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-[#87a0cd] font-sans">Volumen:</span>
              <span className="text-base font-semibold font-mono text-white" id={`pump-${pump.id}-volume`}>
                {pump.currentVolume.toFixed(2)} <span className="text-[10px] text-[#87a0cd]">Gal</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#87a0cd]">Grado:</span>
              <span className="font-mono text-white font-medium bg-[#133562] px-1.5 py-0.5 rounded">
                {fuelTypeTranslations[pump.fuelType] || pump.fuelType}
              </span>
            </div>

            {/* Fuel Nozzle icon inline */}
            {isDispensingOrFueling && (
              <div className="mt-2 text-[10px] text-[#93b9ff] flex items-center gap-1 font-mono justify-end">
                <span className="animate-pulse">Despachando combustible...</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic graphics on the right (fuel icon and progress bar) */}
        {isDispensingOrFueling && (
          <div className="w-16 h-16 bg-[#133562]/40 rounded-lg flex flex-col items-center justify-center p-2 border border-[#355e9e]/30 relative overflow-hidden">
            {config.icon}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#93b9ff] h-full rounded-full transition-all duration-300"
                style={{ width: `${pump.progressPercent}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#87a0cd] mt-0.5">{pump.progressPercent}%</span>
          </div>
        )}
      </div>

      {/* Button Controls Footer */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#355e9e]/10">
        
        {/* Pre-authorize / Auth controls */}
        {showPreauthOption ? (
          <button
            onClick={() => onPreAuthorize(pump.id)}
            className="col-span-1 bg-[#2E7D32] hover:bg-[#2E7D32]/80 text-white font-sans font-bold text-xs py-2 px-1 rounded transition-colors text-center cursor-pointer select-none border border-green-700"
          >
            Pre-autorizar
          </button>
        ) : pump.status === 'Prepaid' ? (
          <button
            onClick={() => onPreAuthorize(pump.id)} // can edit prepaid or start
            className="col-span-1 bg-amber-600 hover:bg-amber-600/80 text-white font-sans font-bold text-xs py-2 px-1 rounded transition-colors text-center cursor-pointer select-none border border-amber-500"
          >
            Iniciar Carga
          </button>
        ) : isBlocked ? (
          <button
            onClick={() => onResetPump(pump.id)}
            className="col-span-1 bg-[#355e9e] hover:bg-[#355e9e]/80 text-white font-mono font-bold text-xs py-2 px-1 rounded transition-colors text-center cursor-pointer select-none"
          >
            Desbloquear
          </button>
        ) : (
          <button
            disabled
            className="col-span-1 bg-gray-800 text-gray-500 font-sans font-bold text-xs py-2 px-1 rounded text-center opacity-40 cursor-not-allowed"
          >
            En Servicio
          </button>
        )}

        {/* Emergency Stop Button */}
        {isBlocked ? (
          <button
            disabled
            className="col-span-1 bg-gray-800 text-gray-500 font-sans font-medium text-xs py-2 px-1 rounded text-center opacity-30 cursor-not-allowed"
          >
            Bloqueado
          </button>
        ) : (
          <button
            onClick={() => onEmergencyStop(pump.id)}
            className="col-span-1 bg-[#ba1a1a] hover:bg-[#ba1a1a]/80 text-white font-sans font-semibold text-xs py-2 px-1 rounded transition-all text-center cursor-pointer select-none border border-red-700/60"
          >
            Parada Emg.
          </button>
        )}
      </div>
    </div>
  );
}
