import React, { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, Fuel, CreditCard, Banknote, Gauge, Droplets } from "lucide-react";
import type { Transaction, ShiftDetails, DispenserState, FuelType } from "../types";
import { api } from "../api";

interface ShiftReceiptModalProps {
  show: boolean;
  shiftDetails: ShiftDetails;
  transactions: Transaction[];
  dispensers: DispenserState[];
  unitMeasure: string;
  currencySymbol: string;
  pendingMeters: Record<string, string> | null;
  onClose: () => void;
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

export default function ShiftReceiptModal({
  show,
  shiftDetails,
  transactions,
  dispensers,
  unitMeasure,
  currencySymbol,
  onClose,
}: ShiftReceiptModalProps) {
  const [mechCounters, setMechCounters] = useState<Record<number, { vol: number; amt: number }>>({});

  useEffect(() => {
    if (!show) return;
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

  const fuelRows = (["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene", "LPG"] as FuelType[]).map(key => ({
    key,
    vol: transactions.filter(t => t.fuelType === key).reduce((s, t) => s + t.volume, 0),
    amt: transactions.filter(t => t.fuelType === key).reduce((s, t) => s + t.amount, 0),
  })).filter(f => f.vol > 0 || f.amt > 0);

  // Sales by nozzle
  const nozzleMap = new Map<string, { pumpName: string; fuelType: FuelType; vol: number; amt: number; count: number }>();
  for (const t of transactions) {
    const key = `${t.pumpId}-${t.fuelType}`;
    const ex = nozzleMap.get(key);
    if (ex) { ex.vol += t.volume; ex.amt += t.amount; ex.count += 1; }
    else nozzleMap.set(key, { pumpName: t.pumpName, fuelType: t.fuelType as FuelType, vol: t.volume, amt: t.amount, count: 1 });
  }
  const nozzleRows = Array.from(nozzleMap.values()).sort((a, b) => a.pumpName.localeCompare(b.pumpName));

  // Counter per dispenser
  const counterRows = dispensers.map(d => ({
    id: d.id,
    name: d.name,
    vol: transactions.filter(t => t.pumpId === d.id).reduce((s, t) => s + t.volume, 0),
    amt: transactions.filter(t => t.pumpId === d.id).reduce((s, t) => s + t.amount, 0),
    count: transactions.filter(t => t.pumpId === d.id).length,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-200">

        {/* Header */}
        <div className="bg-emerald-600 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base font-sans">Turno Cerrado Exitosamente</h3>
            <p className="text-emerald-100 text-[11px] font-mono">{shiftDetails.shiftId}</p>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Shift metadata */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-neutral-200 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">Operador</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{shiftDetails.operatorName}</p>
            </div>
            <div className="bg-slate-50 border border-neutral-200 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">Inicio</p>
              <p className="text-[10px] font-semibold text-slate-700 mt-0.5">{shiftDetails.startTime}</p>
            </div>
            <div className="bg-slate-50 border border-neutral-200 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">Fin</p>
              <p className="text-[10px] font-semibold text-slate-700 mt-0.5">{shiftDetails.endTime}</p>
            </div>
          </div>

          {/* Total card */}
          <div className="bg-[#1b365d] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#93b9ff]" />
              <div>
                <p className="text-[10px] text-slate-300 uppercase tracking-wide font-semibold">Total Recaudado</p>
                <p className="text-[10px] text-slate-400">{transactions.length} transacciones · {totalVolume.toFixed(2)} {unit}</p>
              </div>
            </div>
            <p className="text-2xl font-black text-white font-mono">{currencySymbol}{totalAmount.toFixed(2)}</p>
          </div>

          {/* Payment breakdown */}
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
                          <span className="font-semibold text-slate-700 truncate max-w-[130px]">{r.pumpName}</span>
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

          {/* Status + signatures */}
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <span className="text-xs text-red-700 font-semibold">Estado del turno</span>
            <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              CERRADO Y BLOQUEADO
            </span>
          </div>

          <div className="border-t border-dashed border-neutral-300 pt-4 space-y-2 text-[11px] text-slate-500 text-center">
            <p>Firma Operador Saliente: <span className="inline-block border-b border-slate-400 w-36 ml-1" /></p>
            <p>Firma Supervisor POS: <span className="inline-block border-b border-slate-400 w-36 ml-1" /></p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="w-full bg-[#1b365d] hover:bg-[#132a4e] text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Cerrar y Continuar
          </button>
        </div>

      </div>
    </div>
  );
}
