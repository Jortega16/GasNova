import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Settings, ChevronRight, ChevronLeft, Check, X, Loader2 } from "lucide-react";
import { api } from "../api";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface FuelGradeOption {
  id: number;
  name: string;
  price: number;
  color: string;
}

interface NozzleEntry {
  fuelGradeId: number;
  fuelGradeName: string;
  price: number;
}

interface WizardState {
  // Paso 1 — Combustibles
  fuelGrades: FuelGradeOption[];
  // Paso 2 — Hardware RS-485
  pumpId: number;
  pumpName: string;
  port: number;
  protocol: number;
  baudRate: number;
  address: number;
  // Paso 3 — Mangueras
  nozzles: NozzleEntry[];
}

interface Props {
  isOpen: boolean;
  nextPumpId: number;
  onSuccess: (pump: { id: number; name: string; nozzlesCount: number }) => void;
  onCancel: () => void;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const DEFAULT_FUEL_GRADES: FuelGradeOption[] = [
  { id: 1, name: "Regular Unleaded", price: 4.19, color: "bg-blue-500" },
  { id: 2, name: "Premium Unleaded", price: 4.69, color: "bg-amber-500" },
  { id: 3, name: "Diesel", price: 4.49, color: "bg-emerald-500" },
  { id: 4, name: "Kerosene", price: 3.89, color: "bg-purple-500" },
];

const PROTOCOL_OPTIONS = [
  { value: 1, label: "1 — Gilbarco / Veeder-Root" },
  { value: 2, label: "2 — Tokheim" },
  { value: 3, label: "3 — Wayne" },
  { value: 4, label: "4 — Bennett" },
  { value: 5, label: "5 — Graco / Dresser" },
];

const BAUD_RATE_OPTIONS = [
  { value: 1, label: "1 — 1200 bps" },
  { value: 2, label: "2 — 2400 bps" },
  { value: 3, label: "3 — 4800 bps" },
  { value: 4, label: "4 — 9600 bps" },
  { value: 5, label: "5 — 19200 bps" },
];

const STEP_LABELS = [
  "Combustibles",
  "Hardware RS-485",
  "Mangueras",
  "Confirmar",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function StepDot({ index, current }: { index: number; current: number }) {
  const done = index < current;
  const active = index === current;
  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
          ${done ? "bg-emerald-600 text-white" : active ? "bg-[#1b5fbf] text-white ring-2 ring-[#93b9ff]/40" : "bg-slate-700 text-slate-400"}`}
      >
        {done ? <Check className="w-3 h-3" /> : index + 1}
      </div>
      <span className={`text-[10px] font-sans ${active ? "text-white" : done ? "text-emerald-400" : "text-slate-500"}`}>
        {STEP_LABELS[index]}
      </span>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PumpConfigWizard({ isOpen, nextPumpId, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>(() => ({
    fuelGrades: DEFAULT_FUEL_GRADES.map((fg) => ({ ...fg })),
    pumpId: nextPumpId,
    pumpName: `Cara ${nextPumpId}`,
    port: 1,
    protocol: 1,
    baudRate: 4,
    address: nextPumpId,
    nozzles: [
      { fuelGradeId: 1, fuelGradeName: "Regular Unleaded", price: 4.19 },
      { fuelGradeId: 2, fuelGradeName: "Premium Unleaded", price: 4.69 },
      { fuelGradeId: 3, fuelGradeName: "Diesel", price: 4.49 },
    ],
  }));

  if (!isOpen) return null;

  const portalTarget = document.getElementById("portal-root") ?? document.body;

  const update = (patch: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const updateFuelGrade = (index: number, patch: Partial<FuelGradeOption>) =>
    setState((prev) => {
      const fuelGrades = [...prev.fuelGrades];
      fuelGrades[index] = { ...fuelGrades[index], ...patch };
      return { ...prev, fuelGrades };
    });

  const updateNozzle = (index: number, fuelGradeId: number) => {
    const fg = state.fuelGrades.find((f) => f.id === fuelGradeId);
    if (!fg) return;
    setState((prev) => {
      const nozzles = [...prev.nozzles];
      nozzles[index] = { fuelGradeId: fg.id, fuelGradeName: fg.name, price: fg.price };
      return { ...prev, nozzles };
    });
  };

  const addNozzle = () => {
    if (state.nozzles.length >= 6) return;
    const fg = state.fuelGrades[0];
    setState((prev) => ({
      ...prev,
      nozzles: [...prev.nozzles, { fuelGradeId: fg.id, fuelGradeName: fg.name, price: fg.price }],
    }));
  };

  const removeNozzle = (index: number) => {
    if (state.nozzles.length <= 1) return;
    setState((prev) => ({ ...prev, nozzles: prev.nozzles.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Llama los 3 endpoints de configuración del PTS-2
      const res = await api.setupPumpConfiguration({
        pump: {
          id: state.pumpId,
          port: state.port,
          address: state.address,
          protocol: state.protocol,
          baudRate: state.baudRate,
        },
        nozzles: state.nozzles,
        fuelGrades: state.fuelGrades,
      });

      if (!res.ok) {
        // Si el PTS-2 no responde, guardamos solo en BD local
        console.warn("[PumpConfigWizard] PTS-2 no disponible, guardando solo en BD local:", res.error);
      }

      // Siempre guarda en BD local para que el dashboard lo muestre
      await api.saveLocalPumpConfig({
        pumpId: state.pumpId,
        name: state.pumpName,
        nozzlesCount: state.nozzles.length,
      });

      onSuccess({ id: state.pumpId, name: state.pumpName, nozzlesCount: state.nozzles.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al configurar");
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return state.fuelGrades.every((fg) => fg.name.trim() && fg.price > 0);
    if (step === 1) return state.pumpName.trim() && state.address >= 1;
    if (step === 2) return state.nozzles.length > 0;
    return true;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-[#191c1e] text-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-[#1b365d] px-5 py-3.5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-sans">Configurar Nueva Cara / Dispensador</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-all text-lg cursor-pointer">×</button>
        </div>

        {/* Step indicator */}
        <div className="bg-slate-900/60 px-5 py-3 flex items-center gap-4 border-b border-slate-800 flex-wrap">
          {STEP_LABELS.map((_, i) => (
            <React.Fragment key={i}>
              <StepDot index={i} current={step} />
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-px flex-1 min-w-[12px] ${i < step ? "bg-emerald-600" : "bg-slate-700"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ── Paso 0: Combustibles ── */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Define los grados de combustible y precios que se registrarán en el PTS-2.
                Estos son globales para toda la estación.
              </p>
              {state.fuelGrades.map((fg, i) => (
                <div key={fg.id} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${fg.color}`} />
                  <input
                    type="text"
                    value={fg.name}
                    onChange={(e) => updateFuelGrade(i, { name: e.target.value })}
                    placeholder="Nombre del combustible"
                    className="flex-1 bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  />
                  <span className="text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    value={fg.price}
                    min={0.01}
                    step={0.01}
                    onChange={(e) => updateFuelGrade(i, { price: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Paso 1: Hardware RS-485 ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Parámetros de conexión física entre el PTS-2 y el dispensador en el bus RS-485.
                Consulta el manual del fabricante de la bomba.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1 font-sans">Nombre de la Cara</label>
                  <input
                    type="text"
                    value={state.pumpName}
                    onChange={(e) => update({ pumpName: e.target.value })}
                    className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1 font-sans">ID Bomba (1–100)</label>
                  <input
                    type="number"
                    value={state.pumpId}
                    min={1} max={100}
                    onChange={(e) => update({ pumpId: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1 font-sans">Puerto RS-485</label>
                  <select
                    value={state.port}
                    onChange={(e) => update({ port: parseInt(e.target.value) })}
                    className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  >
                    {[1, 2, 3, 4].map((p) => (
                      <option key={p} value={p}>Puerto {p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1 font-sans">Dirección (1–99)</label>
                  <input
                    type="number"
                    value={state.address}
                    min={1} max={99}
                    onChange={(e) => update({ address: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1 font-sans">Protocolo</label>
                  <select
                    value={state.protocol}
                    onChange={(e) => update({ protocol: parseInt(e.target.value) })}
                    className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  >
                    {PROTOCOL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1 font-sans">Velocidad (Baud Rate)</label>
                <select
                  value={state.baudRate}
                  onChange={(e) => update({ baudRate: parseInt(e.target.value) })}
                  className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                >
                  {BAUD_RATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Paso 2: Mangueras ── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Asigna un combustible a cada manguera. El orden define el índice en el PTS-2:
                manguera 1 = índice 0, manguera 2 = índice 1, etc.
              </p>
              {state.nozzles.map((nozzle, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-20 flex-shrink-0 font-sans">Manguera {i + 1}</span>
                  <select
                    value={nozzle.fuelGradeId}
                    onChange={(e) => updateNozzle(i, parseInt(e.target.value))}
                    className="flex-1 bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                  >
                    {state.fuelGrades.map((fg) => (
                      <option key={fg.id} value={fg.id}>{fg.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeNozzle(i)}
                    disabled={state.nozzles.length <= 1}
                    className="text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {state.nozzles.length < 6 && (
                <button
                  onClick={addNozzle}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-sans transition-colors cursor-pointer"
                >
                  + Agregar manguera
                </button>
              )}
            </div>
          )}

          {/* ── Paso 3: Confirmación ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 rounded-lg p-4 space-y-3 text-xs font-sans">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Cara / Dispensador</span>
                  <span className="text-white font-semibold">{state.pumpName} (ID {state.pumpId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Puerto RS-485</span>
                  <span className="text-white">Puerto {state.port} — Addr {state.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocolo / Baud</span>
                  <span className="text-white">
                    {PROTOCOL_OPTIONS.find((o) => o.value === state.protocol)?.label.split("—")[0]} /
                    {BAUD_RATE_OPTIONS.find((o) => o.value === state.baudRate)?.label.split("—")[1]}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-2">
                  <span className="text-slate-400 block mb-1">Mangueras ({state.nozzles.length})</span>
                  {state.nozzles.map((n, i) => (
                    <div key={i} className="flex justify-between pl-2">
                      <span className="text-slate-300">Manguera {i + 1} — {n.fuelGradeName}</span>
                      <span className="text-emerald-400">${n.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-xs text-red-400 bg-red-900/20 rounded p-2 border border-red-800 font-sans">{error}</p>
              )}
              <p className="text-[10px] text-slate-500 font-sans">
                Se enviará la configuración al PTS-2 y se guardará en la BD local.
                Si el controlador no está disponible, solo se guardará localmente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900/60 px-5 py-3.5 border-t border-slate-800 flex justify-between gap-3">
          <button
            onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 px-4 rounded cursor-pointer transition-colors font-sans"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {step === 0 ? "Cancelar" : "Atrás"}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1 text-xs bg-[#1b5fbf] hover:bg-[#1a52a8] disabled:opacity-40 text-white font-bold py-1.5 px-4 rounded cursor-pointer transition-all font-sans"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-1.5 px-4 rounded cursor-pointer transition-all font-sans border border-emerald-700"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {loading ? "Configurando..." : "Instalar"}
            </button>
          )}
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
