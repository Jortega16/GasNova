/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { PriceConfig, ScheduledPrice, FuelType } from '../types';
import { Sparkles, Edit2, Trash2, Calendar, Clock, Plus, HelpCircle, Check, ArrowRight, AlertCircle, Download, Upload, Cpu, X } from 'lucide-react';
import { api } from '../api';

interface PriceConfigTabProps {
  prices: PriceConfig[];
  scheduledPrices: ScheduledPrice[];
  onUpdatePrice: (fuelType: FuelType, newPrice: number) => void | Promise<void>;
  onAddScheduledPrice: (dateTime: string, fuelType: FuelType, newPrice: number) => void | Promise<void>;
  onCancelScheduledPrice: (id: string) => void;
  onFetchPricesFromPts2?: () => Promise<void>;
  onSyncPricesToPts2?: () => Promise<void>;
}

const fuelTypeTranslations: { [key: string]: string } = {
  'Regular Unleaded': 'Gasolina Regular',
  'Premium Unleaded': 'Gasolina Premium',
  'Diesel': 'Diesel',
  'Kerosene': 'Queroseno',
  'LPG': 'LPG'
};

const displayFuelName = (p: PriceConfig): string =>
  (p.name && p.name.trim()) || fuelTypeTranslations[p.fuelType] || p.fuelType;

export default function PriceConfigTab({
  prices,
  scheduledPrices,
  onUpdatePrice,
  onAddScheduledPrice,
  onCancelScheduledPrice,
  onFetchPricesFromPts2,
  onSyncPricesToPts2,
}: PriceConfigTabProps) {
  const [isFetchingPts2, setIsFetchingPts2] = useState(false);
  const [isSyncingPts2, setIsSyncingPts2] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // States for Quick Price Update Panel
  const [quickFuelType, setQuickFuelType] = useState<FuelType>('Regular Unleaded');
  const [quickPrice, setQuickPrice] = useState<string>('');
  const [quickSuccess, setQuickSuccess] = useState<boolean>(false);

  // States for Scheduling
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
  const [schedDate, setSchedDate] = useState<string>('');
  const [schedTime, setSchedTime] = useState<string>('');
  const [schedFuelType, setSchedFuelType] = useState<FuelType>('Regular Unleaded');
  const [schedPrice, setSchedPrice] = useState<string>('');
  const [schedSuccess, setSchedSuccess] = useState<boolean>(false);

  // States for inline Edit of active price
  const [editingType, setEditingType] = useState<FuelType | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<string>('');

  // States for native PTS-2 hardware price scheduler (SetPricesSchedulerConfiguration)
  interface NativeSchedule {
    id: number;
    enabled: boolean;
    fuelGradeId: number;
    price: number;
    dateTime: string; // YYYY-MM-DDThh:mm:ss
    everyMonday: boolean;
    everyTuesday: boolean;
    everyWednesday: boolean;
    everyThursday: boolean;
    everyFriday: boolean;
    everySaturday: boolean;
    everySunday: boolean;
  }
  const [nativeSchedules, setNativeSchedules] = useState<NativeSchedule[]>([]);
  const [nativeLoading, setNativeLoading] = useState(false);
  const [nativeSaving, setNativeSaving] = useState(false);
  const [nativeMessage, setNativeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNativeScheduler, setShowNativeScheduler] = useState(false);

  const emptyNativeSchedule = (id: number): NativeSchedule => ({
    id, enabled: true, fuelGradeId: 1, price: 0, dateTime: '',
    everyMonday: false, everyTuesday: false, everyWednesday: false,
    everyThursday: false, everyFriday: false, everySaturday: false, everySunday: false,
  });

  const loadNativeSchedules = async () => {
    setNativeLoading(true);
    setNativeMessage(null);
    try {
      const res = await api.getPricesSchedulerConfiguration();
      const raw = (res.data as any)?.PriceSchedules ?? [];
      const loaded: NativeSchedule[] = raw
        .filter((s: any) => (s.FuelGradeId ?? 0) > 0)
        .map((s: any) => ({
          id: s.Id,
          enabled: !!s.Enabled,
          fuelGradeId: s.FuelGradeId,
          price: s.Price ?? 0,
          dateTime: s.DateTime ?? '',
          everyMonday: !!s.EveryMonday,
          everyTuesday: !!s.EveryTuesday,
          everyWednesday: !!s.EveryWednesday,
          everyThursday: !!s.EveryThursday,
          everyFriday: !!s.EveryFriday,
          everySaturday: !!s.EverySaturday,
          everySunday: !!s.EverySunday,
        }));
      setNativeSchedules(loaded);
      if (!res.ok) {
        setNativeMessage({ type: 'error', text: res.error || 'No se pudo leer la programación del PTS-2.' });
      }
    } catch (e) {
      setNativeMessage({ type: 'error', text: 'Error de conexión al leer la programación del PTS-2.' });
    } finally {
      setNativeLoading(false);
    }
  };

  useEffect(() => {
    if (showNativeScheduler && nativeSchedules.length === 0) {
      loadNativeSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNativeScheduler]);

  const handleAddNativeSchedule = () => {
    const usedIds = new Set(nativeSchedules.map(s => s.id));
    let nextId = 1;
    while (usedIds.has(nextId) && nextId <= 10) nextId++;
    if (nextId > 10) return; // máximo 10 slots soportados por el controlador
    setNativeSchedules(prev => [...prev, emptyNativeSchedule(nextId)]);
  };

  const handleUpdateNativeSchedule = (id: number, patch: Partial<NativeSchedule>) => {
    setNativeSchedules(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const handleRemoveNativeSchedule = (id: number) => {
    setNativeSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveNativeSchedules = async () => {
    setNativeSaving(true);
    setNativeMessage(null);
    try {
      const res = await api.setPricesSchedulerConfiguration(nativeSchedules);
      if (res.ok) {
        setNativeMessage({ type: 'success', text: '✓ Programación guardada en el controlador PTS-2.' });
      } else {
        setNativeMessage({ type: 'error', text: res.error || 'Error al guardar en el PTS-2.' });
      }
    } catch (e) {
      setNativeMessage({ type: 'error', text: 'Error de conexión al guardar en el PTS-2.' });
    } finally {
      setNativeSaving(false);
    }
  };

  const fuelGradeIdLabel = (id: number): string => {
    const byOrder = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const name = byOrder[id - 1];
    return name ? (fuelTypeTranslations[name] || name) : `Grado #${id}`;
  };

  React.useEffect(() => {
    if (prices.length > 0) {
      if (!prices.some(p => p.fuelType === quickFuelType)) {
        setQuickFuelType(prices[0].fuelType);
      }
      if (!prices.some(p => p.fuelType === schedFuelType)) {
        setSchedFuelType(prices[0].fuelType);
      }
    }
  }, [prices, quickFuelType, schedFuelType]);

  const handleQuickApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickPrice);
    if (isNaN(val) || val <= 0) {
      alert('Por favor ingrese un precio numérico válido (mayor a 0).');
      return;
    }
    try {
      await onUpdatePrice(quickFuelType, val);
      setQuickSuccess(true);
      setQuickPrice('');
      setSyncMessage({ type: 'success', text: '✓ Precio aplicado en GasNova y enviado al PTS-2.' });
      setTimeout(() => setQuickSuccess(false), 3000);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `✗ No se pudo aplicar en PTS-2: ${err.message || err}` });
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  const handleAddScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(schedPrice);
    if (!schedDate || !schedTime || isNaN(val) || val <= 0) {
      alert('Por favor complete todos los datos con valores correctos.');
      return;
    }
    
    const formattedDateTime = `${schedDate} ${schedTime}`;
    try {
      await onAddScheduledPrice(formattedDateTime, schedFuelType, val);
      setSchedSuccess(true);
      setSchedPrice('');
      setSchedDate('');
      setSchedTime('');
      setSyncMessage({ type: 'success', text: '✓ Precio programado en GasNova y en el scheduler del PTS-2.' });
      setTimeout(() => {
        setSchedSuccess(false);
        setShowScheduleForm(false);
      }, 2000);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `✗ No se pudo programar en PTS-2: ${err.message || err}` });
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  const startEditInline = (type: FuelType, curPrice: number) => {
    setEditingType(type);
    setEditPriceVal(curPrice.toFixed(2));
  };

  const saveEditInline = async () => {
    if (editingType) {
      const val = parseFloat(editPriceVal);
      if (!isNaN(val) && val > 0) {
        try {
          await onUpdatePrice(editingType, val);
          setSyncMessage({ type: 'success', text: '✓ Precio actualizado y enviado al PTS-2.' });
          setTimeout(() => setSyncMessage(null), 4000);
        } catch (err: any) {
          setSyncMessage({ type: 'error', text: `✗ Error al enviar al PTS-2: ${err.message || err}` });
          setTimeout(() => setSyncMessage(null), 6000);
        }
      }
      setEditingType(null);
    }
  };

  const handleFetchPts2 = async () => {
    if (!onFetchPricesFromPts2) return;
    setIsFetchingPts2(true);
    setSyncMessage(null);
    try {
      await onFetchPricesFromPts2();
      setSyncMessage({ type: 'success', text: '✓ Precios y nombres importados del PTS-2 (GetFuelGradesConfiguration) y guardados en BD.' });
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `✗ Error al obtener precios: ${err.message || err}` });
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsFetchingPts2(false);
    }
  };

  const handleSyncPts2 = async () => {
    if (!onSyncPricesToPts2) return;
    setIsSyncingPts2(true);
    setSyncMessage(null);
    try {
      await onSyncPricesToPts2();
      setSyncMessage({ type: 'success', text: '✓ Precios enviados al PTS-2 y sincronizados en la BD con éxito.' });
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `✗ Error al sincronizar precios: ${err.message || err}` });
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncingPts2(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="price-configuration-container">
      
      {/* Left Column (8 cols): Management Tables */}
      <div className="col-span-1 lg:col-span-9 space-y-6">
        
        {/* Active prices summary config card */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-300 overflow-hidden" id="active-prices-management">
          <div className="bg-[#1b365d] px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-sans font-bold text-lg text-white">Gestión de Precios de Combustible</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFetchPts2}
                disabled={isFetchingPts2 || isSyncingPts2}
                className="flex items-center gap-1.5 bg-[#93b9ff]/20 hover:bg-[#93b9ff]/35 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded-lg border border-[#93b9ff]/30 cursor-pointer transition-colors shadow-sm"
                title="Importa nombres y precios del PTS-2 (GetFuelGradesConfiguration)"
              >
                <Download className="w-3.5 h-3.5" />
                {isFetchingPts2 ? 'Obteniendo...' : 'Importar de PTS-2'}
              </button>
              
              <button
                onClick={handleSyncPts2}
                disabled={isFetchingPts2 || isSyncingPts2}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors shadow-md"
                title="Actualiza los precios en la BD local y envía la configuración al PTS-2"
              >
                <Upload className="w-3.5 h-3.5" />
                {isSyncingPts2 ? 'Sincronizando...' : 'Enviar a PTS-2 / BD'}
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className={`px-5 py-2 text-xs font-bold border-b transition-all animate-fadeIn ${
              syncMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {syncMessage.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="active-prices-table">
              <thead>
                <tr className="bg-slate-100 text-xs text-[#191c1e] font-sans font-bold border-b border-neutral-300 uppercase tracking-wider">
                  <th className="px-6 py-3">Tipo de Combustible</th>
                  <th className="px-6 py-3 text-right">Precio Actual ($/Gal)</th>
                  <th className="px-6 py-3">Última Actualización</th>
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm font-sans">
                {prices.map((p) => (
                  <tr key={p.fuelType} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Fuel type */}
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            p.fuelType === 'Regular Unleaded' ? 'bg-[#355e9e]' :
                            p.fuelType === 'Premium Unleaded' ? 'bg-amber-600' : 'bg-emerald-600'
                          }`} />
                          <span>{displayFuelName(p)}</span>
                        </div>
                        {(p as any).tankNames && (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 ml-5">
                            Asociado a: {(p as any).tankNames}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price edit */}
                    <td className="px-6 py-4 text-right font-mono text-base font-bold text-slate-900">
                      {editingType === p.fuelType ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-normal text-slate-400">$</span>
                          <input
                            type="text"
                            value={editPriceVal}
                            autoFocus
                            onChange={(e) => setEditPriceVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditInline()}
                            className="bg-neutral-100 border border-[#355e9e] rounded px-1.5 py-0.5 w-18 text-right focus:outline-none focus:ring-1 focus:ring-[#355e9e]"
                          />
                        </div>
                      ) : (
                        <span>${p.price.toFixed(2)}</span>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {p.lastUpdated}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      {editingType === p.fuelType ? (
                        <button
                          onClick={saveEditInline}
                          className="bg-green-700 hover:bg-green-700/80 text-white font-semibold text-xs py-1 px-3 rounded shadow cursor-pointer"
                        >
                          Guardar
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEditInline(p.fuelType, p.price)}
                            className="flex items-center gap-1 bg-[#1b365d] hover:bg-[#1b365d]/80 text-white font-semibold text-xs py-1 px-2.5 rounded transition-all cursor-pointer shadow-sm"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar Precio</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scheduled Price Changes segment */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-300 overflow-hidden" id="scheduled-prices-management">
          <div className="bg-slate-100 border-b border-neutral-300 px-5 py-3.5 flex items-center justify-between">
            <h2 className="font-sans font-bold text-base text-[#191c1e] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#355e9e]" />
              Cambios de Precio Programados
            </h2>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="flex items-center gap-1 bg-[#2E7D32] hover:bg-[#2E7D32]/80 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              id="add-schedule-button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Programar Precio</span>
            </button>
          </div>

          {/* Form to schedule price change (collapsible) */}
          {showScheduleForm && (
            <form onSubmit={handleAddScheduleSubmit} className="p-4 bg-yellow-50 border-b border-amber-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-sans">Combustible</label>
                <select
                  value={schedFuelType}
                  onChange={(e) => setSchedFuelType(e.target.value as FuelType)}
                  className="w-full bg-white border border-neutral-300 rounded p-1.5 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#355e9e]"
                >
                  {prices.map(p => (
                    <option key={p.fuelType} value={p.fuelType}>
                      {displayFuelName(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-sans">Precio Nuevo ($/G)</label>
                <input
                  type="number"
                  step="0.01"
                  value={schedPrice}
                  required
                  onChange={(e) => setSchedPrice(e.target.value)}
                  placeholder="e.g. 4.25"
                  className="w-full bg-white border border-neutral-300 rounded p-1.5 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#355e9e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-sans">Fecha y Hora</label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={schedDate}
                    required
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded p-1 text-xs focus:outline-none"
                  />
                  <input
                    type="time"
                    value={schedTime}
                    required
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded p-1 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-neutral-300 text-slate-700 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#1b365d] hover:bg-[#1b365d]/80 text-white rounded cursor-pointer flex items-center gap-1 shadow"
                >
                  Confirmar
                </button>
              </div>
            </form>
          )}

          {schedSuccess && (
            <div className="bg-emerald-50 text-emerald-800 p-2 text-center text-xs font-semibold border-b border-emerald-200">
              ✓ ¡Cambio programado exitosamente! El sistema lo aplicará automáticamente en la fecha indicada.
            </div>
          )}

          {/* List of Changes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="scheduled-prices-table">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-sans border-b border-neutral-200 uppercase tracking-wider">
                  <th className="px-6 py-2.5">Fecha / Hora Programada</th>
                  <th className="px-6 py-2.5">Grado de Combustible</th>
                  <th className="px-6 py-2.5 text-right">Precio Programado</th>
                  <th className="px-6 py-2.5 text-center">Estado</th>
                  <th className="px-6 py-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                {scheduledPrices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-slate-400 font-sans">
                      Sin cambios de precios programados para las próximas 72 horas.
                    </td>
                  </tr>
                ) : (
                  scheduledPrices.map((sp) => (
                    <tr key={sp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-medium text-slate-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {sp.dateTime}
                      </td>
                      <td className="px-6 py-3 text-slate-800 font-semibold">{fuelTypeTranslations[sp.fuelType] || sp.fuelType}</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">${sp.newPrice.toFixed(2)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          sp.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          sp.status === 'Applied' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sp.status === 'Pending' ? 'Pendiente' : sp.status === 'Applied' ? 'Aplicado' : sp.status === 'Cancelled' ? 'Cancelado' : sp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {sp.status === 'Pending' && (
                          <button
                            onClick={() => onCancelScheduledPrice(sp.id)}
                            className="bg-red-800 hover:bg-red-800/80 text-white py-0.5 px-2 rounded hover:shadow-sm cursor-pointer font-bold text-[10px]"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Native PTS-2 hardware price scheduler */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-300 overflow-hidden mt-4" id="native-prices-scheduler">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowNativeScheduler(prev => !prev)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#355e9e]" />
              <span className="font-sans font-bold text-sm text-slate-800">Programación Nativa del Controlador PTS-2</span>
              {showNativeScheduler ? <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-90" /> : <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <span className="text-[10px] text-slate-400 font-sans">
              El propio controlador aplica el cambio, aunque el backend esté apagado
            </span>
          </div>

          {showNativeScheduler && (
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                Hasta 10 programas guardados directamente en el hardware del PTS-2. Marca días de la semana para que se repita automáticamente; sin ningún día marcado, se aplica una sola vez en la fecha indicada.
              </p>

              {nativeMessage && (
                <div className={`text-xs font-semibold rounded p-2 ${nativeMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {nativeMessage.text}
                </div>
              )}

              {nativeLoading ? (
                <div className="text-xs text-slate-400 text-center py-4">Cargando programación del controlador...</div>
              ) : (
                <div className="space-y-2">
                  {nativeSchedules.length === 0 && (
                    <div className="text-xs text-slate-400 italic text-center py-3 bg-slate-50 rounded-lg border">
                      No hay programas configurados en el controlador.
                    </div>
                  )}
                  {nativeSchedules.map((s) => (
                    <div key={s.id} className="border border-neutral-200 rounded-lg p-3 bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border rounded px-1.5 py-0.5">#{s.id}</span>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                          <input
                            type="checkbox"
                            checked={s.enabled}
                            onChange={(e) => handleUpdateNativeSchedule(s.id, { enabled: e.target.checked })}
                            className="cursor-pointer"
                          />
                          Activo
                        </label>
                        <select
                          value={s.fuelGradeId}
                          onChange={(e) => handleUpdateNativeSchedule(s.id, { fuelGradeId: Number(e.target.value) })}
                          className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => (
                            <option key={id} value={id}>{fuelGradeIdLabel(id)}</option>
                          ))}
                        </select>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-[10px]">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={s.price}
                            onChange={(e) => handleUpdateNativeSchedule(s.id, { price: Number(e.target.value) })}
                            className="w-24 border border-neutral-300 rounded pl-5 pr-2 py-1 text-xs font-mono bg-white"
                          />
                        </div>
                        <input
                          type="datetime-local"
                          value={s.dateTime.slice(0, 16)}
                          onChange={(e) => handleUpdateNativeSchedule(s.id, { dateTime: e.target.value + ':00' })}
                          className="border border-neutral-300 rounded px-2 py-1 text-xs font-mono bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNativeSchedule(s.id)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded cursor-pointer ml-auto"
                          title="Eliminar programa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[9.5px] font-bold text-slate-500">
                        <span className="uppercase tracking-wide text-slate-400">Repetir:</span>
                        {([
                          ['everyMonday', 'Lun'], ['everyTuesday', 'Mar'], ['everyWednesday', 'Mié'],
                          ['everyThursday', 'Jue'], ['everyFriday', 'Vie'], ['everySaturday', 'Sáb'], ['everySunday', 'Dom'],
                        ] as [keyof NativeSchedule, string][]).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={s[key] as boolean}
                              onChange={(e) => handleUpdateNativeSchedule(s.id, { [key]: e.target.checked } as Partial<NativeSchedule>)}
                              className="cursor-pointer"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddNativeSchedule}
                  disabled={nativeSchedules.length >= 10}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#355e9e] hover:text-[#1b365d] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar programa ({nativeSchedules.length}/10)
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadNativeSchedules}
                    disabled={nativeLoading}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer disabled:opacity-50"
                  >
                    Recargar del PTS-2
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNativeSchedules}
                    disabled={nativeSaving}
                    className="px-4 py-1.5 bg-[#1b365d] hover:bg-[#2a4f8f] text-white text-xs font-bold rounded cursor-pointer disabled:opacity-60"
                  >
                    {nativeSaving ? 'Guardando...' : 'Guardar en PTS-2'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Right Column (3 cols): Quick Price Update Panel */}
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-[#191c1e] text-white rounded-xl border border-slate-800 p-5 space-y-4 shadow-md sticky top-6" id="quick-price-update-card">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#93b9ff]" />
              Actualización Rápida
            </h3>
            <p className="text-[11px] text-[#87a0cd] font-sans mt-1 leading-relaxed">
              Modifica los precios vigentes de un grado para todas las bombas de inmediato.
            </p>
          </div>

          <form onSubmit={handleQuickApply} className="space-y-4" id="quick-price-update-form">
            <div>
              <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                Tipo de Combustible
              </label>
              <select
                value={quickFuelType}
                onChange={(e) => setQuickFuelType(e.target.value as FuelType)}
                className="w-full bg-[#1b365d]/60 border border-[#355e9e] rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff]"
              >
                {prices.map(p => (
                  <option key={p.fuelType} value={p.fuelType} className="bg-[#002046]">
                    {displayFuelName(p)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                Nuevo Precio por Galón
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4.19"
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  className="w-full bg-[#1b365d]/30 border border-[#355e9e] rounded py-2 pl-7 pr-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#93b9ff]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#355e9e] hover:bg-[#355e9e]/80 text-white font-sans font-bold text-xs py-2.5 px-3 rounded text-center cursor-pointer transition-all border border-[#93b9ff]/30 shadow"
              id="apply-all-pumps-button"
            >
              Aplicar a Todas las Bombas
            </button>
          </form>

          {quickSuccess && (
            <div className="bg-[#2E7D32]/20 border border-[#4CAF50]/30 rounded p-3 text-center text-xs text-[#4CAF50] font-sans flex items-center gap-1.5 justify-center animate-pulse">
              <Check className="w-4 h-4 text-[#4CAF50]" />
              <span>¡Precios actualizados en todas las mangueras!</span>
            </div>
          )}

          {/* Quick FAQ / Helper */}
          <div className="bg-[#1b365d]/20 rounded-lg p-3 border border-[#355e9e]/20 text-[10.5px] text-[#87a0cd] space-y-2 leading-relaxed">
            <span className="font-bold flex items-center gap-1 text-white">
              <HelpCircle className="w-3.5 h-3.5 text-[#93b9ff]" /> Nota Informativa:
            </span>
            <p>
              Al presionar "Aplicar a Todas las Bombas", la computadora central recalcula inmediatamente la tarifa cobrada por manguera en el dispensador físico. El cambio se refleja instantáneamente en el panel del operario y en las pantallas exteriores.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
