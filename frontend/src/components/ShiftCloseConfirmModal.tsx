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
  /** Totales de cierre (absolutos PTS) por cara */
  const [closingCounters, setClosingCounters] = useState<Record<number, { vol: number; amt: number; ok: boolean }>>({});
  const [openingCountersLocal, setOpeningCountersLocal] = useState<Record<number, { volume: number; amount: number }>>({});
  const [countersLoading, setCountersLoading] = useState(false);
  const [countersAttempted, setCountersAttempted] = useState(false);

  useEffect(() => {
    if (!show) {
      setClosingCounters({});
      setOpeningCountersLocal({});
      setCountersAttempted(false);
      setCountersLoading(false);
      setStep(1);
      return;
    }
    setStep(1);
    setCountersLoading(true);
    setCountersAttempted(false);

    // Seed from props if already available
    const seed: Record<number, { volume: number; amount: number }> = {};
    (shiftDetails.openingCounters || []).forEach(row => {
      seed[row.pump_id] = { volume: row.volume, amount: row.amount };
    });
    setOpeningCountersLocal(seed);

    const fetchAll = async () => {
      let openingMap = { ...seed };
      // Sin snapshot de apertura no se puede calcular PTS turno = cierre − apertura.
      if (Object.keys(openingMap).length === 0 && shiftDetails.shiftId) {
        const cap = await api.captureShiftOpeningCounters(shiftDetails.shiftId).catch(() => null);
        const rows = (cap?.ok && Array.isArray((cap.data as any)?.opening_counters))
          ? (cap.data as any).opening_counters as Array<{ pump_id: number; volume: number; amount: number }>
          : [];
        rows.forEach(row => {
          openingMap[Number(row.pump_id)] = {
            volume: Number(row.volume || 0),
            amount: Number(row.amount || 0),
          };
        });
        setOpeningCountersLocal(openingMap);
      }

      const results: Record<number, { vol: number; amt: number; ok: boolean }> = {};
      await Promise.allSettled(
        dispensers.map(async d => {
          const res = await api.getPumpCounters(d.id);
          results[d.id] = {
            vol: res.ok && res.data ? res.data.total_volume : 0,
            amt: res.ok && res.data ? res.data.total_amount : 0,
            ok: !!(res.ok && res.data),
          };
        })
      );
      setClosingCounters(results);
      setCountersAttempted(true);
      setCountersLoading(false);
    };
    fetchAll();
  }, [show, dispensers, shiftDetails.shiftId, shiftDetails.openingCounters]);

  if (!show) return null;

  const unit = unitMeasure === "Galones" ? "Gal" : "L";
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const totalVolume = transactions.reduce((s, t) => s + t.volume, 0);
  const cashAmount = transactions.filter(t => t.paymentType === "Cash").reduce((s, t) => s + t.amount, 0);
  const cardAmount = transactions.filter(t => t.paymentType !== "Cash").reduce((s, t) => s + t.amount, 0);

  const pendingCount = dispensers.reduce(
    (s, d) => s + d.nozzles.reduce((ns, n) => ns + (n.pendingTransactions?.length || 0), 0),
    0,
  );
  const unpaidOpen = dispensers.some(d =>
    d.nozzles.some(n => n.status === 'Unpaid' || n.status === 'EndOfTransaction'),
  );
  const countersFailed = countersAttempted && dispensers.some(d => {
    const c = closingCounters[d.id];
    return !c || !c.ok;
  });
  const missingOpening = countersAttempted && dispensers.some(d => openingCountersLocal[d.id] == null);
  const canConfirm =
    pendingCount === 0 &&
    !unpaidOpen &&
    !countersLoading &&
    countersAttempted &&
    !countersFailed &&
    !missingOpening;

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

  // Counter per dispenser: Sistema (POS) vs PTS turno (cierre − apertura)
  // Nunca usar lifetime del surtidor como "PTS turno" si falta apertura.
  const counterRows = dispensers.map(d => {
    const systemVol = transactions.filter(t => t.pumpId === d.id).reduce((s, t) => s + t.volume, 0);
    const systemAmt = transactions.filter(t => t.pumpId === d.id).reduce((s, t) => s + t.amount, 0);
    const count = transactions.filter(t => t.pumpId === d.id).length;
    const closing = closingCounters[d.id];
    const opening = openingCountersLocal[d.id];
    const hasOpening = opening != null;
    const hasClosing = !!(closing && closing.ok);
    const ptsDelta = hasOpening && hasClosing
      ? closing!.vol - opening!.volume
      : null;
    const diff = ptsDelta != null ? ptsDelta - systemVol : null;
    return {
      id: d.id,
      name: d.name,
      vol: systemVol,
      amt: systemAmt,
      count,
      ptsDelta,
      diff,
      hasOpening,
      hasClosing,
      closingVol: closing?.vol ?? null,
      openingVol: opening?.volume ?? null,
    };
  });

  // Payload al confirmar: volumen/monto de CIERRE absolutos (backend calcula delta)
  const closingPayload: Record<number, { vol: number; amt: number }> = {};
  Object.entries(closingCounters).forEach(([id, v]) => {
    const cv = v as { vol: number; amt: number; ok: boolean };
    closingPayload[Number(id)] = { vol: cv.vol, amt: cv.amt };
  });

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
                  <p className="text-[10px] text-slate-400">{totalVolume.toFixed(3)} {unit} despachados</p>
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
                      <p className="text-[10px] text-slate-400">{f.vol.toFixed(3)} {unit}</p>
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
                          <td className="px-3 py-1.5 text-right font-mono text-slate-600">{r.vol.toFixed(3)}</td>
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
                <Gauge className="w-3.5 h-3.5" /> Contadores por Cara (turno)
              </p>
              {countersLoading && (
                <p className="text-[11px] text-slate-500 px-1">Leyendo totalizadores del PTS-2…</p>
              )}
              {countersFailed && !countersLoading && (
                <p className="text-[11px] font-bold text-rose-600 px-1">
                  Lectura PTS incompleta — no se puede cerrar hasta obtener contadores de todas las caras.
                </p>
              )}
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-neutral-200">
                      <th className="text-left px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cara</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Apertura</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cierre</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">PTS turno</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sist.</th>
                      <th className="text-right px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counterRows.map(r => {
                      const diff = r.diff;
                      return (
                        <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-semibold text-slate-700">{r.name}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-500 text-[11px]">
                            {r.openingVol != null ? r.openingVol.toFixed(3) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-500 text-[11px]">
                            {r.closingVol != null ? r.closingVol.toFixed(3) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-700 font-bold">
                            {r.ptsDelta != null ? r.ptsDelta.toFixed(3) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-600">{r.vol.toFixed(3)}</td>
                          <td className={`px-3 py-1.5 text-right font-bold ${
                            diff == null ? 'text-slate-400' :
                            diff === 0 ? 'text-emerald-600' : Math.abs(diff) < 0.05 ? 'text-emerald-600' :
                            diff > 0 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {diff == null ? '—' : `${diff >= 0 ? '+' : ''}${diff.toFixed(3)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 px-1">
                PTS turno = contador al cierre − contador al abrir (fin del turno anterior). Dif. = PTS turno − ventas del sistema ({unit}).
              </p>
              {missingOpening && !countersLoading && (
                <p className="text-[11px] font-bold text-rose-600 px-1">
                  Falta snapshot de apertura — no se puede calcular la venta del turno.
                </p>
              )}
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
              {!canConfirm && (
                <p className="mt-2 font-bold text-rose-700">
                  {pendingCount > 0
                    ? `Hay ${pendingCount} venta(s) pendiente(s) de cobro — cobrelas antes de cerrar.`
                    : unpaidOpen
                      ? 'Hay mangueras con cobro pendiente o fin de despacho — finalícelas antes de cerrar.'
                      : countersLoading
                        ? 'Espere a que terminen de leerse los contadores del PTS.'
                        : countersFailed
                          ? 'No se pudieron leer los contadores del PTS-2 en una o más caras. Verifique la conexión y reabra el cierre.'
                          : missingOpening
                            ? 'No hay contadores de apertura del turno — reabra el cierre para capturarlos.'
                          : 'No se puede confirmar el cierre todavía.'}
                </p>
              )}
              {countersFailed && !countersLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setCountersLoading(true);
                    setCountersAttempted(false);
                    const fetchAll = async () => {
                      const results: Record<number, { vol: number; amt: number; ok: boolean }> = {};
                      await Promise.allSettled(
                        dispensers.map(async d => {
                          const res = await api.getPumpCounters(d.id);
                          results[d.id] = {
                            vol: res.ok && res.data ? res.data.total_volume : 0,
                            amt: res.ok && res.data ? res.data.total_amount : 0,
                            ok: !!(res.ok && res.data),
                          };
                        })
                      );
                      setClosingCounters(results);
                      setCountersAttempted(true);
                      setCountersLoading(false);
                    };
                    fetchAll();
                  }}
                  className="mt-2 text-[11px] font-bold text-[#1b365d] underline cursor-pointer"
                >
                  Reintentar lectura de contadores
                </button>
              )}
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
              <button
                onClick={() => { if (!canConfirm) return; setStep(2); }}
                disabled={!canConfirm}
                className={`flex-1 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  canConfirm
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex-1 border border-neutral-300 text-slate-600 font-bold text-xs py-2.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer">
                ← Volver
              </button>
              <button
                onClick={() => { if (!canConfirm) return; setStep(1); onConfirm(closingPayload); }}
                disabled={!canConfirm}
                className={`flex-1 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  canConfirm
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Cerrar Turno Definitivamente
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
