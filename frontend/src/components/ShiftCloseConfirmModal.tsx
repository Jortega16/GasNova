import React, { useState, useEffect } from "react";
import { AlertTriangle, Lock, TrendingUp, Fuel, CreditCard, Banknote, X, ChevronRight, Gauge, Droplets } from "lucide-react";
import type { Transaction, ShiftDetails, DispenserState, FuelType } from "../types";
import { api } from "../api";

interface ShiftCloseConfirmModalProps {
  show: boolean;
  shiftDetails: ShiftDetails;
  transactions: Transaction[];
  dispensers: DispenserState[];
  currencySymbol: string;
  unitMeasure: string;
  onConfirm: (mechCounters: Record<number, { vol: number; amt: number }>) => void;
  onCancel: () => void;
}

const FUEL_LABELS: Record<string, string> = {
  'Regular Unleaded': 'Regular',
  'Premium Unleaded': 'Premium',
  'Diesel': 'Diesel',
  'Kerosene': 'Queroseno',
  'LPG': 'LPG',
};

const FUEL_COLORS: Record<string, string> = {
  'Regular Unleaded': 'bg-blue-500',
  'Premium Unleaded': 'bg-amber-500',
  'Diesel': 'bg-emerald-500',
  'Kerosene': 'bg-purple-500',
  'LPG': 'bg-rose-500',
};

export default function ShiftCloseConfirmModal({
  show,
  shiftDetails,
  transactions,
  dispensers,
  currencySymbol,
  unitMeasure,
  onConfirm,
  onCancel,
}: ShiftCloseConfirmModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [mechCounters, setMechCounters] = useState<Record<number, { vol: number; amt: number }>>({});

  useEffect(() => {
    if (!show) return;
    // Carga contadores mecánicos del PTS-2 para cada dispensador; defaultea a 0 si falla
    const fetchAll = async () => {
      const results: Record<number, { vol: number; amt: number }> = {};
      await Promise.allSettled(
        dispensers.map(async d => {
          const res = await api.getPumpCounters(d.id);
          results[d.id] = {
            vol: res.ok && res.data ? res.data.total_volume : 0,
            amt: res.ok && res.data ? res.data.total_amount : 0,
          };
        })
      );
      setMechCounters(results);
    };
    fetchAll();
  }, [show, dispensers]);

  if (!show) return null;

  const unit = unitMeasure === "Galones" ? "Gal" : "L";
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const totalVolume = transactions.reduce((s, t) => s + t.volume, 0);
  const cashAmount = transactions.filter(t => t.paymentType === "Cash").reduce((s, t) => s + t.amount, 0);
  const cardAmount = transactions.filter(t => t.paymentType !== "Cash").reduce((s, t) => s + t.amount, 0);

  // Sales by fuel type
  const fuelRows = (["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene", "LPG"] as FuelType[]).map(key => ({
    key,
    vol: transactions.filter(t => t.fuelType === key).reduce((s, t) => s + t.volume, 0),
    amt: transactions.filter(t => t.fuelType === key).reduce((s, t) => s + t.amount, 0),
  })).filter(f => f.vol > 0 || f.amt > 0);

  // Sales by nozzle: group by pumpId + fuelType
  const nozzleMap = new Map<string, { pumpName: string; fuelType: FuelType; vol: number; amt: number; count: number }>();
  for (const t of transactions) {
    const key = `${t.pumpId}-${t.fuelType}`;
    const existing = nozzleMap.get(key);
    if (existing) {
      existing.vol += t.volume;
      existing.amt += t.amount;
      existing.count += 1;
    } else {
      nozzleMap.set(key, { pumpName: t.pumpName, fuelType: t.fuelType as FuelType, vol: t.volume, amt: t.amount, count: 1 });
    }
  }
  const nozzleRows = Array.from(nozzleMap.values()).sort((a, b) => a.pumpName.localeCompare(b.pumpName));

  // Counter per dispenser (system totals from transactions)
  const counterRows = dispensers.map(d => ({
    id: d.id,
    name: d.name,
    vol: transactions.filter(t => t.pumpId === d.id).reduce((s, t) => s + t.volume, 0),
    amt: transactions.filter(t => t.pumpId === d.id).reduce((s, t) => s + t.amount, 0),
    count: transactions.filter(t => t.pumpId === d.id).length,
  }));

  const handleClose = () => { setStep(1); onCancel(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-200">

        {/* Header */}
        <div className="bg-[#1b365d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-rose-300" />
            <h3 className="text-white font-bold text-base font-sans">
              {step === 1 ? "Resumen de Cierre de Turno" : "Confirmar Cierre Definitivo"}
            </h3>
          </div>
          <button onClick={handleClose} className="text-slate-300 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex bg-slate-50 border-b border-neutral-200">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all ${step === s ? "text-[#1b365d] border-b-2 border-[#1b365d]" : "text-slate-400"}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${step > s ? "bg-emerald-500 text-white" : step === s ? "bg-[#1b365d] text-white" : "bg-slate-200 text-slate-400"}`}>
                {step > s ? "✓" : s}
              </span>
              {s === 1 ? "Revisar Resumen" : "Confirmar Cierre"}
            </div>
          ))}
        </div>

        {/* ── Step 1: Summary ── */}
        {step === 1 && (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Shift info */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 border border-neutral-200 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Turno</p>
                <p className="text-sm font-bold text-slate-800 font-mono">{shiftDetails.shiftId}</p>
              </div>
              <div className="bg-slate-50 border border-neutral-200 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Operador</p>
                <p className="text-sm font-bold text-slate-800">{shiftDetails.operatorName}</p>
              </div>
              <div className="bg-slate-50 border border-neutral-200 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Inicio</p>
                <p className="text-xs font-semibold text-slate-700">{shiftDetails.startTime}</p>
              </div>
              <div className="bg-slate-50 border border-neutral-200 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Transacciones</p>
                <p className="text-sm font-bold text-slate-800">{transactions.length}</p>
              </div>
            </div>

            {/* Total */}
            <div className="bg-[#1b365d] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#93b9ff]" />
                <div>
                  <p className="text-[10px] text-slate-300 uppercase tracking-wide font-semibold">Total Recaudado</p>
                  <p className="text-[10px] text-slate-400">{totalVolume.toFixed(2)} {unit} despachados</p>
                </div>
              </div>
              <p className="text-2xl font-black text-white font-mono">{currencySymbol}{totalAmount.toFixed(2)}</p>
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Efectivo</p>
                  <p className="text-sm font-bold text-emerald-800">{currencySymbol}{cashAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Tarjetas</p>
                  <p className="text-sm font-bold text-blue-800">{currencySymbol}{cardAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Fuel breakdown */}
            {fuelRows.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5" /> Ventas por Combustible
                </p>
                {fuelRows.map(f => (
                  <div key={f.key} className="flex items-center justify-between bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${FUEL_COLORS[f.key] ?? 'bg-slate-400'}`} />
                      <span className="text-xs font-semibold text-slate-700">{FUEL_LABELS[f.key] ?? f.key}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">{currencySymbol}{f.amt.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{f.vol.toFixed(2)} {unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sales by nozzle */}
            {nozzleRows.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" /> Ventas por Manguera
                </p>
                <div className="rounded-xl border border-neutral-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-neutral-200">
                        <th className="text-left px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cara / Manguera</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">{unit}</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Monto</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">#</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nozzleRows.map((r, i) => (
                        <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-1.5 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${FUEL_COLORS[r.fuelType] ?? 'bg-slate-400'}`} />
                            <span className="font-semibold text-slate-700 truncate max-w-[120px]">{r.pumpName}</span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-600">{r.vol.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-slate-800">{currencySymbol}{r.amt.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-right text-slate-400">{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Counters per dispenser */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> Contadores por Cara
              </p>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-neutral-200">
                      <th className="text-left px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cara</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sist. {unit}</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mec. {unit}</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dif.</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">#</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counterRows.map(r => {
                      const mech = mechCounters[r.id] ?? { vol: 0, amt: 0 };
                      const diff = mech.vol - r.vol;
                      return (
                        <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-semibold text-slate-700">{r.name}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-600">{r.vol.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-600">{mech.vol.toFixed(2)}</td>
                          <td className={`px-3 py-1.5 text-right font-bold ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-slate-400">{r.count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── Step 2: Final confirmation ── */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">¿Confirmar cierre de turno?</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Esta acción bloqueará todas las caras de despacho y registrará el cierre en el sistema. <strong>No se puede deshacer.</strong>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Antes de confirmar, verifique:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700">
                <li>No quedan mangueras despachando combustible</li>
                <li>Todos los cobros pendientes fueron procesados</li>
                <li>El operador saliente está presente para firmar el reporte</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-neutral-200 rounded-xl p-3 flex justify-between text-xs">
              <span className="text-slate-500">Turno a cerrar:</span>
              <span className="font-bold text-slate-800 font-mono">{shiftDetails.shiftId}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-neutral-200 flex gap-3">
          {step === 1 ? (
            <>
              <button onClick={handleClose} className="flex-1 border border-neutral-300 text-slate-600 font-bold text-xs py-2.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={() => setStep(2)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex-1 border border-neutral-300 text-slate-600 font-bold text-xs py-2.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer">
                ← Volver
              </button>
              <button onClick={() => { setStep(1); onConfirm(mechCounters); }} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Lock className="w-3.5 h-3.5" /> Cerrar Turno Definitivamente
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
