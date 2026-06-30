import React from "react";
import { FileText } from "lucide-react";
import type { Transaction, ShiftDetails } from "../types";

interface ShiftReceiptModalProps {
  show: boolean;
  shiftDetails: ShiftDetails;
  transactions: Transaction[];
  unitMeasure: string;
  currencySymbol: string;
  pendingMeters: Record<string, string> | null;
  onClose: () => void;
}

export default function ShiftReceiptModal({
  show,
  shiftDetails,
  transactions,
  unitMeasure,
  currencySymbol,
  pendingMeters,
  onClose,
}: ShiftReceiptModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fadeIn"
      id="app-receipt-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-300">
        <div className="bg-[#1b365d] px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#93b9ff]" />
            <h3 className="font-sans font-bold text-base">
              Cierre de Turno Exitoso
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-200 font-sans text-xl"
          >
            ×
          </button>
        </div>

        <div
          className="p-6 space-y-4 font-mono text-xs text-slate-800 bg-[#fbfbfb] max-h-[450px] overflow-y-auto"
          id="physical-receipt-slip"
        >
          <div className="text-center pb-3 border-b border-dashed border-neutral-300">
            <p className="font-bold text-lg font-sans text-[#1b365d]">
              GasNova Consolidated POS
            </p>
            <p className="text-[10px] text-slate-400">
              Estación Central de Servicio #109
            </p>
            <p className="text-[10px] text-slate-400">
              Corte Emitido: {new Date().toLocaleString()}
            </p>
          </div>

          <div className="space-y-1 py-1 border-b border-dashed border-neutral-300 font-sans">
            <p className="flex justify-between">
              <span>Shift ID:</span>
              <span className="font-mono font-bold text-slate-900">
                {shiftDetails.shiftId}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Operador Saliente:</span>
              <span className="font-bold text-slate-900">
                {shiftDetails.operatorName}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Inicio de Turno:</span>
              <span className="font-mono text-slate-700">
                {shiftDetails.startTime}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Fin de Turno:</span>
              <span className="font-mono text-slate-700">
                {shiftDetails.endTime}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Estado:</span>
              <span className="font-bold text-red-605 uppercase font-mono bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px]">
                CERRADO Y BLOQUEADO
              </span>
            </p>
          </div>

          <div className="space-y-1.5 py-1.5 border-b border-dashed border-neutral-300">
            <p className="font-bold text-slate-900 pb-1">VENTAS POR GRADO:</p>
            <p className="flex justify-between">
              <span>Gasolina Regular:</span>
              <span>
                {transactions
                  .filter((t) => t.fuelType === "Regular Unleaded")
                  .reduce((sum, t) => sum + t.volume, 0)
                  .toFixed(2)}{" "}
                {unitMeasure === "Galones" ? "Gal" : "L"} (
                {currencySymbol}
                {transactions
                  .filter((t) => t.fuelType === "Regular Unleaded")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
                )
              </span>
            </p>
            <p className="flex justify-between">
              <span>Gasolina Premium:</span>
              <span>
                {transactions
                  .filter((t) => t.fuelType === "Premium Unleaded")
                  .reduce((sum, t) => sum + t.volume, 0)
                  .toFixed(2)}{" "}
                {unitMeasure === "Galones" ? "Gal" : "L"} (
                {currencySymbol}
                {transactions
                  .filter((t) => t.fuelType === "Premium Unleaded")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
                )
              </span>
            </p>
            <p className="flex justify-between">
              <span>Diesel Especial:</span>
              <span>
                {transactions
                  .filter((t) => t.fuelType === "Diesel")
                  .reduce((sum, t) => sum + t.volume, 0)
                  .toFixed(2)}{" "}
                {unitMeasure === "Galones" ? "Gal" : "L"} (
                {currencySymbol}
                {transactions
                  .filter((t) => t.fuelType === "Diesel")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
                )
              </span>
            </p>
          </div>

          <div className="space-y-1.5 py-1.5 border-b border-dashed border-neutral-300">
            <p className="font-bold text-slate-900 pb-1">
              MÉTODOS DE PAGO:
            </p>
            <p className="flex justify-between">
              <span>Pago Tarjetas:</span>
              <span>
                {currencySymbol}
                {transactions
                  .filter((t) => t.paymentType !== "Cash")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Pago Efectivo:</span>
              <span>
                {currencySymbol}
                {transactions
                  .filter((t) => t.paymentType === "Cash")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </span>
            </p>
            <p className="text-sm font-bold text-slate-900 pt-1.5 border-t border-neutral-200 flex justify-between font-sans">
              <span>TOTAL RECAUDADO:</span>
              <span className="font-mono text-base font-extrabold text-[#1b365d]">
                {currencySymbol}
                {transactions
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </span>
            </p>
          </div>

          <div className="space-y-1 py-1 text-[10px]">
            <p className="font-bold text-slate-900 pb-1 uppercase font-sans">
              Lectura de Odómetros (Audit Físico):
            </p>
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const name = `Pump ${n}`;
              const sys =
                n === 1
                  ? 45.67
                  : n === 2
                    ? 12.34
                    : n === 3
                      ? 10.50
                      : 0.0;
              const man = pendingMeters
                ? parseFloat(pendingMeters[name] || "0") || 0
                : 0;
              const diff = man - sys;
              return (
                <div
                  key={n}
                  className="flex justify-between text-[#191c1e] py-0.5 animate-fadeIn"
                >
                  <span>
                    Bomba {n} (Sist: {sys.toFixed(2)})
                  </span>
                  <span className="font-bold">
                    Man: {man.toFixed(2)} (Dif:{" "}
                    <span
                      className={diff === 0 ? "text-green-600" : "text-red-705"}
                    >
                      {diff >= 0 ? "+" : ""}
                      {diff.toFixed(2)}
                    </span>
                    )
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4 border-t border-dashed border-neutral-300 text-[10px] text-slate-400 leading-normal font-sans">
            <p className="font-bold text-slate-600">
              *** FIN DEL REPORTE FINAL DE TURNO ***
            </p>
            <p className="mt-3">
              Firma Operador Saliente: ______________________
            </p>
            <p className="mt-2">
              Firma Supervisor POS: ______________________
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-neutral-200 font-sans">
          <button
            onClick={onClose}
            className="w-full bg-[#1b365d] hover:bg-[#132a4e] text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
