/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TankState, FuelType } from '../types';
import { AlertTriangle, Package, Database, CheckCircle, Flame, Plus, ShieldAlert, ArrowDownCircle, AlertOctagon } from 'lucide-react';

interface InventoryTabProps {
  tanks: TankState[];
  onRefillTank: (tankId: string, gallons: number) => void;
  onAddTank?: (name: string, fuelType: FuelType, maxCapacity: number) => void;
  setTanks?: React.Dispatch<React.SetStateAction<TankState[]>>;
}

const fuelTypeTranslations: { [key: string]: string } = {
  'Regular Unleaded': 'Gasolina Regular',
  'Premium Unleaded': 'Gasolina Premium',
  'Diesel': 'Diesel',
  'LPG': 'LPG'
};

export default function InventoryTab({ tanks, onRefillTank, onAddTank, setTanks }: InventoryTabProps) {
  
  const [selectedTankId, setSelectedTankId] = useState<string>('T-01');
  const [refillAmount, setRefillAmount] = useState<string>('3000');
  const [refillSuccess, setRefillSuccess] = useState<boolean>(false);

  // Add Tank State
  const [newTankName, setNewTankName] = useState<string>('');
  const [newTankFuelType, setNewTankFuelType] = useState<FuelType>('Regular Unleaded');
  const [newTankCapacity, setNewTankCapacity] = useState<string>('10000');
  const [addTankSuccess, setAddTankSuccess] = useState<boolean>(false);

  const handleRefillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gals = parseFloat(refillAmount);
    if (isNaN(gals) || gals <= 0) {
      alert('Ingrese un número de galones válido.');
      return;
    }
    onRefillTank(selectedTankId, gals);
    setRefillSuccess(true);
    setTimeout(() => setRefillSuccess(false), 3000);
  };

  const handleAddTankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const capacityVal = parseFloat(newTankCapacity);
    if (isNaN(capacityVal) || capacityVal <= 1000) {
      alert('Por favor ingrese una capacidad mínima válida (> 1,000 Gal).');
      return;
    }
    if (onAddTank) {
      const name = newTankName.trim() || `Tank ${tanks.length + 1}`;
      onAddTank(name, newTankFuelType, capacityVal);
      setAddTankSuccess(true);
      setNewTankName('');
      setTimeout(() => setAddTankSuccess(false), 3000);
    }
  };

  // Liquid styling mapper
  const getTankColorClasses = (type: FuelType) => {
    switch (type) {
      case 'Regular Unleaded':
        return {
          bg: 'bg-blue-600',
          gradient: 'from-blue-700 to-blue-400',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500',
          waveBg: 'bg-blue-500/20'
        };
      case 'Premium Unleaded':
        return {
          bg: 'bg-amber-500',
          gradient: 'from-amber-600 to-amber-300',
          textColor: 'text-amber-500',
          borderColor: 'border-amber-500',
          waveBg: 'bg-amber-500/20'
        };
      case 'Diesel':
        return {
          bg: 'bg-emerald-600',
          gradient: 'from-emerald-700 to-emerald-400',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500',
          waveBg: 'bg-emerald-500/20'
        };
      case 'LPG':
      default:
        return {
          bg: 'bg-indigo-600',
          gradient: 'from-indigo-700 to-indigo-400',
          textColor: 'text-indigo-400',
          borderColor: 'border-indigo-500',
          waveBg: 'bg-indigo-500/20'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="inventory-tab-main-grid">
      
      {/* Left Column (9 cols): visual cylinders and full details table */}
      <div className="col-span-1 lg:col-span-9 space-y-6">
        
        {/* Visual Tanks Container Dashboard */}
        <div className="bg-white rounded-xl shadow border border-neutral-300 p-6" id="fuel-tanks-visualizer-card">
          <div className="border-b border-neutral-200 pb-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#355e9e]" />
              Estado del Inventario de Tanques de Combustible
            </h2>
            
            {setTanks && (
              <button
                type="button"
                onClick={() => {
                  setTanks(prev => prev.map(t => {
                    if (t.id === 'T-02') { // Tank 2 Premium Unleaded
                      return {
                        ...t,
                        currentLevel: 1200, // 12% of 10000 max capacity
                        status: 'Low Level Alert'
                      };
                    }
                    return t;
                  }));
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold text-xs py-1.5 px-3 rounded flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors self-start sm:self-auto"
                title="Simular calibre de Premium bajo de nivel para verificar alarma"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Simular Tanque Bajo</span>
              </button>
            )}
          </div>

          {/* Tanks flex/grid of visual cylinders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tanks.map((tank) => {
              const pct = Math.round((tank.currentLevel / tank.maxCapacity) * 100);
              const colorConfig = getTankColorClasses(tank.fuelType);
              const isWarning = pct <= 35;

              return (
                <div key={tank.id} className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-neutral-200" id={`visual-tank-block-${tank.id}`}>
                  {/* Tank Title Label */}
                  <div className="text-center mb-3">
                    <p className="font-sans font-bold text-slate-800 text-sm">{tank.name}</p>
                    <span className="text-xs text-slate-500 font-medium">{fuelTypeTranslations[tank.fuelType] || tank.fuelType}</span>
                  </div>

                  {/* Horizontal Cylinder visual */}
                  <div className="relative w-full max-w-[220px] h-32 rounded-2xl bg-neutral-200 border-4 border-neutral-400 shadow-inner overflow-hidden flex flex-col justify-end">
                    
                    {/* Measurement graduation lines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 text-[9px] font-mono text-neutral-500 font-bold z-10">
                      <span className="text-right">100% —</span>
                      <span className="text-right">75% —</span>
                      <span className="text-right">50% —</span>
                      <span className="text-right">25% —</span>
                      <span className="text-right">0% —</span>
                    </div>

                    {/* Liquid fill based on percentage */}
                    <div
                      className={`w-full rounded-b-xl bg-gradient-to-t ${colorConfig.gradient} transition-all duration-1000 relative shadow-[inset_0_4px_12px_rgba(255,255,255,0.25)]`}
                      style={{ height: `${pct}%` }}
                    >
                      {/* wave effect overlays */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 animate-pulse" />
                    </div>

                    {/* Digital display centered */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-white text-center flex-col z-20">
                      <span className="text-sm font-extrabold">{tank.currentLevel.toLocaleString()} / {tank.maxCapacity.toLocaleString()} G</span>
                      <span className="text-xs font-semibold">{pct}%</span>
                    </div>
                  </div>

                  {/* Under label details */}
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-700 font-sans">
                    <span className="font-mono font-bold">{tank.currentLevel} / {tank.maxCapacity} Gal ({pct}%)</span>
                    
                    {isWarning && (
                      <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" title="¡Nivel Bajo de Combustible!" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table representation segment */}
        <div className="bg-white rounded-xl shadow border border-neutral-300 overflow-hidden" id="inventory-details-card">
          <div className="bg-[#1b365d] px-5 py-3">
            <h3 className="text-white font-sans font-bold text-sm">Detalles de Inventario y Alertas</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="inventory-details-table">
              <thead>
                <tr className="bg-slate-100 text-xs text-[#191c1e] font-sans font-bold border-b border-neutral-300 uppercase tracking-wider">
                  <th className="px-5 py-3">ID Tanque</th>
                  <th className="px-5 py-3">Tipo de Combustible</th>
                  <th className="px-5 py-3">Última Entrega</th>
                  <th className="px-5 py-3 text-right">Nivel Actual</th>
                  <th className="px-5 py-3 text-center">Días Est. Restantes</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm font-sans">
                {tanks.map((tank) => {
                  const isLow = tank.status === 'Low Level Alert';
                  return (
                    <tr key={tank.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-600">{tank.id}</td>
                      <td className="px-5 py-3 text-slate-900 font-bold">{fuelTypeTranslations[tank.fuelType] || tank.fuelType}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{tank.recentDelivery}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                        {tank.currentLevel.toLocaleString()} Gal
                      </td>
                      <td className="px-5 py-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          isLow ? 'bg-red-50 text-red-700 animate-pulse' : 'bg-green-50 text-green-700'
                        }`}>
                          {tank.estDaysRemaining} Días
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                          isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isLow ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-red-800" />
                              <span>Alerta Bajo Nivel</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-800" />
                              <span>Ok</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Right Column (3 cols): Action Box to refill tank */}
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-[#191c1e] text-white rounded-xl border border-slate-800 p-5 space-y-4" id="inventory-refill-panel">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-[#4CAF50]" />
              Registrar Abastecimiento de Cisterna
            </h3>
            <p className="text-[11px] text-[#87a0cd] font-sans mt-1 leading-relaxed">
              Planifica o registra una recarga de pipa de combustible para reponer los niveles de un tanque.
            </p>
          </div>

          <form onSubmit={handleRefillSubmit} className="space-y-4" id="tank-refill-form">
            <div>
              <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                Seleccionar Tanque:
              </label>
              <select
                value={selectedTankId}
                onChange={(e) => setSelectedTankId(e.target.value)}
                className="w-full bg-[#1b365d]/60 border border-[#355e9e] rounded p-2 text-xs text-white focus:outline-none"
              >
                {tanks.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#002046]">
                    {t.name} ({fuelTypeTranslations[t.fuelType] || t.fuelType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                Cantidad a Rellenar (Galones)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  required
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  className="w-full bg-[#1b365d]/30 border border-[#355e9e] rounded py-2 px-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#93b9ff]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2E7D32] hover:bg-[#2E7D32]/80 text-white font-sans font-bold text-xs py-2.5 px-3 rounded text-center cursor-pointer transition-all border border-green-700 shadow"
              id="refill-tank-button"
            >
              Registrar Entrega
            </button>
          </form>

          {refillSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded p-3 text-center text-xs text-[#4CAF50] font-bold animate-pulse flex items-center justify-center gap-1.5">
              <span>✓ ¡Entrega registrada y sumada al nivel del tanque!</span>
            </div>
          )}

          {/* Warnings */}
          <div className="bg-[#1b365d]/25 border border-[#355e9e]/30 rounded-lg p-3 text-[10px] text-[#87a0cd] space-y-1.5 leading-relaxed">
            <span className="font-bold flex items-center gap-1 text-white">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Nota de Seguridad:
            </span>
            <p>
              Durante el proceso de llenado de pipas, la bomba conectada al tanque objetivo entrará en pausa temporal para evitar succión de partículas del asiento. Confirme la colocación del cable a tierra antes de transferir el combustible.
            </p>
          </div>
        </div>

        {/* Dynamic Add Tank Form Box */}
        {onAddTank && (
          <div className="bg-[#191c1e] text-white rounded-xl border border-slate-800 p-5 mt-4 space-y-4 shadow-md" id="inventory-add-tank-panel">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                Registrar Nuevo Tanque
              </h3>
              <p className="text-[11px] text-[#87a0cd] font-sans mt-1 leading-relaxed">
                Añade tanques de almacenamiento adicionales al panel de la estación para aumentar la capacidad instalada.
              </p>
            </div>

            <form onSubmit={handleAddTankSubmit} className="space-y-3" id="tank-add-new-form">
              <div>
                <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                  Nombre del Tanque:
                </label>
                <input
                  type="text"
                  value={newTankName}
                  onChange={(e) => setNewTankName(e.target.value)}
                  placeholder={`e.g. Tanque ${tanks.length + 1}`}
                  className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                  Tipo de Combustible:
                </label>
                <select
                  value={newTankFuelType}
                  onChange={(e) => setNewTankFuelType(e.target.value as FuelType)}
                  className="w-full bg-[#1b365d]/60 border border-[#355e9e] rounded p-2 text-xs text-white focus:outline-none"
                >
                  <option value="Regular Unleaded" className="bg-[#002046]">Gasolina Regular</option>
                  <option value="Premium Unleaded" className="bg-[#002046]">Gasolina Premium (Súper)</option>
                  <option value="Diesel" className="bg-[#002046]">Diesel</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                  Capacidad Máxima (Galones):
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={newTankCapacity}
                  onChange={(e) => setNewTankCapacity(e.target.value)}
                  className="w-full bg-[#1b365d]/30 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-2 px-3 rounded text-center cursor-pointer transition-all border border-emerald-700 shadow flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Tanque</span>
              </button>
            </form>

            {addTankSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded p-2 text-center text-[11px] text-[#4CAF50] font-sans">
                ✓ ¡Tanque añadido y conectado al inventario!
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
