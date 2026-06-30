import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import type { FuelType } from "../types";

interface AddCaraDialogProps {
  isOpen: boolean;
  onConfirm: (name: string, products: FuelType[]) => void;
  onCancel: () => void;
}

const ALL_PRODUCTS: { type: FuelType; name: string; color: string }[] = [
  { type: "Regular Unleaded", name: "Gasolina Regular (87 Oct)", color: "bg-blue-500" },
  { type: "Premium Unleaded", name: "Gasolina Premium (95 Oct)", color: "bg-amber-500" },
  { type: "Diesel", name: "Diesel Especial", color: "bg-emerald-500" },
  { type: "Kerosene", name: "Queroseno Doméstico", color: "bg-purple-500" },
];

export default function AddCaraDialog({
  isOpen,
  onConfirm,
  onCancel,
}: AddCaraDialogProps) {
  const [name, setName] = useState("");
  const [products, setProducts] = useState<FuelType[]>([
    "Regular Unleaded",
    "Premium Unleaded",
    "Diesel",
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
      id="add-cara-dialog-modal"
    >
      <div className="bg-[#191c1e] text-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-800">
        <div className="bg-[#1b365d] px-5 py-3.5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="w-4.5 h-4.5 text-emerald-400" />
            <h3 className="font-sans font-bold text-sm text-white">
              Instalar Nueva Cara/Dispensador
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-all text-lg cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1.5 font-sans">
              Nombre de la Cara / Dispensador
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cara 7"
              className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1.5 font-sans">
              Asignar Mangueras (de 1 a 4 combustibles)
            </label>
            <p className="text-[9px] text-slate-400 mb-2 leading-relaxed font-sans">
              Seleccione los combustibles disponibles que surtirá esta cara.
            </p>

            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5">
              {ALL_PRODUCTS.map((prod) => {
                const isChecked = products.includes(prod.type);
                return (
                  <label
                    key={prod.type}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer select-none transition-all ${
                      isChecked
                        ? "bg-slate-800/85 border-[#355e9e]/70 text-white font-semibold"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${prod.color}`}
                      />
                      <span className="text-xs font-sans">{prod.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          if (products.length > 1) {
                            setProducts((prev) =>
                              prev.filter((p) => p !== prod.type),
                            );
                          }
                        } else if (products.length < 4) {
                          setProducts((prev) => [...prev, prod.type]);
                        }
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 border-t border-slate-800 flex justify-between gap-3 text-xs font-sans">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 py-1.5 rounded text-center cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(name, products)}
            disabled={!name.trim() || products.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-1.5 rounded text-center cursor-pointer transition-all border border-emerald-700 shadow flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
