import React, { useCallback, useEffect, useState } from "react";
import { X, Gauge, RefreshCw, AlertTriangle } from "lucide-react";
import type { DispenserState } from "../types";
import { api } from "../api";

interface PumpCountersModalProps {
  show: boolean;
  dispensers: DispenserState[];
  unitMeasure: string;
  currencySymbol: string;
  onClose: () => void;
}

interface CounterResult {
  totalVolume: number;
  totalAmount: number;
  nozzles: Array<{ nozzle: number; volume: number; amount: number }>;
  errors: string[] | null;
  loading: boolean;
}

const FUEL_LABELS: Record<string, string> = {
  "Regular Unleaded": "Regular",
  "Premium Unleaded": "Premium",
  "Diesel": "Diesel",
  "Kerosene": "Queroseno",
  "LPG": "LPG",
};

export default function PumpCountersModal({
  show,
  dispensers,
  unitMeasure,
  currencySymbol,
  onClose,
}: PumpCountersModalProps) {
  const [results, setResults] = useState<Record<number, CounterResult>>({});
  const [loading, setLoading] = useState(false);

  const unit = unitMeasure === "Galones" ? "Gal" : "L";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setResults(prev => {
      const next: Record<number, CounterResult> = { ...prev };
      dispensers.forEach(d => {
        next[d.id] = { ...(next[d.id] ?? { totalVolume: 0, totalAmount: 0, nozzles: [], errors: null }), loading: true };
      });
      return next;
    });

    await Promise.allSettled(
      dispensers.map(async d => {
        const res = await api.getPumpCounters(d.id);
        setResults(prev => ({
          ...prev,
          [d.id]: {
            totalVolume: res.ok && res.data ? res.data.total_volume : 0,
            totalAmount: res.ok && res.data ? res.data.total_amount : 0,
            nozzles: res.ok && res.data?.nozzles ? res.data.nozzles : [],
            errors: res.ok ? (res.data?.errors ?? null) : [res.error || "No se pudo leer el controlador PTS-2."],
            loading: false,
          },
        }));
      })
    );
    setLoading(false);
  }, [dispensers]);

  useEffect(() => {
    if (!show) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-neutral-200">

        <div className="bg-[#1b365d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-[#93b9ff]" />
            <h3 className="text-white font-bold text-base font-sans">Contadores del Surtidor</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchAll}
              disabled={loading}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-[11px] text-slate-500">
            Totalizadores electrónicos leídos en vivo del controlador PTS-2 (PumpGetTotals) por manguera — no requiere iniciar un cierre de turno.
          </p>

          {dispensers.map(d => {
            const r = results[d.id];
            return (
              <div key={d.id} className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-neutral-200 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{d.name}</span>
                  {!r || r.loading ? (
                    <span className="text-[10px] text-slate-400">Cargando...</span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {r.totalVolume.toFixed(3)} {unit} · {currencySymbol}{r.totalAmount.toFixed(2)}
                    </span>
                  )}
                </div>

                {r?.errors && r.errors.length > 0 && (
                  <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-[10px] text-amber-700 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{r.errors.join(" · ")}</span>
                  </div>
                )}

                {r && r.nozzles.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white border-b border-neutral-100">
                        <th className="text-left px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Manguera</th>
                        <th className="text-right px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{unit}</th>
                        <th className="text-right px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.nozzles.map(n => {
                        const fuel = d.nozzles[n.nozzle - 1]?.fuelType;
                        return (
                          <tr key={n.nozzle} className="border-b border-neutral-50 last:border-0">
                            <td className="px-3 py-1.5 text-slate-600">
                              Boq. {n.nozzle}{fuel ? ` — ${FUEL_LABELS[fuel] ?? fuel}` : ""}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-600">{n.volume.toFixed(3)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-700">{currencySymbol}{n.amount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="w-full border border-neutral-300 text-slate-600 font-bold text-xs py-2.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
