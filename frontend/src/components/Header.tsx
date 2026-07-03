/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  BarChart3,
  CreditCard,
  Package,
  Settings,
  HelpCircle,
  Search,
  DollarSign,
  User,
  Zap,
  Users,
  LogOut,
  ChevronDown,
  UserCheck,
  Terminal
} from 'lucide-react';
import { UserProfile } from '../types';
import type { Permission } from '../permissions';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  onLogout: () => void;
  onQuickSwitchUser: (user: UserProfile) => void;
  can?: (permission: Permission) => boolean;
}


const roleTranslations: { [key: string]: string } = {
  Admin: 'Administrador',
  Manager: 'Gerente',
  Supervisor: 'Supervisor',
  Operator: 'Operador'
};

export default function Header({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  currentUser,
  allUsers,
  onLogout,
  onQuickSwitchUser,
  can = () => true,
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const allNavItems = [
    { id: 'dashboard',      label: 'Dashboard',        icon: LayoutDashboard, permission: 'dashboard.view' as Permission },
    { id: 'priceConfig',    label: 'Config. Precios',  icon: DollarSign,      permission: 'prices.view' as Permission },
    { id: 'shiftReport',    label: 'Reporte Turno',    icon: FileText,        permission: 'shift.report' as Permission },
    { id: 'transactions',   label: 'Ventas Diarias',   icon: TrendingUp,      permission: 'reports.daily' as Permission },
    { id: 'monthlySummary', label: 'Resumen Mensual',  icon: BarChart3,       permission: 'reports.monthly' as Permission },
    { id: 'cards',          label: 'Gestión Tarjetas', icon: CreditCard,      permission: 'cards.manage' as Permission },
    { id: 'inventory',      label: 'Inventario',       icon: Package,         permission: 'inventory.view' as Permission },
    { id: 'users',          label: 'Usuarios / Roles', icon: Users,           permission: 'users.view' as Permission },
    { id: 'settings',       label: 'Ajustes',          icon: Settings,        permission: 'settings.view' as Permission },
    { id: 'pts2RawApi',     label: 'Simulador PTS-2',  icon: Terminal,        permission: 'simulator.access' as Permission },
    { id: 'help',           label: 'Ayuda',            icon: HelpCircle,      permission: null },
  ];

  const navItems = allNavItems.filter(item => item.permission === null || can(item.permission));

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const roleAvatarColor: Record<string, string> = {
    Admin:      'bg-red-700 text-white',
    Manager:    'bg-blue-700 text-white',
    Supervisor: 'bg-purple-700 text-white',
    Operator:   'bg-emerald-700 text-white',
  };

  return (
    <header className="bg-[#002046] text-white select-none shrink-0" id="global-header">
      {/* Top Bar container */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between px-4 lg:px-6 py-2 border-b border-[#1b365d] gap-3">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => setActiveTab('dashboard')} id="brand-logo">
          <div className="w-10 h-10 bg-[#001530] rounded-xl flex items-center justify-center shadow-md border border-[#355e9e]/50 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-sky-500 to-amber-500 rounded-xl opacity-30 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* SVG Vector Logo representing Gas + Star/Nova */}
            <svg viewBox="0 0 100 100" className="w-7 h-7 relative z-10 animate-pulse" style={{ animationDuration: '3s' }}>
              <defs>
                <linearGradient id="gasnova-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" /> {/* Cyan/Sky */}
                  <stop offset="100%" stopColor="#f97316" /> {/* Orange Nova */}
                </linearGradient>
              </defs>
              {/* Outer Energy droplet */}
              <path 
                d="M50,15 C68,40 82,55 82,72 A32,32 0 1,1 18,72 C18,55 32,40 50,15 Z" 
                fill="none" 
                stroke="url(#gasnova-gradient)" 
                strokeWidth="7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Center shining Nova spark */}
              <path 
                d="M50,38 L53,49 L64,52 L53,55 L50,66 L47,55 L36,52 L47,49 Z" 
                fill="#ffffff" 
                className="drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
              />
            </svg>
          </div>
          <div>
            <span className="font-sans font-extrabold tracking-tight text-xl block leading-tight bg-gradient-to-r from-sky-400 via-white to-amber-400 bg-clip-text text-transparent">GASNOVA</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#87a0cd] block">Operations POS v5.0</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md mx-0 lg:mx-8" id="search-container">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#87a0cd]" />
          <input
            type="text"
            placeholder="Buscar transacciones, bombas, alertas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1b365d]/50 border border-[#355e9e] rounded-md py-1.5 pl-9 pr-4 text-sm text-white placeholder-[#87a0cd] focus:outline-none focus:ring-2 focus:ring-[#93b9ff] transition-all"
            id="global-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-[#87a0cd] hover:text-white text-xs font-mono"
            >
              ×
            </button>
          )}
        </div>

        {/* Dynamic User Profile menu & fast switcher */}
        {currentUser && (
          <div className="relative" id="user-profile-menu-container">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-3 bg-[#1b365d]/80 hover:bg-[#133562] px-4 py-1.5 rounded-lg border border-[#355e9e]/50 cursor-pointer transition-colors text-left"
              id="user-profile-button"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-mono shrink-0 ${roleAvatarColor[currentUser.role] || 'bg-slate-600 text-white'}`}>
                {getInitials(currentUser.name)}
              </div>
              <div>
                <div className="text-xs font-bold leading-tight font-sans text-white flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#87a0cd]" />
                </div>
                <div className="text-[9px] text-[#87a0cd] font-mono uppercase tracking-wider font-bold">
                  {roleTranslations[currentUser.role] || currentUser.role}
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Sistema online" />
            </button>

            {showUserDropdown && (
              <>
                {/* Backdrop overlay to close the dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserDropdown(false)} 
                />
                
                {/* Dropdown panel */}
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-neutral-300 py-2.5 z-50 animate-fadeIn" id="user-profile-dropdown">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Sesión Activa</p>
                    <p className="text-xs font-bold text-slate-800 font-sans mt-0.5">{currentUser.name}</p>
                    <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[9px] rounded font-mono font-extrabold px-1.5 py-0.5 border border-blue-200">
                      Rol: {roleTranslations[currentUser.role] || currentUser.role}
                    </span>
                  </div>

                  <div className="px-3 py-2">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold px-1 mb-1.5 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      Cambio Rápido de Usuario
                    </p>
                    
                    <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1" id="quick-switch-users-list">
                      {allUsers
                        .filter(u => u.id !== currentUser.id && u.status === 'Active')
                        .map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onQuickSwitchUser(u);
                              setShowUserDropdown(false);
                            }}
                            className="w-full text-left font-sans text-xs hover:bg-slate-50 p-1.5 rounded-lg flex items-center justify-between transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{u.avatar}</span>
                              <div>
                                <p className="font-semibold text-slate-700 leading-tight">{u.name}</p>
                                <span className="text-[9px] text-slate-400 font-mono uppercase">{roleTranslations[u.role] || u.role}</span>
                              </div>
                            </div>
                            <span className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold font-sans">
                              Cambiar
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-1 px-2.5 mt-1">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left font-sans font-bold text-xs text-red-600 hover:bg-red-50 p-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      id="logout-button-header"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-[#0b284e] border-b border-[#1b365d] overflow-x-auto scrollbar-none scroll-smooth">
        <div className="flex px-4 min-w-[760px]" id="navigation-tabs-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-button-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2.5 px-4 text-xs font-medium cursor-pointer transition-all duration-150 border-b-2 gap-1 relative ${
                  isActive
                    ? 'text-white border-[#93b9ff] bg-[#133562]/80 font-semibold'
                    : 'text-[#87a0cd] border-transparent hover:text-white hover:bg-[#133562]/30'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#93b9ff]' : 'text-[#87a0cd]'}`} />
                <span className="text-[11px] uppercase tracking-wider font-sans whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#93b9ff] shadow-[0_0_8px_#93b9ff]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
