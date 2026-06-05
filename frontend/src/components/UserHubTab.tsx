import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Key, 
  Eye, 
  EyeOff, 
  Shield, 
  Check, 
  X, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface UserHubTabProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  onAddUser: (u: Omit<UserProfile, 'id'>) => void;
  onUpdateUser: (u: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

const roleTranslations: Record<UserRole, string> = {
  Admin: 'Administrador',
  Manager: 'Gerente',
  Supervisor: 'Supervisor',
  Operator: 'Operador'
};

export default function UserHubTab({ 
  currentUser, 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}: UserHubTabProps) {
  
  // Local states for management forms
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Show/Hide PIN states per user id
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Operator');
  const [avatar, setAvatar] = useState('👨‍🔧');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState('');

  // Edits local state copy
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Operator');
  const [editAvatar, setEditAvatar] = useState('👨‍🔧');
  const [editPin, setEditPin] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  // Static list of emojis for avatars
  const avatarPresets = ['👨‍🔧', '👩‍🔬', '👨‍💼', '👩‍💼', '🛡️', '⚡', '⛽', '🌟', '👤', '🔧'];

  // Check permissions: Only Admin or Manager can modify users
  const isAuthorized = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  const togglePinVisibility = (id: string) => {
    setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) return setFormError('El nombre completo es requerido.');
    if (!username.trim()) return setFormError('El nombre de usuario es requerido.');
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return setFormError('El nombre de usuario ya está registrado.');
    }
    if (!/^\d{4}$/.test(pin)) {
      return setFormError('El PIN de seguridad debe tener exactamente 4 números.');
    }

    onAddUser({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      role,
      avatar,
      pin,
      status
    });

    // Reset Form
    setName('');
    setUsername('');
    setRole('Operator');
    setAvatar('👨‍🔧');
    setPin('');
    setStatus('Active');
    setIsAdding(false);
  };

  const startEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
    setEditAvatar(user.avatar);
    setEditPin(user.pin);
    setEditStatus(user.status);
  };

  const handleEditSave = (user: UserProfile) => {
    if (!editName.trim()) return alert('El nombre completo es requerido.');
    if (!/^\d{4}$/.test(editPin)) return alert('El PIN de seguridad debe tener exactamente 4 números.');

    onUpdateUser({
      ...user,
      name: editName.trim(),
      role: editRole,
      avatar: editAvatar,
      pin: editPin,
      status: editStatus
    });

    setEditingUserId(null);
  };

  // Matrix roles definition
  const rolePermissionsMap = {
    Admin: {
      desc: 'Acceso total y absoluto al sistema central de control, base de datos y configuraciones.',
      caps: ['Control Total', 'Gestión de Precios', 'Abastecer Tanques', 'Cierre de Turno', 'Mantenimiento Usuarios', 'Configuración de Puertos']
    },
    Manager: {
      desc: 'Administrador de nivel de operaciones. Administra turnos, inventario general y equipos.',
      caps: ['Gestión de Precios', 'Abastecer Tanques', 'Cierre de Turno', 'Mantenimiento Usuarios (Solo Lectura/Edición)', 'Monitoreo Completo']
    },
    Supervisor: {
      desc: 'Encargado técnico del turno. Visualiza cierres, despacha emergencias e interactúa con tanques.',
      caps: ['Gestión de Precios', 'Abastecer Tanques', 'Registrar Alertas', 'Cierre del Turno (Parcial)', 'Monitoreo de Mangueras']
    },
    Operator: {
      desc: 'Personal de pista y tiendas. Encargado de levantar mangueras, ingresar cobranzas y cobrar despachos.',
      caps: ['Lanzar Bombas', 'Autorizar Prepago', 'Cobrar Transacciones', 'Imprimir Recibos', 'Ver Estado de Turno']
    }
  };

  return (
    <div className="space-y-6" id="user-hub-tab-panel">
      {/* Upper header */}
      <div className="bg-[#002046]/5 border border-[#1b365d]/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-xl text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1b365d]" />
            Control de Personal y Matriz de Roles
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Defina los operadores de pista en turno, asigne permisos de seguridad, configure códigos PIN de acceso rápido y audite credenciales de la estación.
          </p>
        </div>

        {isAuthorized && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md self-start md:self-auto cursor-pointer"
            id="btn-add-new-operator"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Operador</span>
          </button>
        )}
      </div>

      {/* Permission alert warning */}
      {!isAuthorized && (
        <div className="bg-amber-50 border-2 border-amber-300 text-slate-800 rounded-xl p-4 flex items-start gap-3 shadow-inner">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-sans">
            <p className="font-bold uppercase text-amber-900 leading-none">MODO SÓLO LECTURA HABILITADO</p>
            <p className="mt-1 text-slate-600">
              Usted está conectado como <strong>{currentUser?.name || 'Invitado'}</strong> ({currentUser?.role ? (roleTranslations[currentUser.role] || currentUser.role) : 'Ninguno'}). 
              La creación, edición y visualización de códigos PIN requiere perfil de **Administrador** o **Manager**.
            </p>
          </div>
        </div>
      )}

      {/* Body grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Users list and editor cards */}
        <div className="col-span-1 lg:col-span-8 space-y-4">
          
          {/* New User Form if triggered */}
          {isAdding && isAuthorized && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-500 p-6 space-y-4 animate-fadeIn" id="new-user-form-card">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-sans font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Registrar Operador Nuevo
                </h3>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-sans border border-red-200">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="Ej. Carlos Ruiz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-neutral-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre de Usuario (Log-In)</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="Ej. cruiz"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-neutral-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rol Operativo</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-neutral-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans cursor-pointer"
                  >
                    <option value="Operator">Operador (Pista/Cajas)</option>
                    <option value="Supervisor">Supervisor de Turno</option>
                    <option value="Manager">Gerente de Estación</option>
                    <option value="Admin">Administrador (Control Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">PIN Secreto (4 números)</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="Ej. 1111"
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPin(val);
                    }}
                    className="w-full bg-slate-50 border border-neutral-300 rounded p-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Este código servirá para cambiar a esta cuenta desde la cabecera rápida.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2 text-slate-600">Avatar / Emoticono Representativo</label>
                  <div className="flex flex-wrap gap-2">
                    {avatarPresets.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAvatar(preset)}
                        className={`text-lg p-1.5 rounded border-2 transition-all ${
                          avatar === preset 
                            ? 'border-emerald-600 bg-emerald-50 scale-110' 
                            : 'border-neutral-200 hover:border-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Estado de Cuenta</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        checked={status === 'Active'}
                        onChange={() => setStatus('Active')}
                        className="text-emerald-600"
                      />
                      <span>✓ Activo</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        checked={status === 'Inactive'}
                        onChange={() => setStatus('Inactive')}
                        className="text-red-600"
                      />
                      <span>🛑 Inactivo</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="border border-neutral-300 text-slate-700 font-sans font-bold text-xs py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-2 px-5 rounded-lg shadow cursor-pointer"
                  >
                    Guardar Operador
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Core Table listing all operators */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 overflow-hidden" id="users-directory-table-card">
            <div className="px-5 py-4 border-b border-neutral-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Listado Oficial de Usuarios y Contraseñas PIN
              </h3>
              <span className="text-xs font-mono font-bold bg-[#1b365d] text-white px-2.5 py-0.5 rounded-full">
                {users.length} Registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse" id="users-master-table">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-sans font-bold border-b border-neutral-200 text-slate-600 uppercase tracking-widest">
                    <th className="px-4 py-3 text-center w-12">Avatar</th>
                    <th className="px-4 py-3">Nombre Completo / Usuario</th>
                    <th className="px-4 py-3">Rol Asignado</th>
                    <th className="px-4 py-3 text-center">PIN Acceso</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {users.map((user) => {
                    const isEditing = editingUserId === user.id;
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isSelf ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {/* Avatar Column */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-1 w-16 mx-auto">
                              {avatarPresets.slice(0, 4).map(av => (
                                <button
                                  key={av}
                                  type="button"
                                  onClick={() => setEditAvatar(av)}
                                  className={`text-xs p-0.5 rounded ${
                                    editAvatar === av ? 'bg-indigo-100 border border-indigo-400' : 'bg-slate-100'
                                  }`}
                                >
                                  {av}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xl shadow-xs inline-block bg-slate-100 p-1.5 rounded-full">
                              {user.avatar || '👤'}
                            </span>
                          )}
                        </td>

                        {/* Name / User Column */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border border-neutral-300 rounded p-1 text-xs w-full font-sans"
                              />
                              <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-sans font-bold text-slate-800 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="bg-[#1b365d] text-white text-[9px] px-1.5 py-0.2 rounded font-sans uppercase">
                                    Yo
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">Usuario: @{user.username}</div>
                            </div>
                          )}
                        </td>

                        {/* Role Column */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as UserRole)}
                              className="border border-neutral-300 rounded p-1 text-xs w-full bg-white cursor-pointer"
                            >
                              <option value="Operator">Operador</option>
                              <option value="Supervisor">Supervisor</option>
                              <option value="Manager">Gerente</option>
                              <option value="Admin">Administrador</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold leading-none ${
                              user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'Supervisor' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {roleTranslations[user.role] || user.role}
                            </span>
                          )}
                        </td>

                        {/* PIN Column */}
                        <td className="px-4 py-3 text-center font-mono">
                          {isEditing ? (
                            <input 
                              type="text"
                              maxLength={4}
                              value={editPin}
                              onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                              className="border border-neutral-300 rounded p-1 text-xs w-16 text-center font-mono"
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-1 bg-slate-50 border border-neutral-200 rounded px-2 py-1 max-w-[90px] mx-auto">
                              <span className="text-xs font-extrabold text-slate-700 tracking-widest">
                                {isAuthorized 
                                  ? (visiblePins[user.id] ? user.pin : '••••') 
                                  : '••••'}
                              </span>
                              {isAuthorized && (
                                <button
                                  onClick={() => togglePinVisibility(user.id)}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                                >
                                  {visiblePins[user.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                              className="border border-neutral-300 rounded p-1 text-xs w-full bg-white cursor-pointer"
                            >
                              <option value="Active">✓ Activo</option>
                              <option value="Inactive">🛑 Inactivo</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              user.status === 'Active' ? 'text-emerald-700' : 'text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                              {user.status === 'Active' ? 'Habilitado' : 'Suspendido'}
                            </span>
                          )}
                        </td>

                        {/* Actions buttons */}
                        <td className="px-4 py-3 text-right">
                          {isAuthorized ? (
                            isEditing ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditSave(user)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-1 rounded cursor-pointer"
                                  title="Guardar Cambios"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="bg-neutral-200 hover:bg-neutral-300 text-slate-700 p-1 rounded cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => startEdit(user)}
                                  className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition-all cursor-pointer"
                                  title="Editar Usuario"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {!isSelf && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`¿De verdad desea eliminar al operador "${user.name}"?`)) {
                                        onDeleteUser(user.id);
                                      }
                                    }}
                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-all cursor-pointer"
                                    title="Remover Operador"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No permitido</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Matrix Roles summary details and help */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-5 space-y-4" id="matrix-roles-info-card">
            <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-1.5 border-b pb-2">
              <Shield className="w-4.5 h-4.5 text-[#1b365d]" />
              Esquema de Permisos por Rol
            </h3>

            <div className="space-y-4">
              {Object.entries(rolePermissionsMap).map(([roleKey, value]) => (
                <div key={roleKey} className="border-l-4 border-[#1b365d]/20 pl-3 py-1 space-y-1">
                  <span className={`inline-block font-mono text-[10px] font-bold uppercase rounded px-2 py-0.5 ${
                    roleKey === 'Admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                    roleKey === 'Manager' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    roleKey === 'Supervisor' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {roleTranslations[roleKey as UserRole] || roleKey}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{value.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {value.caps.map(cap => (
                      <span key={cap} className="text-[9px] bg-slate-100 text-slate-600 font-sans border border-slate-200 rounded px-1 px-1.5">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1b365d] text-white rounded-xl shadow-md p-5 space-y-3" id="quick-switch-howitworks-box">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#93b9ff]" />
              <h4 className="font-sans font-extrabold text-sm tracking-tight text-white">¿Cómo alternar de operador?</h4>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              No es necesario cerrar el navegador para relevar al operador de turno:
            </p>
            <ol className="text-xs text-slate-200 leading-relaxed list-decimal list-inside space-y-1.5 font-sans pl-1">
              <li>Diríjase a la esquina superior derecha.</li>
              <li>Haga clic en la tarjeta del usuario actual ("John Doe").</li>
              <li>Aparecerá el menú <strong>"Cambio Rápido de Usuario"</strong>.</li>
              <li>Seleccione cualqueira de la lista.</li>
              <li>Ingrese su <strong>PIN de 4 dígitos</strong> exclusivo registrado en esta pestaña.</li>
            </ol>
            <div className="bg-white/10 p-2.5 rounded text-[10.5px] font-mono flex items-start gap-1 text-[#b3d1ff] border border-white/5">
              <Info className="w-4.5 h-4.5 text-[#93b9ff] shrink-0 mt-0.5" />
              <span>Tip: El PIN por defecto de Carlos Ruiz es <strong>1111</strong> y John Doe es <strong>0000</strong>.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
