import React, { useState, useEffect } from "react";
import { Fuel, Check, Info } from "lucide-react";
import type { FuelType, DispenserState, PriceConfig } from "../types";

interface PreAuthDialogProps {
  preauthorizingPumpId: number | null;
  dispensers: DispenserState[];
  prices: PriceConfig[];
  unitMeasure: string;
  currencySymbol: string;
  onConfirm: (params: {
    pumpId: number;
    fuelType: FuelType;
    mode: "Limit" | "Full";
    limitType: "Amount" | "Volume";
    amount: number;
  }) => void;
  onCancel: () => void;
}

export default function PreAuthDialog({
  preauthorizingPumpId,
  dispensers,
  prices,
  unitMeasure,
  currencySymbol,
  onConfirm,
  onCancel,
}: PreAuthDialogProps) {
  const [fuelGrade, setFuelGrade] = useState<FuelType>("Regular Unleaded");
  const [mode, setMode] = useState<"Limit" | "Full">("Limit");
  const [limitType, setLimitType] = useState<"Amount" | "Volume">("Amount");
  const [amount, setAmount] = useState("20.00");

  // El diálogo nunca se desmonta (solo renderiza null cuando está cerrado),
  // así que sin esto el monto de la última pre-autorización quedaba pegado
  // la próxima vez que se abre, incluso para otra cara/bomba.
  useEffect(() => {
    if (preauthorizingPumpId !== null) {
      setMode("Limit");
      setLimitType("Amount");
      setAmount("20.00");
    }
  }, [preauthorizingPumpId]);

  if (preauthorizingPumpId === null) return null;

  const currentDispenser = dispensers.find(
    (d) => d.id === preauthorizingPumpId,
  );
  const allowedFuelTypes = currentDispenser
    ? currentDispenser.nozzles.map((n) => n.fuelType)
    : [];

  const valLimit = parseFloat(amount);

  const handleConfirm = () => {
    if (mode === "Limit" && (!valLimit || isNaN(valLimit) || valLimit <= 0)) {
      alert("Por favor ingrese un monto o volumen válido para pre-autorizar.");
      return;
    }
    onConfirm({
      pumpId: preauthorizingPumpId,
      fuelType: fuelGrade,
      mode,
      limitType,
      amount: valLimit || 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
      id="preauth-dialog-modal"
    >
      <div className="bg-[#191c1e] text-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800">
        <div className="bg-[#1b365d] px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-[#93b9ff]" />
            <h3 className="font-sans font-bold text-base text-white">
              Pre-autorizar Bomba {preauthorizingPumpId}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-all text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#87a0cd] uppercase tracking-wider mb-2 font-sans">
              Seleccionar Octanaje / Grado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {prices
                .filter((p) => allowedFuelTypes.includes(p.fuelType))
                .map((p) => (
                  <button
                    key={p.fuelType}
                    type="button"
                    onClick={() => setFuelGrade(p.fuelType)}
                    className={`py-2 px-1 text-center font-bold font-sans text-xs rounded border transition-all cursor-pointer ${
                      fuelGrade === p.fuelType
                        ? "bg-[#355e9e] border-[#93b9ff] text-white"
                        : "bg-[#133562]/30 border-[#133562] text-[#87a0cd] hover:border-[#355e9e]"
                    }`}
                  >
                    <p className="truncate text-[11px] leading-tight">
                      {p.fuelType.split(" ")[0]}
                    </p>
                    <span className="font-mono text-[10px] text-slate-300 block font-normal">
                      {currencySymbol}
                      {p.price.toFixed(2)}/{unitMeasure === "Galones" ? "G" : "L"}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#87a0cd] uppercase tracking-wider mb-2 font-sans">
              Modalidad de Despacho
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("Limit")}
                className={`py-2 text-center text-xs font-bold rounded border cursor-pointer transition-all ${
                  mode === "Limit"
                    ? "bg-[#355e9e] border-[#93b9ff] text-white shadow-lg shadow-[#355e9e]/30"
                    : "bg-slate-800/40 border-slate-700 text-[#87a0cd] hover:bg-slate-800/60"
                }`}
              >
                Prepago
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("Full");
                  setAmount("999");
                }}
                className={`py-2 text-center text-xs font-bold rounded border cursor-pointer transition-all ${
                  mode === "Full"
                    ? "bg-[#355e9e] border-[#93b9ff] text-white shadow-lg shadow-[#355e9e]/30"
                    : "bg-slate-800/40 border-slate-700 text-[#87a0cd] hover:bg-slate-800/60"
                }`}
              >
                Tanque Lleno
              </button>
            </div>
          </div>

          {mode === "Limit" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#87a0cd] uppercase tracking-wider mb-1.5 font-sans">
                  Tipo de Límite
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLimitType("Amount");
                      setAmount("20.00");
                    }}
                    className={`py-1.5 text-center text-[10px] font-bold rounded border cursor-pointer transition-all ${
                      limitType === "Amount"
                        ? "bg-[#355e9e] border-[#93b9ff] text-white"
                        : "bg-slate-800/40 border-slate-700 text-[#87a0cd]"
                    }`}
                  >
                    Por Monto ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLimitType("Volume");
                      setAmount("5.00");
                    }}
                    className={`py-1.5 text-center text-[10px] font-bold rounded border cursor-pointer transition-all ${
                      limitType === "Volume"
                        ? "bg-[#355e9e] border-[#93b9ff] text-white"
                        : "bg-slate-800/40 border-slate-700 text-[#87a0cd]"
                    }`}
                  >
                    Por Volumen (
                    {unitMeasure === "Galones" ? "GAL" : "L"})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#87a0cd] uppercase tracking-wider mb-2 font-sans">
                  {limitType === "Amount"
                    ? "Importe Precargado ($)"
                    : `Volumen Precargado (${unitMeasure === "Galones" ? "GAL" : "L"})`}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#87a0cd] font-mono text-sm">
                    {limitType === "Amount"
                      ? "$"
                      : unitMeasure === "Galones"
                        ? "G"
                        : "L"}
                  </span>
                  <input
                    type="number"
                    step={limitType === "Amount" ? "5" : "1"}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#1b365d]/50 border border-[#355e9e] rounded py-1.5 pl-7 pr-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#93b9ff]"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 mt-2">
                  {(limitType === "Amount"
                    ? ["10.00", "20.00", "45.00", "60.00"]
                    : ["2.00", "5.00", "10.00", "15.00"]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className="bg-[#2d3133] hover:bg-[#355e9e] font-mono text-xs rounded text-slate-300 hover:text-white py-1 cursor-pointer border border-[#44474e]/40 transition-colors"
                    >
                      {limitType === "Amount"
                        ? `$${preset}`
                        : `${preset} ${unitMeasure === "Galones" ? "G" : "L"}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === "Full" && (
            <div className="p-3 rounded-lg bg-[#355e9e]/15 border border-[#355e9e]/30 flex gap-2 items-start text-xs text-[#87a0cd]">
              <Info className="w-4 h-4 text-[#93b9ff] shrink-0 mt-0.5" />
              <p>
                <strong>Tanque Lleno (Postpago)</strong>. El combustible fluirá
                libremente hasta detenerse. Al terminar, la transacción quedará{" "}
                <strong>Pendiente de Pago</strong> para ser cobrada en caja.
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-900/60 p-4 border-t border-slate-800 flex justify-between gap-3 text-xs font-sans">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 py-2 rounded text-center cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-[#2E7D32] hover:bg-[#2E7D32]/80 text-white font-bold py-2 rounded text-center cursor-pointer transition-all border border-green-700 shadow flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar / Liberar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
