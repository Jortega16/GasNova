import React, { useState, useEffect, useRef } from "react";
import { Delete } from "lucide-react";
import type { UserProfile } from "../types";
import { api } from "../api";

interface QuickSwitchModalProps {
  pendingSwitchUser: UserProfile | null;
  onClose: () => void;
  onSwitchSuccess: (user: UserProfile) => void;
}

export default function QuickSwitchModal({
  pendingSwitchUser,
  onClose,
  onSwitchSuccess,
}: QuickSwitchModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingSwitchUser) {
      setPin("");
      setError("");
    }
  }, [pendingSwitchUser]);

  useEffect(() => {
    if (pin.length === 4) {
      const t = setTimeout(() => handleSubmit(), 150);
      return () => clearTimeout(t);
    }
  }, [pin]);

  const handleSubmit = async () => {
    if (!pendingSwitchUser) return;

    const res = await api.verifyUserPin(pendingSwitchUser.username, pin);
    if (res.ok && res.data) {
      onSwitchSuccess(pendingSwitchUser);
    } else if (!res.ok && (!res.error || !res.error.startsWith("API error"))) {
      if (pendingSwitchUser.pin === pin) {
        onSwitchSuccess(pendingSwitchUser);
      } else {
        setError("Código PIN inválido. Intente de nuevo.");
        setPin("");
      }
    } else {
      setError("Código PIN inválido. Intente de nuevo.");
      setPin("");
    }
  };

  if (!pendingSwitchUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn"
      id="quick-switch-pin-modal"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-300 space-y-4">
        <div className="text-center">
          <span className="text-4xl bg-slate-100 p-2 rounded-full inline-block mb-2">
            {pendingSwitchUser.avatar}
          </span>
          <h3 className="font-sans font-extrabold text-base text-slate-800">
            Clave de Seguridad Relevo
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingrese el PIN de {pendingSwitchUser.name} para relevar la sesión.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 py-1">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                pin.length > idx
                  ? "bg-[#1b365d] border-[#1b365d] scale-110"
                  : "bg-white border-neutral-300"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-[11px] text-red-600 font-sans font-bold text-center leading-none animate-pulse">
            {error}
          </p>
        )}

        <div
          className="grid grid-cols-3 gap-2 max-w-[210px] mx-auto"
          id="quick-switch-pad"
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => {
                setError("");
                if (pin.length < 4) setPin((prev) => prev + num);
              }}
              className="h-10 text-base font-mono font-black border border-neutral-200 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => {
              setError("");
              setPin("");
            }}
            className="text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer flex items-center justify-center border border-red-100"
          >
            BORRAR
          </button>
          <button
            onClick={() => {
              setError("");
              if (pin.length < 4) setPin((prev) => prev + "0");
            }}
            className="h-10 text-base font-mono font-black border border-neutral-200 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={() => setPin((prev) => prev.slice(0, -1))}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl cursor-pointer flex items-center justify-center"
          >
            <Delete className="w-4 h-4 text-[#355e9e]" />
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-neutral-300 text-slate-700 font-sans font-bold text-xs py-2 px-3 rounded-xl cursor-pointer transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#1b365d] hover:bg-[#132a4e] text-white font-sans font-bold text-xs py-2 px-3 rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Verificar PIN
          </button>
        </div>

        <p className="text-[10px] text-center font-mono text-slate-400">
          Demo: Clave para {pendingSwitchUser.name} es{" "}
          <strong className="text-[#355e9e]">{pendingSwitchUser.pin}</strong>
        </p>
      </div>
    </div>
  );
}
