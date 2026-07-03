/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction } from '../types';
import { CreditCard, Coins, Key, History, TrendingUp, Fuel } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  searchQuery: string;
  currencySymbol?: string;
  unitMeasure?: 'Galones' | 'Litros';
}

export default function RecentTransactions({
  transactions,
  searchQuery,
  currencySymbol = '$',
  unitMeasure = 'Litros'
}: RecentTransactionsProps) {

  const [localSearch, setLocalSearch] = useState('');
  const [selectedPump, setSelectedPump] = useState<string>('all');

  const getPaymentConfig = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('credit') || t.includes('crédito')) {
      return { icon: <CreditCard className="w-3 h-3 text-blue-400" />, label: 'T. Crédito', color: 'text-blue-300', dot: 'bg-blue-400' };
    }
    if (t.includes('debit') || t.includes('débito')) {
      return { icon: <CreditCard className="w-3 h-3 text-violet-400" />, label: 'T. Débito', color: 'text-violet-300', dot: 'bg-violet-400' };
    }
    if (t.includes('cash') || t.includes('efectivo')) {
      return { icon: <Coins className="w-3 h-3 text-emerald-400" />, label: 'Efectivo', color: 'text-emerald-300', dot: 'bg-emerald-400' };
    }
    if (t.includes('fleet') || t.includes('vale') || t.includes('flota')) {
      return { icon: <Key className="w-3 h-3 text-amber-400" />, label: 'Flotilla', color: 'text-amber-300', dot: 'bg-amber-400' };
    }
    return { icon: <Key className="w-3 h-3 text-slate-400" />, label: type.substring(0, 10), color: 'text-slate-400', dot: 'bg-slate-400' };
  };

  const getFuelColor = (fuelType: string) => {
    if (fuelType.includes('Regular')) return 'text-blue-400';
    if (fuelType.includes('Premium')) return 'text-amber-400';
    if (fuelType.includes('Diesel')) return 'text-emerald-400';
    return 'text-purple-400';
  };

  const getFuelLabel = (fuelType: string) => {
    if (fuelType.includes('Regular')) return 'Regular';
    if (fuelType.includes('Premium')) return 'Súper';
    if (fuelType.includes('Diesel')) return 'Diesel';
    if (fuelType.includes('Kerosene')) return 'Kero';
    return fuelType || 'N/D';
  };

  const filtered = transactions.filter((t) => {
    // Combine general search query from header and localSearch from sidebar
    const qHeader = searchQuery.toLowerCase();
    const qLocal = localSearch.toLowerCase();
    
    // Check pump selection filter
    if (selectedPump !== 'all') {
      const tPump = t.pumpName.replace('Cara ', 'C').toLowerCase();
      if (tPump !== selectedPump.toLowerCase()) return false;
    }

    const matchesHeader = !searchQuery || (
      t.pumpName.toLowerCase().includes(qHeader) ||
      t.fuelType.toLowerCase().includes(qHeader) ||
      t.paymentType.toLowerCase().includes(qHeader) ||
      t.id.toLowerCase().includes(qHeader) ||
      t.amount.toString().includes(qHeader)
    );

    const matchesLocal = !localSearch || (
      t.pumpName.toLowerCase().includes(qLocal) ||
      t.fuelType.toLowerCase().includes(qLocal) ||
      t.paymentType.toLowerCase().includes(qLocal) ||
      t.id.toLowerCase().includes(qLocal) ||
      t.amount.toString().includes(qLocal)
    );

    return matchesHeader && matchesLocal;
  });

  const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0);
  const totalVolume = filtered.reduce((sum, item) => sum + item.volume, 0);

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100 rounded-2xl border border-slate-700/50 flex flex-col h-full overflow-hidden shadow-xl" id="recent-transactions-panel">

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
              <History className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-white">Transacciones</h3>
              <p className="text-[9px] text-slate-500 font-mono">Turno actual</p>
            </div>
          </div>
          <span className="bg-slate-700/60 text-slate-300 text-[10px] px-2.5 py-1 rounded-full font-mono font-bold border border-slate-600/30">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Local Filter UI */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/30 space-y-2">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Filtrar ventas (bomba, pago, monto)..."
          className="w-full bg-slate-950/40 border border-slate-700/50 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-sans"
        />
        
        {/* Quick Pump Selection Pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin text-[9px] font-sans">
          <button
            onClick={() => setSelectedPump('all')}
            className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
              selectedPump === 'all'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas
          </button>
          {['C1', 'C2', 'C3', 'C4'].map(pump => (
            <button
              key={pump}
              onClick={() => setSelectedPump(pump)}
              className={`px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                selectedPump === pump
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {pump}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-slate-900/60 text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800/60">
        <span className="col-span-3 text-left">Hora</span>
        <span className="col-span-2 text-center">Bomba</span>
        <span className="col-span-2 text-right">{unitMeasure === 'Galones' ? 'Gal' : 'L'}</span>
        <span className="col-span-2 text-right">Monto</span>
        <span className="col-span-3 text-right">Pago</span>
      </div>

      {/* Scrollable list (Expanded height to fill the sidebar space) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 min-h-[580px] max-h-[640px]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/30">
              <Fuel className="w-7 h-7 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Sin transacciones</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Las ventas del turno aparecerán aquí</p>
            </div>
          </div>
        ) : (
          filtered.map((trx, idx) => {
            const payConfig = getPaymentConfig(trx.paymentType);
            const fuelColor = getFuelColor(trx.fuelType);
            const isRecent = idx === 0;
            return (
              <div
                key={trx.id}
                className={`grid grid-cols-12 gap-1 px-3 py-2.5 text-xs items-center transition-all hover:bg-slate-700/30 ${
                  isRecent ? 'bg-blue-500/5 border-l-2 border-blue-500/40' : ''
                }`}
                id={`trx-row-${trx.id}`}
              >
                {/* Date/time */}
                <div className="col-span-3 text-[9px] text-slate-500 font-mono leading-tight">
                  {trx.dateTime.replace('Hoy ', '')}
                </div>

                {/* Pump */}
                <div className="col-span-2 flex justify-center">
                  <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded-md bg-slate-700/60 border border-slate-600/30 font-mono ${fuelColor}`}>
                    {trx.pumpName.replace('Cara ', 'C').includes('(')
                      ? trx.pumpName.replace('Cara ', 'C')
                      : `${trx.pumpName.replace('Cara ', 'C')} (${getFuelLabel(trx.fuelType)})`}
                  </span>
                </div>

                {/* Volume */}
                <div className="col-span-2 text-right text-slate-400 font-mono text-[10px]">
                  {trx.volume.toFixed(1)}
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right font-bold text-white font-mono text-[10px]">
                  {currencySymbol}{trx.amount.toFixed(2)}
                </div>

                {/* Payment */}
                <div className="col-span-3 flex items-center justify-end gap-1">
                  <span className={`w-1 h-1 rounded-full ${payConfig.dot} shrink-0`} />
                  <span className={`text-[9px] font-mono truncate ${payConfig.color}`}>
                    {payConfig.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Summary stats */}
      <div className="border-t border-slate-800/60 bg-slate-900/70 px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Total Vendido</span>
            </div>
            <span className="text-sm font-extrabold text-white font-mono">
              {currencySymbol}{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Fuel className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Total {unitMeasure === 'Galones' ? 'Galones' : 'Litros'}</span>
            </div>
            <span className="text-sm font-extrabold text-slate-200 font-mono">
              {totalVolume.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {unitMeasure === 'Galones' ? 'G' : 'L'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
