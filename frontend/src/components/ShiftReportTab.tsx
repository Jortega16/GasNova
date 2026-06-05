/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShiftAlert, Transaction, ShiftDetails } from '../types';
import { FileText, Clipboard, Printer, AlertTriangle, MessageSquare, ArrowRight, Save, Coins, CreditCard } from 'lucide-react';
import { api } from '../api';

interface ShiftReportTabProps {
  shiftDetails: ShiftDetails;
  transactions: Transaction[];
  alerts: ShiftAlert[];
  onAddNote: (noteText: string) => void;
  onCloseShift: (manualMeters: { [key: string]: string }) => void;
  prices: { [key: string]: number };
  isShiftClosing?: boolean;
  activeDispensingCount?: number;
}

export default function ShiftReportTab({
  shiftDetails,
  transactions,
  alerts,
  onAddNote,
  onCloseShift,
  prices,
  isShiftClosing = false,
  activeDispensingCount = 0
}: ShiftReportTabProps) {

  // Form states for manual meter entry
  const [manualMeters, setManualMeters] = useState<{ [key: string]: string }>({
    'Pump 1': '',
    'Pump 2': '',
    'Pump 3': '',
    'Pump 4': '',
    'Pump 5': '',
    'Pump 6': '',
  });

  // State for creating new alert/note
  const [newNote, setNewNote] = useState<string>('');
  const [noteSuccess, setNoteSuccess] = useState<boolean>(false);

  // Print dialogue/receipt simulation state
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Calculate totals from transactions
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate fuel type breakdown
  const regularSales = transactions.filter(t => t.fuelType === 'Regular Unleaded');
  const premiumSales = transactions.filter(t => t.fuelType === 'Premium Unleaded');
  const dieselSales = transactions.filter(t => t.fuelType === 'Diesel');

  const regularVol = regularSales.reduce((sum, t) => sum + t.volume, 0);
  const regularAmt = regularSales.reduce((sum, t) => sum + t.amount, 0);

  const premiumVol = premiumSales.reduce((sum, t) => sum + t.volume, 0);
  const premiumAmt = premiumSales.reduce((sum, t) => sum + t.amount, 0);

  const dieselVol = dieselSales.reduce((sum, t) => sum + t.volume, 0);
  const dieselAmt = dieselSales.reduce((sum, t) => sum + t.amount, 0);

  // Calculate payment methods breakdown
  const cardPayments = transactions.filter(t => t.paymentType === 'Credit Card' || t.paymentType === 'Debit Card' || t.paymentType === 'Fleet Card');
  const cashPayments = transactions.filter(t => t.paymentType === 'Cash');

  const cardAmt = cardPayments.reduce((sum, t) => sum + t.amount, 0);
  const cashAmt = cashPayments.reduce((sum, t) => sum + t.amount, 0);

  const cardPercent = totalRevenue > 0 ? Math.round((cardAmt / totalRevenue) * 100) : 70;
  const cashPercent = totalRevenue > 0 ? Math.round((cashAmt / totalRevenue) * 100) : 30;

  const handleMeterChange = (pumpName: string, val: string) => {
    setManualMeters(prev => ({
      ...prev,
      [pumpName]: val
    }));
  };

  const handleNotesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote);
    setNewNote('');
    setNoteSuccess(true);
    setTimeout(() => setNoteSuccess(false), 2000);
  };

  const handleCloseShiftSubmit = () => {
    // Open a beautiful printable modal summarizing the closed shift
    setShowReceiptModal(true);
    onCloseShift(manualMeters);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="shift-report-main-grid">
      
      {/* Left Columns (8 cols): Sales summaries & meter inputs */}
      <div className="col-span-1 lg:col-span-9 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Reporte de Ventas del Turno</h1>
          
          {isShiftClosing && (
            <span className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse font-sans">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              Cierre de turno en espera ({activeDispensingCount} mangueras)
            </span>
          )}
        </div>

        {isShiftClosing && (
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-300 text-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                <span className="text-base text-amber-700">⏳</span>
              </div>
              <div>
                <p className="font-sans font-extrabold text-sm text-slate-800 leading-tight uppercase tracking-wide">CIERRE DE TURNO RETENIDO</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Hay <strong className="text-amber-800 font-mono font-bold">{activeDispensingCount} mangueras despachando</strong> combustible en las pistas.
                  El sistema sellará automáticamente el turno, bloqueará las caras y generará el recibo en el momento exacto en que éstas finalicen su despacho.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Shift Details */}
        <div className="bg-[#191c1e] text-[#e0e3e5] rounded-xl p-5 border border-slate-800" id="shift-details-card">
          <h3 className="text-xs font-mono tracking-widest text-[#87a0cd] uppercase pb-2.5 border-b border-slate-800 font-bold mb-4">
            ● Detalles del Turno
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 font-sans">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-800/40 pb-1">
                <span className="text-[#87a0cd] text-xs">ID del Turno:</span>
                <span className="font-mono font-semibold text-white">{shiftDetails.shiftId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/40 pb-1">
                <span className="text-[#87a0cd] text-xs">Nombre del Operador:</span>
                <span className="font-semibold text-white">{shiftDetails.operatorName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/40 pb-1">
                <span className="text-[#87a0cd] text-xs">Hora de Inicio:</span>
                <span className="font-mono text-[#aec7f7]">{shiftDetails.startTime}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-800/40 pb-1">
                <span className="text-[#87a0cd] text-xs">Hora de Cierre:</span>
                <span className="font-mono text-white">{shiftDetails.endTime}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/40 pb-1">
                <span className="text-[#87a0cd] text-xs">Estado Est.:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                  shiftDetails.status === 'Active' ? 'bg-[#2E7D32]/30 text-[#4CAF50]' : 'bg-red-950 text-red-500'
                }`}>{shiftDetails.status === 'Active' ? 'Activo' : 'Cerrado'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/40 pb-1">
                <span className="text-[#87a0cd] text-xs">ID de Terminal:</span>
                <span className="font-mono text-white">POS-TERM-09A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 & 3: Two-column grid of Fuel Summary and Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Fuel Sales Summary */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-5 space-y-4" id="fuel-sales-summary">
            <div className="bg-[#1b365d] -mx-5 -mt-5 px-5 py-2.5 rounded-t-xl">
              <h3 className="text-white font-sans font-bold text-sm">Resumen de Ventas de Combustible</h3>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-500 uppercase font-sans font-medium">Ingresos Totales:</span>
              <p className="text-3xl font-mono font-bold text-slate-900 mt-1">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Fuel progress block bars */}
            <div className="space-y-3 pt-2">
              
              {/* Regular Unleaded */}
              <div>
                <div className="flex justify-between text-xs font-sans pb-1">
                  <span className="font-semibold text-slate-700">Regular</span>
                  <span className="font-mono text-slate-600">
                    {regularVol.toFixed(2)} Gal (${regularAmt.toFixed(2)})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded overflow-hidden flex relative items-center">
                  <div className="h-full bg-[#355e9e]" style={{ width: `${totalRevenue > 0 ? (regularAmt / totalRevenue) * 100 : 60}%` }} />
                  <span className="absolute left-2 text-[10px] font-mono text-white font-bold drop-shadow">
                    {totalRevenue > 0 ? Math.round((regularAmt / totalRevenue) * 100) : 60}%
                  </span>
                </div>
              </div>

              {/* Premium Unleaded */}
              <div>
                <div className="flex justify-between text-xs font-sans pb-1">
                  <span className="font-semibold text-slate-700">Premium</span>
                  <span className="font-mono text-slate-600">
                    {premiumVol.toFixed(2)} Gal (${premiumAmt.toFixed(2)})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded overflow-hidden flex relative items-center">
                  <div className="h-full bg-amber-600" style={{ width: `${totalRevenue > 0 ? (premiumAmt / totalRevenue) * 100 : 25}%` }} />
                  <span className="absolute left-2 text-[10px] font-mono text-white font-bold drop-shadow">
                    {totalRevenue > 0 ? Math.round((premiumAmt / totalRevenue) * 100) : 25}%
                  </span>
                </div>
              </div>

              {/* Diesel */}
              <div>
                <div className="flex justify-between text-xs font-sans pb-1">
                  <span className="font-semibold text-slate-700">Diesel</span>
                  <span className="font-mono text-slate-600">
                    {dieselVol.toFixed(2)} Gal (${dieselAmt.toFixed(2)})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded overflow-hidden flex relative items-center">
                  <div className="h-full bg-emerald-600" style={{ width: `${totalRevenue > 0 ? (dieselAmt / totalRevenue) * 100 : 15}%` }} />
                  <span className="absolute left-2 text-[10px] font-mono text-white font-bold drop-shadow">
                    {totalRevenue > 0 ? Math.round((dieselAmt / totalRevenue) * 100) : 15}%
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-5 space-y-4" id="payment-method-breakdown">
            <div className="bg-[#1b365d] -mx-5 -mt-5 px-5 py-2.5 rounded-t-xl">
              <h3 className="text-white font-sans font-bold text-sm">Desglose de Métodos de Pago</h3>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-500 uppercase font-sans font-medium">Total de Pagos:</span>
              <p className="text-3xl font-mono font-bold text-slate-900 mt-1">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Split Graphic Visual resembling a donut or structural chart */}
            <div className="flex gap-4 items-center pt-2">
              {/* Pie/Donut visual constructed via pure HTML/CSS */}
              <div className="w-24 h-24 rounded-full border-8 border-slate-100 flex items-center justify-center relative overflow-hidden" style={{
                background: `conic-gradient(#355e9e ${cardPercent}%, #f5ac00 0)`
              }}>
                <div className="w-14 h-14 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-[10px] text-slate-400 font-sans leading-none uppercase">Tarjetas</span>
                  <span className="text-xs font-bold font-mono text-slate-800 mt-0.5">{cardPercent}%</span>
                </div>
              </div>

              {/* Legend with data */}
              <div className="flex-1 space-y-2 font-sans text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-[#355e9e] rounded" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-slate-600">Tarjeta (Card):</span>
                    <span className="font-mono font-bold text-slate-800">${cardAmt.toFixed(2)} ({cardPercent}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-[#f5ac00] rounded" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-slate-600">Efectivo (Cash):</span>
                    <span className="font-mono font-bold text-slate-800">${cashAmt.toFixed(2)} ({cashPercent}%)</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
                  Incluye cobros procesados por tarjetas de flota, débito industrial y créditos bancarios.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Manual Meter Readings */}
        <div className="bg-white rounded-xl shadow border border-neutral-300 overflow-hidden" id="manual-meter-readings-card">
          <div className="bg-[#1b365d] px-5 py-3 flex items-center justify-between">
            <h3 className="text-white font-sans font-bold text-sm">Lecturas Manuales de Odómetros y Auditoría de Turno</h3>
            <span className="text-[11px] font-mono text-[#93b9ff]">
              Auditoría Física Requerida al Cierre
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            
            {/* Meter inputs grid columns (takes 3 of 4 columns) */}
            <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Pumps iteration */}
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const systemTotal = num === 1 ? 45.67 : num === 2 ? 12.34 : num === 3 ? 10.50 : 0.00;
                const pumpName = `Pump ${num}`;
                return (
                  <div key={num} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-neutral-200 gap-3">
                    <div className="text-xs font-sans">
                      <p className="font-bold text-slate-800">{pumpName.replace('Pump', 'Bomba')} - Manguera {num <= 3 ? num : num - 3}</p>
                      <span className="text-slate-500 text-[11px]">Suma Sistema: <strong className="font-mono text-slate-700">{systemTotal.toFixed(2)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={manualMeters[pumpName]}
                        onChange={(e) => handleMeterChange(pumpName, e.target.value)}
                        className="bg-white border border-neutral-300 rounded p-1 text-xs w-20 text-right focus:outline-none font-mono focus:border-[#355e9e] focus:ring-1 focus:ring-[#355e9e]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BIG blue CTA (takes 1 of 4 columns) */}
            <div className="col-span-1 text-center space-y-2">
              <button
                type="button"
                disabled={isShiftClosing}
                onClick={handleCloseShiftSubmit}
                className={`w-full font-sans font-bold text-sm py-4 px-3 rounded-lg flex flex-col items-center justify-center transition-all border shadow-md gap-2 ${
                  isShiftClosing 
                    ? 'bg-amber-600/95 text-white border-amber-600 cursor-not-allowed animate-pulse'
                    : 'bg-[#355e9e] hover:bg-[#355e9e]/80 text-white border-blue-400/20 cursor-pointer'
                }`}
                id="close-shift-ctabutton"
              >
                <Clipboard className={`w-6 h-6 ${isShiftClosing ? 'text-amber-100' : 'text-[#93b9ff]'}`} />
                <span className="leading-tight">
                  {isShiftClosing 
                    ? 'Retenido: Esperando Mangueras Activas...' 
                    : 'Cerrar Turno e Imprimir Reporte'}
                </span>
              </button>
              <p className="text-[10px] text-slate-500 font-sans leading-tight">
                {isShiftClosing 
                  ? 'El turno se cerrará automáticamente en cuanto las mangueras que están dispensando terminen.' 
                  : 'Genera el resumen final y resetea las métricas para el próximo operario.'}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Right Column (3 cols): Shift Alerts & Notes Panel */}
      <div className="col-span-1 lg:col-span-3 flex flex-col h-full bg-[#191c1e] rounded-xl border border-slate-800 overflow-hidden" id="shift-alerts-side-panel">
        
        {/* Header */}
        <div className="bg-slate-900/60 p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Alertas y Notas del Turno</h3>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        </div>

        {/* Scrollable Alerts and notes */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[380px] space-y-3 scrollbar-thin">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded border text-xs font-sans leading-normal ${
                a.isCustomNote
                  ? 'bg-[#1b365d]/50 border-[#355e9e]/30 text-slate-200'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="flex justify-between text-[10px] text-[#87a0cd] font-mono pb-1 border-b border-slate-700/40 mb-1.5 font-bold">
                <span>{a.dateTime}</span>
                <span className="uppercase text-[9px]">{a.isCustomNote ? 'Nota' : 'Alerta'}</span>
              </div>
              
              {a.isCustomNote ? (
                <p className="text-white italic">"{a.message || 'Sin mensaje'}"</p>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-[#aec7f7]">{a.pumpName.replace('Pump', 'Bomba')} - Transacción registrada</p>
                  <p className="text-[11px] font-mono">Vol: {a.volume} • Monto: {a.amount} • Pago: {
                    (() => {
                      const paymentLabels: { [key: string]: string } = {
                        'Cash': 'Efectivo',
                        'Credit Card': 'T. Crédito',
                        'Debit Card': 'T. Débito',
                        'Fleet Card': 'Vale/Flotilla',
                        'Auto': 'Automático',
                        'Note': 'Nota',
                        'System': 'Sistema'
                      };
                      return paymentLabels[a.paymentType] || a.paymentType;
                    })()
                  }</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form to leave a beautiful note */}
        <form onSubmit={handleNotesSubmit} className="p-4 bg-slate-900 border-t border-slate-800 space-y-2.5">
          <label className="block text-[11px] text-[#87a0cd] font-semibold uppercase tracking-wider">
            Agregar Nota / Alerta del Operador
          </label>
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Manguera 3 gotea un poco, requiere ajuste mecánico..."
              className="flex-1 bg-[#1b365d]/40 border border-[#355e9e] rounded p-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#93b9ff] resize-none h-14"
            />
            <button
              type="submit"
              className="bg-[#355e9e] hover:bg-[#355e9e]/80 text-white px-3 rounded flex items-center justify-center cursor-pointer transition-colors border border-blue-500/30"
              title="Guardar Nota"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
          {noteSuccess && (
            <p className="text-emerald-500 text-[10px] text-center font-bold animate-pulse">
              ✓ Nota guardada para el próximo turno.
            </p>
          )}
        </form>

      </div>

      {/* Audit Print Report MODAL Overlay */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn" id="receipt-modal-backdrop">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-300">
            {/* Header */}
            <div className="bg-[#1b365d] px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#93b9ff]" />
                <h3 className="font-sans font-bold text-base">Cierre de Turno Exitoso</h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-white hover:text-slate-200 font-sans text-xl"
              >
                ×
              </button>
            </div>

            {/* Printout Content mimicking physical receipt slip */}
            <div className="p-6 space-y-4 font-mono text-xs text-slate-800 bg-[#fbfbfb]" id="physical-receipt-slip">
              <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                <p className="font-bold text-lg font-sans text-[#1b365d]">GasNova POS Systems</p>
                <p className="text-[10px] text-slate-400">Estación de Servicio Central #109</p>
                <p className="text-[10px] text-slate-400">Fecha Impresión: {new Date().toLocaleString()}</p>
              </div>

              {/* Shift info block */}
              <div className="space-y-1 py-1 border-b border-dashed border-neutral-300">
                <p>ID del Turno: <span className="float-right font-bold">{shiftDetails.shiftId}</span></p>
                <p>Operador: <span className="float-right">{shiftDetails.operatorName}</span></p>
                <p>Inicio: <span className="float-right text-[10px]">{shiftDetails.startTime}</span></p>
                <p>Cierre: <span className="float-right text-[10px]">{shiftDetails.endTime}</span></p>
              </div>

              {/* Revenue list */}
              <div className="space-y-1.5 py-1.5 border-b border-dashed border-neutral-300">
                <p className="font-bold text-slate-900 pb-1">VENTAS POR GRADO:</p>
                <p>Regular: <span className="float-right">{regularVol.toFixed(2)} Gal (${regularAmt.toFixed(2)})</span></p>
                <p>Premium: <span className="float-right">{premiumVol.toFixed(2)} Gal (${premiumAmt.toFixed(2)})</span></p>
                <p>Diesel: <span className="float-right">{dieselVol.toFixed(2)} Gal (${dieselAmt.toFixed(2)})</span></p>
              </div>

              {/* Payments summary */}
              <div className="space-y-1.5 py-1.5 border-b border-dashed border-neutral-300">
                <p className="font-bold text-slate-900 pb-1">MÉTODOS DE PAGO:</p>
                <p>Pago Tarjeta ({cardPercent}%): <span className="float-right">${cardAmt.toFixed(2)}</span></p>
                <p>Pago Efectivo ({cashPercent}%): <span className="float-right">${cashAmt.toFixed(2)}</span></p>
                <p className="text-sm font-bold text-slate-900 pt-1 border-t border-neutral-200">TOTAL RECAUDADO: <span className="float-right">${totalRevenue.toFixed(2)}</span></p>
              </div>

              {/* Manual readings audit results */}
              <div className="space-y-1 py-1 text-[10px]">
                <p className="font-bold text-slate-900 pb-1 uppercase font-sans">Lecturas de Odómetros (Auditoría):</p>
                {[1,2,3,4,5,6].map(n => {
                  const name = `Pump ${n}`;
                  const sys = n === 1 ? 45.67 : n === 2 ? 12.34 : n === 3 ? 10.50 : 0.00;
                  const man = parseFloat(manualMeters[name] || '0') || 0;
                  const diff = man - sys;
                  return (
                    <p key={n} className="flex justify-between text-[#191c1e]">
                      <span>Bomba {n}: (Sistema: {sys.toFixed(2)})</span>
                      <span>Manual: {man.toFixed(2)} (Dif: <span className={diff === 0 ? 'text-green-600' : 'text-red-600'}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</span>)</span>
                    </p>
                  );
                })}
              </div>

              <div className="text-center pt-4 border-t border-dashed border-neutral-300 text-[10px] text-slate-400 leading-normal">
                <p className="font-bold text-slate-600">*** FIN DEL REPORTE FINAL DE TURNO ***</p>
                <p>Firma Operador: ______________________</p>
                <p>Firma Administrador: ______________________</p>
              </div>
            </div>

            {/* Close footer controls */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between gap-3 border-t border-neutral-200">
              <button
                onClick={() => {
                  const getShiftNameFromId = (id: string) => {
                    if (!id) return 'Matutino';
                    const parts = id.split('-');
                    const lastPart = parts[parts.length - 1];
                    const shiftNum = parseInt(lastPart, 10);
                    if (isNaN(shiftNum)) return 'Matutino';
                    const bracketNames = ['Matutino', 'Vespertino', 'Nocturno'];
                    return bracketNames[(shiftNum - 1) % 3] || 'Matutino';
                  };
                  const closedShiftName = getShiftNameFromId(shiftDetails.shiftId);

                  api.printClosure({
                    shift_id:          shiftDetails.shiftId,
                    shift_name:        closedShiftName,
                    operator_name:     shiftDetails.operatorName,
                    start_time:        shiftDetails.startTime,
                    end_time:          shiftDetails.endTime || new Date().toLocaleString(),
                    total_sales:       totalRevenue,
                    total_volume:      regularVol + premiumVol + dieselVol,
                    transaction_count: transactions.length,
                    fuel_breakdown: [
                      { fuel_type: 'Regular Unleaded', volume: regularVol, amount: regularAmt },
                      { fuel_type: 'Premium Unleaded', volume: premiumVol, amount: premiumAmt },
                      { fuel_type: 'Diesel', volume: dieselVol, amount: dieselAmt }
                    ],
                    payment_breakdown: [
                      { method: 'Tarjeta', amount: cardAmt },
                      { method: 'Efectivo', amount: cashAmt }
                    ]
                  }).catch(err => console.error("Error reprinting closure:", err));
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Reimprimir Cierre</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 bg-[#1b365d] hover:bg-[#1b365d]/85 text-white font-sans font-bold text-xs py-2 px-3 rounded text-center cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
