import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../api';
import { setAuthSession } from '../auth';
import { Users, AlertCircle, Check, Shield, Delete } from 'lucide-react';

interface LoginScreenProps {
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
}

const roleTranslations: { [key: string]: string } = {
  Admin: 'Administrador',
  Manager: 'Gerente',
  Supervisor: 'Supervisor',
  Operator: 'Operador'
};

export default function LoginScreen({ users, onLoginSuccess }: LoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const activeUsers = users.filter(u => u.status === 'Active');

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setPin('');
  };

  const handleManualPinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setErrorMsg('Por favor seleccione un usuario primero.');
      return;
    }

    api.verifyUserPin(selectedUser.username, pin).then(res => {
      if (res.ok && res.data) {
        // Guarda la sesión de la API (token Bearer) emitida por el backend
        const data = res.data as { token?: string; id?: string; name?: string; username?: string; role?: string; avatar?: string };
        if (data.token) {
          setAuthSession(data.token, {
            id: data.id || selectedUser.id,
            name: data.name || selectedUser.name,
            username: data.username || selectedUser.username,
            role: data.role || selectedUser.role,
            avatar: data.avatar || selectedUser.avatar,
          });
        }
        setSuccess(true);
        setErrorMsg('');
        setTimeout(() => {
          onLoginSuccess(selectedUser);
        }, 700);
      } else {
        // Fallback local check if connection failed (network error)
        if (!res.ok && (!res.error || !res.error.startsWith('API error'))) {
          if (selectedUser.pin === pin) {
            setSuccess(true);
            setErrorMsg('');
            setTimeout(() => {
              onLoginSuccess(selectedUser);
            }, 700);
          } else {
            setErrorMsg('Código PIN incorrecto. Intente de nuevo.');
            setPin('');
          }
        } else {
          // Reached API but PIN was incorrect
          setErrorMsg('Código PIN incorrecto. Intente de nuevo.');
          setPin('');
        }
      }
    });
  };

  // Submit automatically when PIN gets to 4 digits
  React.useEffect(() => {
    if (pin.length === 4 && selectedUser) {
      // Small timeout for visual indicator feedback
      const t = setTimeout(() => {
        handleManualPinSubmit();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [pin, selectedUser]);

  return (
    <div 
      className="min-h-screen w-full bg-[#001530] flex flex-col items-center justify-center p-4 relative select-none" 
      style={{
        backgroundImage: 'radial-gradient(circle at center, #002353 0%, #000c1e 100%)'
      }}
      id="login-screen-wrapper"
    >
      {/* Background retro lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(18,107,214,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,107,214,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Side Column: Brand Logo, instruction notes, quick stats */}
        <div className="md:col-span-5 flex flex-col justify-between text-white p-6 bg-[#002046]/40 border border-[#355e9e]/30 rounded-2xl backdrop-blur-md">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg border border-orange-400">
                <span className="font-sans font-black text-2xl tracking-tighter text-white">Δ</span>
              </div>
              <div>
                <p className="font-sans font-black text-xl tracking-tight leading-none bg-gradient-to-r from-orange-400 via-white to-red-400 bg-clip-text text-transparent">GASNOVA</p>
                <p className="text-[10px] text-[#87a0cd] font-mono tracking-wider uppercase mt-1">Control POS de Estación v5.2</p>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-xl font-sans font-extrabold tracking-tight text-white">Consola Central de Operación</h1>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Para autorizar abastecimiento, realizar arqueos de turno o cambiar precios, seleccione su cuenta e ingrese su PIN de acceso de 4 dígitos.
              </p>
            </div>

            <div className="p-3.5 bg-slate-100/5 rounded-xl border border-white/5 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-extrabold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                ACCESO PROTEGIDO
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Cada acción en el sistema queda registrada bajo el operador que inició sesión.
                Si olvidaste tu PIN, solicita a un administrador que lo restablezca desde
                Usuarios / Roles.
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono text-left pt-6 mt-6 border-t border-white/5">
            Estación de Ventas #109 | Terminal IP: 192.168.1.140<br />
            Estado de Enlace Segurizado: OK
          </div>
        </div>

        {/* Right Side Column: User switch / PIN keypad interface */}
        <div className="md:col-span-7 bg-white rounded-3xl shadow-3xl p-6 border border-neutral-300 flex flex-col justify-between" id="login-interactive-container">
          
          {/* STEP 1: Select Profile */}
          {!selectedUser ? (
            <div className="space-y-4 flex-1 flex flex-col justify-center min-h-[420px]" id="step-select-profile-view">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-mono tracking-widest text-[#355e9e] uppercase font-bold flex items-center justify-center md:justify-start gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Identificación de Empleado
                </p>
                <h2 className="text-lg font-sans font-extrabold text-slate-800 tracking-tight mt-1">Seleccione su cuenta para Ingresar</h2>
              </div>

              <div className="grid grid-cols-2 gap-3" id="selectable-users-grid">
                {activeUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setErrorMsg('');
                    }}
                    className="p-3.5 rounded-2xl border-2 border-neutral-200 hover:border-[#1b365d] bg-[#f8f9fb] hover:bg-slate-50 transition-all text-left flex items-center gap-3 cursor-pointer group hover:scale-102"
                  >
                    <span className="text-3xl bg-white shadow-sm p-1.5 rounded-full block">{user.avatar}</span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#1b365d] font-sans truncate">{user.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold leading-none mt-1">{roleTranslations[user.role] || user.role}</p>
                    </div>
                  </button>
                ))}
              </div>

            </div>
          ) : (
            
            /* STEP 2: Input PIN */
            <div className="space-y-4 flex-grow flex flex-col justify-between min-h-[420px]" id="step-enter-pin-view">
              
              {/* Profile sub-header */}
              <div className="flex items-center justify-between bg-slate-50 border border-neutral-200/60 p-3 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl bg-white shadow-sm rounded-full p-1.5 block">{selectedUser.avatar}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 font-sans leading-tight">{selectedUser.name}</p>
                    <p className="text-[10px] text-[#355e9e] font-mono uppercase font-black tracking-wider mt-0.5">{roleTranslations[selectedUser.role] || selectedUser.role}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setPin('');
                    setErrorMsg('');
                  }}
                  className="text-xs font-sans font-bold text-slate-500 hover:text-slate-800 border-b border-dashed border-slate-300 hover:border-slate-800 cursor-pointer"
                >
                  Cambiar Operador
                </button>
              </div>

              {/* PIN numeric indicators */}
              <div className="space-y-2 text-center">
                <span className="block text-[10px] uppercase font-mono tracking-widest text-[#355e9e] font-bold">DIGITE CÓDIGO PIN</span>
                
                <div className="flex items-center justify-center gap-4 py-2" id="pin-indicator-bullets">
                  {[0, 1, 2, 3].map((idx) => {
                    const active = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-150 border-2 ${
                          success 
                            ? 'bg-emerald-500 border-emerald-500 scale-120' 
                            : active 
                              ? 'bg-[#1b365d] border-[#1b365d] scale-110 shadow-md' 
                              : 'bg-white border-neutral-300'
                        }`}
                      />
                    );
                  })}
                </div>

                {errorMsg ? (
                  <p className="text-[11px] text-red-600 font-sans font-bold animate-pulse flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                ) : success ? (
                  <p className="text-[11px] text-emerald-600 font-sans font-bold flex items-center justify-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="animate-pulse">Acceso Concedido...</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-mono">Ingrese clave numérica de 4 dígitos</p>
                )}
              </div>

              {/* Interactive Keypad */}
              <div className="max-w-[280px] mx-auto w-full grid grid-cols-3 gap-2.5" id="touchscreen-pin-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeyPress(digit)}
                    disabled={success || pin.length >= 4}
                    className="h-12 text-lg font-mono font-black text-slate-800 bg-slate-50 active:bg-[#1b365d] active:text-white hover:border-slate-400 rounded-xl border border-neutral-200 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                  >
                    {digit}
                  </button>
                ))}
                
                {/* Clear symbol button */}
                <button
                  onClick={handleClear}
                  disabled={success || !pin}
                  className="h-12 text-xs font-sans font-extrabold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl border border-red-200 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                  title="Borrar Todo"
                >
                  BORRAR
                </button>

                {/* Zero button */}
                <button
                  onClick={() => handleKeyPress('0')}
                  disabled={success || pin.length >= 4}
                  className="h-12 text-lg font-mono font-black text-slate-800 bg-slate-50 active:bg-[#1b365d] active:text-white rounded-xl border border-neutral-200 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                >
                  0
                </button>

                {/* Backspace button */}
                <button
                  onClick={handleBackspace}
                  disabled={success || !pin}
                  className="h-12 text-[#355e9e] bg-blue-50 active:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                  title="Retroceder"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
