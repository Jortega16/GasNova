/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Fuel, Radio, Power, CheckCircle2, RotateCcw } from 'lucide-react';
import { DispenserState, FuelType } from '../types';

interface SimUniPumpPanelProps {
  dispensers: DispenserState[];
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  onToggleNozzleUp: (dispenserId: number, fuelType: FuelType) => void;
  nozzleUpStates: { [key: string]: boolean }; // key: `${dispenserId}-${fuelType}`
  triggerStates: { [key: string]: boolean }; // key: `${dispenserId}-${fuelType}`
  onToggleTrigger: (dispenserId: number, fuelType: FuelType) => void;
  onResetAllSimulator: () => void;
}

export default function SimUniPumpPanel({
  dispensers,
  isSimulating,
  setIsSimulating,
  onToggleNozzleUp,
  nozzleUpStates,
  triggerStates,
  onToggleTrigger,
  onResetAllSimulator
}: SimUniPumpPanelProps) {
  const [selectedPumpId, setSelectedPumpId] = useState<number>(1);
  const selectedDispenser = dispensers.find(d => d.id === selectedPumpId) || dispensers[0];

  return (
    <div className="bg-[#0f1216] border border-[#262a30] rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs select-none">
      {/* Header with Mode Toggle built-in */}
      <div className="bg-[#161a22] border-b border-[#262a30] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-md ${isSimulating ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
          <span className="font-bold text-slate-200 text-[11px] tracking-widest uppercase">SimUniPump Web Simulator</span>
        </div>

        {/* Selector de modo */}
        <div className="flex items-center gap-1.5 bg-[#10141a] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setIsSimulating(true)}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            💻 Simulador Web
          </button>
          <button
            onClick={() => setIsSimulating(false)}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              !isSimulating
                ? 'bg-emerald-600 text-white font-black shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🔌 Conectado al PTS-2
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isSimulating && (
            <button
              onClick={onResetAllSimulator}
              className="p-1.5 rounded bg-[#20252e] hover:bg-[#2d3442] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Resetear simulador"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
            isSimulating
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {isSimulating ? 'MOCK MODE ACTIVE' : 'ONLINE MODE'}
          </span>
        </div>
      </div>

      {/* Body Section */}
      {!isSimulating ? (
        /* Real Mode Disabled Message inside the outer frame */
        <div className="bg-[#111418] p-8 text-slate-400 text-xs font-mono flex flex-col items-center justify-center gap-3 h-[200px]">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <p className="font-bold text-center text-slate-200 uppercase tracking-widest text-[11px]">Modo Real PTS-2 (Online)</p>
          <p className="text-center text-[10px] text-slate-500 max-w-md font-sans leading-relaxed">
            El sistema está conectado directamente al controlador físico en la IP <span className="font-mono text-blue-400 font-bold">192.168.50.117</span>.
            Para simular el levantamiento de mangueras y activación de gatillos, por favor interactúa con la pistola física o utiliza la aplicación Windows <span className="font-mono text-amber-400 font-bold">SimUniPump.exe</span>.
          </p>
        </div>
      ) : (
        /* Simulator Interactive Layout */
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#262a30]">
          
          {/* Pump Selectors (Left side) */}
          <div className="p-3 flex md:flex-col gap-1.5 overflow-x-auto shrink-0 md:w-36">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1 hidden md:block">Surtidores</div>
            {dispensers.map(d => {
              const isSelected = d.id === selectedPumpId;
              const activeNozzle = d.nozzles.find(n => n.status === 'Dispensing');
              const hasNozzleUp = d.nozzles.some(n => nozzleUpStates[`${d.id}-${n.fuelType}`]);
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedPumpId(d.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all cursor-pointer whitespace-nowrap md:w-full border ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                      : 'bg-[#15191e] border-[#22272e] text-slate-400 hover:bg-[#1a1f26]'
                  }`}
                >
                  <span>{d.name}</span>
                  <div className="flex gap-1">
                    {hasNozzleUp && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                    {activeNozzle && (
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pump Detail & Nozzles (Right side) */}
          <div className="flex-1 p-4 flex flex-col gap-4 bg-[#111418]">
            <div className="flex items-center justify-between border-b border-[#262a30]/60 pb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                Control de Boquillas - {selectedDispenser?.name}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                1° Descolgar manguera → 2° Activar gatillo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedDispenser?.nozzles.map((nozzle, idx) => {
                const key = `${selectedDispenser.id}-${nozzle.fuelType}`;
                const isUp = !!nozzleUpStates[key];
                const isTriggerActive = !!triggerStates[key];
                const isDispensing = nozzle.status === 'Dispensing';
                const isPrepaid = nozzle.status === 'Prepaid';

                let colorClass = 'border-slate-800 bg-[#161a20] hover:border-slate-700 text-slate-400';
                if (isUp) {
                  colorClass = 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/5';
                }
                if (isDispensing) {
                  colorClass = 'border-green-500/50 bg-green-500/10 text-green-400 shadow-md shadow-green-500/5';
                }

                return (
                  <div key={nozzle.fuelType} className="flex flex-col gap-2">
                    <button
                      onClick={() => onToggleNozzleUp(selectedDispenser.id, nozzle.fuelType)}
                      className={`flex flex-col items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer text-center relative w-full ${colorClass}`}
                    >
                      {/* Position number */}
                      <span className="absolute top-1.5 left-2 text-[8px] font-black text-slate-600 font-mono">
                        BOQ {idx + 1}
                      </span>

                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${isUp ? 'bg-amber-500/20' : 'bg-[#202630]'} transition-colors`}>
                        <Fuel className={`w-5 h-5 ${isDispensing ? 'animate-bounce text-green-400' : ''}`} />
                      </div>

                      {/* Label */}
                      <div className="flex flex-col gap-0.5 min-w-0 w-full">
                        <span className="text-[10px] font-bold truncate">{nozzle.fuelType.split(' ')[0]}</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                          {isDispensing ? '⚡ Surtidor activo' : isPrepaid ? '✓ Autorizado' : isUp ? '⛽ Descolgado' : '○ Colgado'}
                        </span>
                      </div>

                      {/* Status Indicator Bar */}
                      <div className={`h-1 w-full rounded-full ${isDispensing ? 'bg-green-500 animate-pulse' : isUp ? 'bg-amber-500' : 'bg-[#262a30]'}`} />
                    </button>

                    {/* Trigger button */}
                    {isUp && (
                      <button
                        onClick={() => onToggleTrigger(selectedDispenser.id, nozzle.fuelType)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[9px] tracking-wider cursor-pointer border transition-all ${
                          isTriggerActive
                            ? 'bg-green-700 hover:bg-green-600 border-green-500 text-white animate-pulse'
                            : 'bg-[#20252e] border-[#303642] text-slate-400 hover:text-white hover:border-slate-500'
                        }`}
                      >
                        {isTriggerActive ? '🔫 GATILLO ACTIVO' : '🔫 PRENSAR GATILLO'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
