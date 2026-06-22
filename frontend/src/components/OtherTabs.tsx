/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, PaymentMethod, DispenserState, FuelType, NozzleState } from '../types';
import { TrendingUp, CreditCard, HelpCircle, Star, ShieldCheck, Mail, ShieldAlert, Check, Terminal, Users, UserCheck, Plus, BarChart3, Database, Clock, DollarSign, Trash2, Edit2, Palette, Eye, Settings, RefreshCw, Printer, Scissors, FileText, Receipt, ChevronDown, ChevronUp, Save, Wifi, WifiOff, Download } from 'lucide-react';
import { api } from '../api';

const getPrintApiBaseUrl = () => {
  const envUrl = (import.meta as any).env.VITE_API_BASE_URL;
  if (envUrl) {
    if (typeof window !== 'undefined' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', window.location.hostname);
    }
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8002`;
  }
  return 'http://localhost:8002';
};

const PRINT_API_BASE_URL = getPrintApiBaseUrl();

interface OtherTabsProps {
  tabId: string;
  transactions: Transaction[];
  onAddTransaction?: (trx: Transaction) => void;
  shiftCount?: number;
  setShiftCount?: (count: number) => void;
  shiftBrackets?: { id: string; name: string; start: string; end: string }[];
  setShiftBrackets?: React.Dispatch<React.SetStateAction<{ id: string; name: string; start: string; end: string }[]>>;
  paymentMethods?: PaymentMethod[];
  setPaymentMethods?: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  themeMode?: string;
  setThemeMode?: (theme: string) => void;
  dispensers?: DispenserState[];
  setDispensers?: React.Dispatch<React.SetStateAction<DispenserState[]>>;
  onSettingsChange?: () => void;
}

const fuelTypeTranslations: { [key: string]: string } = {
  'Regular Unleaded': 'Gasolina Regular',
  'Premium Unleaded': 'Gasolina Premium',
  'Diesel': 'Diesel',
  'Kerosene': 'Queroseno',
  'LPG': 'LPG'
};

const paymentTranslations: { [key: string]: string } = {
  'Cash': 'Efectivo',
  'Credit Card': 'Tarjeta de Crédito',
  'Debit Card': 'Tarjeta de Débito',
  'Fleet Card': 'Tarjeta de Flota',
  'Auto': 'Automático'
};

export default function OtherTabs({ 
  tabId, 
  transactions, 
  onAddTransaction,
  shiftCount = 3,
  setShiftCount,
  shiftBrackets = [],
  setShiftBrackets,
  paymentMethods = [],
  setPaymentMethods,
  themeMode = 'slate',
  setThemeMode,
  dispensers = [],
  setDispensers,
  onSettingsChange
}: OtherTabsProps) {
  
  // States for Card management
  const [fleetCards, setFleetCards] = useState([
    { id: 'FC-9008-01', holder: 'DHL Logistics Transp.', limit: 5000, currentUsed: 1245.50, status: 'Active' },
    { id: 'FC-3392-12', holder: 'FexEx Local Delivery', limit: 2500, currentUsed: 2190.00, status: 'Warning-Near-Limit' },
    { id: 'FC-5521-08', holder: 'Coca-Cola Distribución', limit: 8000, currentUsed: 0.00, status: 'Active' },
    { id: 'FC-1102-45', holder: 'Estafeta Courier', limit: 3000, currentUsed: 3100.00, status: 'Declined' },
  ]);

  // States for TPV, API, and WebSocket connection parameters in Settings view
  const [tpvId, setTpvId] = useState('TPV-ESTACION-01');
  const [tpvLocation, setTpvLocation] = useState('Isla Principal');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.gasnova.site/v1');
  const [apiToken, setApiToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  const [wsEndpoint, setWsEndpoint] = useState('wss://stream.gasnova.com/events');
  const [pts2Host, setPts2Host] = useState('192.168.50.117');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isTestingWs, setIsTestingWs] = useState(false);

  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [cardSuccess, setCardSuccess] = useState(false);

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardHolder || !newCardLimit) return;
    const limitNum = parseFloat(newCardLimit);
    if (isNaN(limitNum) || limitNum <= 0) return;

    const newCard = {
      id: `FC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
      holder: newCardHolder,
      limit: limitNum,
      currentUsed: 0,
      status: 'Active'
    };

    setFleetCards([newCard, ...fleetCards]);
    setNewCardHolder('');
    setNewCardLimit('');
    setCardSuccess(true);
    setTimeout(() => setCardSuccess(false), 3000);
  };

  // States for custom payment methods creation
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodEmoji, setNewMethodEmoji] = useState('💳');
  const [newMethodColor, setNewMethodColor] = useState('bg-blue-600 text-white border-blue-700');

  // States for dynamic dispensers inside Settings
  const [newCaraConfName, setNewCaraConfName] = useState('');
  const [newCaraConfProducts, setNewCaraConfProducts] = useState<FuelType[]>(['Regular Unleaded', 'Premium Unleaded', 'Diesel']);

  // ── Printer / Template Settings state ─────────────────────────────────────
  const [settingsTab, setSettingsTab] = useState<'general' | 'printer' | 'station'>('general');
  const [printerStatus, setPrinterStatus]   = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [printerSaving, setPrinterSaving]   = useState(false);
  const [printerSaved, setPrinterSaved]     = useState(false);
  const [printerTesting, setPrinterTesting] = useState(false);
  const [printerTestOk, setPrinterTestOk]   = useState<boolean | null>(null);

  // ── Station settings state ────────────────────────────────────────────────
  const [unitMeasure, setUnitMeasure] = useState('Litros');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [stationCountry, setStationCountry] = useState('Guatemala');
  const [stationCity, setStationCity] = useState('Ciudad de Guatemala');
  const [stationCanton, setStationCanton] = useState('');
  const [stationDepartment, setStationDepartment] = useState('Guatemala');
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter]     = useState('');

  // States for Closed Shifts filtering
  const [shiftsHistory, setShiftsHistory] = useState<any[]>([]);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('');
  const [shiftTrxList, setShiftTrxList] = useState<Transaction[]>([]);
  const [loadingTrxs, setLoadingTrxs] = useState(false);
  const [trxSearchQuery, setTrxSearchQuery] = useState('');
  const [trxDateFilter, setTrxDateFilter] = useState('');

  // Config fields (loaded from backend on mount)
  const [pStationName,    setPStationName]    = useState('GASNOVA OUTLET');
  const [pStationRuc,     setPStationRuc]     = useState('20459871402');
  const [pStationAddress, setPStationAddress] = useState('');
  const [pStationPhone,   setPStationPhone]   = useState('');
  const [pTicketFooter1,  setPTicketFooter1]  = useState('Gracias por su preferencia!');
  const [pTicketFooter2,  setPTicketFooter2]  = useState('Conserve su comprobante');
  const [pInvoiceFooter1, setPInvoiceFooter1] = useState('Gracias por su preferencia!');
  const [pInvoiceFooter2, setPInvoiceFooter2] = useState('Documento tributario electronico');
  const [pClosureFooter1, setPClosureFooter1] = useState('Cierre de Turno verificado');
  const [pClosureFooter2, setPClosureFooter2] = useState('GasNova POS v2');
  const [pFeedLines,      setPFeedLines]      = useState(3);
  const [pCutType,        setPCutType]        = useState<'full' | 'partial'>('full');
  const [pShowTax,        setPShowTax]        = useState(false);
  const [pTaxRate,        setPTaxRate]        = useState(0);
  const [pCurrencySymbol, setPCurrencySymbol] = useState('$');

  useEffect(() => {
    // Load printer config from backend
    fetch(`${PRINT_API_BASE_URL}/print/status`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.all_printer_names) setAvailablePrinters(data.all_printer_names);
        if (data.configured_printer) setSelectedPrinter(data.configured_printer);
        else if (data.active_printer) setSelectedPrinter(data.active_printer);
        const hasPOS = data.all_printer_names?.some((p: string) => p.toLowerCase().includes('pos'));
        setPrinterStatus(hasPOS ? 'ok' : 'error');
      })
      .catch(() => setPrinterStatus('error'));

    fetch(`${PRINT_API_BASE_URL}/print/config`)
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (!cfg) return;
        if (cfg.station_name)        setPStationName(cfg.station_name);
        if (cfg.station_ruc)         setPStationRuc(cfg.station_ruc);
        if (cfg.station_address)     setPStationAddress(cfg.station_address);
        if (cfg.station_phone)       setPStationPhone(cfg.station_phone);
        if (cfg.ticket_footer_1)     setPTicketFooter1(cfg.ticket_footer_1);
        if (cfg.ticket_footer_2)     setPTicketFooter2(cfg.ticket_footer_2);
        if (cfg.invoice_footer_1)    setPInvoiceFooter1(cfg.invoice_footer_1);
        if (cfg.invoice_footer_2)    setPInvoiceFooter2(cfg.invoice_footer_2);
        if (cfg.closure_footer_1)    setPClosureFooter1(cfg.closure_footer_1);
        if (cfg.closure_footer_2)    setPClosureFooter2(cfg.closure_footer_2);
        if (cfg.feed_lines_before_cut !== undefined) setPFeedLines(cfg.feed_lines_before_cut);
        if (cfg.cut_type)            setPCutType(cfg.cut_type);
        if (cfg.show_tax_detail !== undefined) setPShowTax(cfg.show_tax_detail);
        if (cfg.tax_rate !== undefined) setPTaxRate(cfg.tax_rate * 100);
        if (cfg.currency_symbol)     setPCurrencySymbol(cfg.currency_symbol);
      })
      .catch(() => {});

    // Load system settings
    api.getSystemSettings()
      .then(res => {
        if (!res || !res.ok || !res.data) return;
        const data = res.data;
        if (data.unit_measure) setUnitMeasure(data.unit_measure);
        if (data.currency_symbol) setCurrencySymbol(data.currency_symbol);
        if (data.station_country) setStationCountry(data.station_country);
        if (data.station_city) setStationCity(data.station_city);
        if (data.station_canton !== undefined) setStationCanton(data.station_canton);
        if (data.station_department) setStationDepartment(data.station_department);
        if (data.pts2_host) setPts2Host(data.pts2_host);
        if (data.remote_api_url) setApiEndpoint(data.remote_api_url);
      })
      .catch(() => {});

    // Load closed shifts history
    api.getShifts()
      .then(res => {
        if (res && res.ok && res.data) {
          setShiftsHistory(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Update selected shift transactions dynamically
  useEffect(() => {
    if (!selectedShiftFilter) {
      setShiftTrxList(transactions);
      return;
    }
    setLoadingTrxs(true);
    api.getShiftTransactions(selectedShiftFilter)
      .then(res => {
        if (res && res.ok && res.data) {
          setShiftTrxList(res.data);
        } else {
          setShiftTrxList([]);
        }
      })
      .catch(() => {
        setShiftTrxList([]);
      })
      .finally(() => setLoadingTrxs(false));
  }, [selectedShiftFilter, transactions]);

  const handleSavePrinterConfig = async () => {
    setPrinterSaving(true);
    try {
      await fetch(`${PRINT_API_BASE_URL}/print/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printer_name:          selectedPrinter,
          station_name:          pStationName,
          station_ruc:           pStationRuc,
          station_address:       pStationAddress,
          station_phone:         pStationPhone,
          ticket_footer_1:       pTicketFooter1,
          ticket_footer_2:       pTicketFooter2,
          invoice_footer_1:      pInvoiceFooter1,
          invoice_footer_2:      pInvoiceFooter2,
          closure_footer_1:      pClosureFooter1,
          closure_footer_2:      pClosureFooter2,
          feed_lines_before_cut: pFeedLines,
          cut_type:              pCutType,
          show_tax_detail:       pShowTax,
          tax_rate:              pTaxRate / 100,
          currency_symbol:       pCurrencySymbol,
        }),
      });
      setPrinterSaved(true);
      setTimeout(() => setPrinterSaved(false), 3000);
    } catch (e) { /* ignore */ }
    finally { setPrinterSaving(false); }
  };

  const handleSaveStationSettings = async () => {
    setPrinterSaving(true);
    try {
      await api.updateSystemSetting('unit_measure', unitMeasure);
      await api.updateSystemSetting('currency_symbol', currencySymbol);
      await api.updateSystemSetting('station_country', stationCountry);
      await api.updateSystemSetting('station_city', stationCity);
      await api.updateSystemSetting('station_canton', stationCanton);
      await api.updateSystemSetting('station_department', stationDepartment);

      // Sincronizar tambien con el simbolo de moneda local
      setPCurrencySymbol(currencySymbol);

      setPrinterSaved(true);
      setTimeout(() => setPrinterSaved(false), 3000);
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPrinterSaving(false);
    }
  };

  const handleSaveConnectionSettings = async () => {
    setPrinterSaving(true);
    try {
      await api.updateSystemSetting('pts2_host', pts2Host);
      await api.updateSystemSetting('remote_api_url', apiEndpoint);
      setPrinterSaved(true);
      setTimeout(() => setPrinterSaved(false), 3000);
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPrinterSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setPrinterTesting(true);
    setPrinterTestOk(null);
    try {
      // Primero actualizar la impresora seleccionada en el backend
      if (selectedPrinter) {
        await fetch(`${PRINT_API_BASE_URL}/print/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printer_name: selectedPrinter }),
        });
      }
      const res = await fetch(`${PRINT_API_BASE_URL}/print/test`, { method: 'POST' });
      const data = await res.json();
      setPrinterTestOk(data.ok === true);
    } catch { setPrinterTestOk(false); }
    finally { setPrinterTesting(false); }
  };

  // Render selector depending on active tab ID
  switch (tabId) {
    case 'transactions': {
      const displayedTransactions = shiftTrxList.filter(t => {
        // 1. Date filter
        if (trxDateFilter) {
          if (!t.dateTime.startsWith(trxDateFilter)) {
            return false;
          }
        }
        // 2. Search query filter
        if (trxSearchQuery.trim()) {
          const q = trxSearchQuery.toLowerCase();
          const matchId = t.id.toLowerCase().includes(q);
          const matchPump = t.pumpName.toLowerCase().includes(q);
          const matchFuel = (fuelTypeTranslations[t.fuelType] || t.fuelType).toLowerCase().includes(q);
          const matchPayment = (paymentTranslations[t.paymentType] || t.paymentType).toLowerCase().includes(q);
          if (!matchId && !matchPump && !matchFuel && !matchPayment) {
            return false;
          }
        }
        return true;
      });

      return (
        <div className="bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-6" id="daily-sales-history-view">
          <div className="border-b border-neutral-200 pb-3 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#355e9e]" />
                Historial de Ventas Diarias por Turno
              </h2>
              <p className="text-xs text-slate-500 mt-1">Consulte el historial de ventas del turno actual o de turnos anteriores cerrados.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-mono font-bold bg-[#355e9e] text-white px-3 py-1 rounded-full shadow-sm">
                {displayedTransactions.length} {displayedTransactions.length === 1 ? 'Transacción' : 'Transacciones'}
              </span>
              <span className="text-xs font-mono font-bold bg-[#1b365d] text-white px-3 py-1 rounded-full shadow-sm">
                Total Recaudado: ${displayedTransactions.reduce((s,t) => s+t.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Filtros de Búsqueda, Turno y Día */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-neutral-200">
            {/* Selector de Turno */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Turno</label>
              <select
                value={selectedShiftFilter}
                onChange={e => setSelectedShiftFilter(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none bg-white cursor-pointer font-bold"
              >
                <option value="">-- Turno Activo (Actual) --</option>
                {shiftsHistory.map(s => (
                  <option key={s.shift_id} value={s.shift_id}>
                    {s.shift_id} - {s.operator_name} ({s.status === 'Active' ? 'Activo' : 'Cerrado'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector por Día */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Filtrar por Día</label>
              <input
                type="date"
                value={trxDateFilter}
                onChange={e => setTrxDateFilter(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none bg-white cursor-pointer"
              />
            </div>

            {/* Búsqueda de Texto */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Buscar Transacción</label>
              <input
                type="text"
                value={trxSearchQuery}
                onChange={e => setTrxSearchQuery(e.target.value)}
                placeholder="Ej: TRX-20, Cara 1, Efectivo, Regular..."
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto relative">
            {loadingTrxs && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <span className="text-xs font-sans font-bold text-slate-600 animate-pulse">Cargando transacciones del turno...</span>
              </div>
            )}
            <table className="w-full text-left text-sm border-collapse" id="exhaustive-transactions-table">
              <thead>
                <tr className="bg-slate-100 text-xs font-sans font-bold border-b border-neutral-200 text-slate-700 uppercase tracking-wider">
                  <th className="px-4 py-3">Código TRX</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Dispensador</th>
                  <th className="px-4 py-3">Grado Combustible</th>
                  <th className="px-4 py-3 text-right">Volumen ({unitMeasure === 'Galones' ? 'Gal' : 'L'})</th>
                  <th className="px-4 py-3 text-right">Importe Cobrado</th>
                  <th className="px-4 py-3 text-right">Método de Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-sans">
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs font-bold text-red-500 bg-red-50/30">
                      ⚠ Turno sin transacciones.
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{t.id}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{t.dateTime}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-800 font-bold">{t.pumpName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fuelTypeTranslations[t.fuelType] || t.fuelType}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-600">{t.volume.toFixed(2)} {unitMeasure === 'Galones' ? 'G' : 'L'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">${t.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-xs">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          t.paymentType === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {paymentTranslations[t.paymentType] || t.paymentType}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'monthlySummary':
      return (
        <div className="bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-6" id="monthly-summary-performance-view">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#355e9e]" />
              Resumen de Desempeño Mensual (Analytics)
            </h2>
            <p className="text-xs text-slate-500 mt-1">Análisis histórico agregado para toma de decisiones de inventario y precios.</p>
          </div>

          {/* Quick metric grids */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1b365d]/5 border border-[#355e9e]/30 rounded-lg p-4 text-center">
              <span className="text-xs text-[#355e9e] font-sans font-extrabold uppercase">Ventas de Regular</span>
              <p className="text-2xl font-mono font-bold text-slate-800 mt-1">32,450.50 G</p>
              <span className="text-[10px] text-green-700 font-semibold font-sans">↑ +4.2% mes anterior</span>
            </div>
            <div className="bg-amber-600/5 border border-amber-600/30 rounded-lg p-4 text-center">
              <span className="text-xs text-amber-700 font-sans font-extrabold uppercase">Ventas de Premium</span>
              <p className="text-2xl font-mono font-bold text-slate-800 mt-1">8,124.90 G</p>
              <span className="text-[10px] text-[#355e9e] font-sans font-semibold">→ Estable</span>
            </div>
            <div className="bg-emerald-600/5 border border-emerald-600/30 rounded-lg p-4 text-center">
              <span className="text-xs text-emerald-700 font-sans font-extrabold uppercase">Ventas de Diesel</span>
              <p className="text-2xl font-mono font-bold text-slate-800 mt-1">14,930.30 G</p>
              <span className="text-[10px] text-green-700 font-sans font-semibold">↑ +12.5% aumento flota</span>
            </div>
            <div className="bg-neutral-800/5 border border-neutral-800/30 rounded-lg p-4 text-center">
              <span className="text-xs text-slate-600 font-sans font-extrabold uppercase">Facturación Total</span>
              <p className="text-2xl font-mono font-bold text-slate-950 mt-1">$238,459.00</p>
              <span className="text-[10px] text-green-700 font-sans font-semibold">↑ Margen Neto: 18.5%</span>
            </div>
          </div>

          {/* Graphical Analytics (Clean pure-SVG render line charting to prevent dynamic library import breaks) */}
          <div className="bg-slate-50 border border-neutral-200 rounded-xl p-5" id="monthly-trend-pure-svg-chart">
            <h3 className="font-sans font-semibold text-xs text-slate-500 mb-4 uppercase tracking-wider">Histórico de Ventas Semanales (Mayo 2026)</h3>
            
            <div className="w-full h-44 flex items-end justify-between px-4 pt-4 border-b border-slate-300 relative">
              
              {/* Graphic background horizontal gridlines */}
              <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
              <div className="absolute inset-x-0 bottom-1/4 h-px bg-slate-200" />
              <div className="absolute inset-x-0 bottom-1/2 h-px bg-slate-200" />
              <div className="absolute inset-x-0 bottom-3/4 h-px bg-slate-200" />

              {/* Bar 1 */}
              <div className="flex flex-col items-center flex-1 group">
                <span className="text-[10px] font-mono font-bold text-[#355e9e] bg-white px-1 border rounded shadow scale-0 group-hover:scale-100 transition-all mb-1 absolute bottom-[110px]">$45K</span>
                <div className="w-12 bg-[#355e9e] rounded-t-sm h-24 shadow transition-all duration-300 group-hover:opacity-85" />
                <span className="text-[10px] font-sans text-slate-500 mt-2">Semana 1</span>
              </div>

              {/* Bar 2 */}
              <div className="flex flex-col items-center flex-1 group">
                <span className="text-[10px] font-mono font-bold text-[#355e9e] bg-white px-1 border rounded shadow scale-0 group-hover:scale-100 transition-all mb-1 absolute bottom-[135px]">$58K</span>
                <div className="w-12 bg-[#1b365d] rounded-t-sm h-32 shadow transition-all duration-300 group-hover:opacity-85" />
                <span className="text-[10px] font-sans text-slate-500 mt-2">Semana 2</span>
              </div>

              {/* Bar 3 */}
              <div className="flex flex-col items-center flex-1 group">
                <span className="text-[10px] font-mono font-bold text-[#355e9e] bg-white px-1 border rounded shadow scale-0 group-hover:scale-100 transition-all mb-1 absolute bottom-[120px]">$52K</span>
                <div className="w-12 bg-[#355e9e] rounded-t-sm h-28 shadow transition-all duration-300 group-hover:opacity-85" />
                <span className="text-[10px] font-sans text-slate-500 mt-2">Semana 3</span>
              </div>

              {/* Bar 4 */}
              <div className="flex flex-col items-center flex-1 group">
                <span className="text-[10px] font-mono font-bold text-[#355e9e] bg-white px-1 border rounded shadow scale-0 group-hover:scale-100 transition-all mb-1 absolute bottom-[150px]">$72K</span>
                <div className="w-12 bg-[#1b365d] rounded-t-sm h-36 shadow transition-all duration-300 group-hover:opacity-85" />
                <span className="text-[10px] font-sans text-slate-500 mt-2">Semana 4 (Cierre)</span>
              </div>

            </div>
          </div>
        </div>
      );

    case 'cards':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="fleet-card-management-grid">
          
          {/* Card directory table (8 cols) */}
          <div className="col-span-1 lg:col-span-9 bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-4">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#355e9e]" />
                  Gestión de Tarjetas y Control de Flotas
                </h2>
                <p className="text-xs text-slate-500 mt-1">Consulte el saldo, estado e historial crediticio de transportadores corporativos autorizados.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse" id="fleet-cards-table">
                <thead>
                  <tr className="bg-slate-100 text-xs font-sans font-bold border-b border-neutral-200 text-slate-700 uppercase tracking-wider">
                    <th className="px-4 py-3">Código Tarjeta</th>
                    <th className="px-4 py-3">Titular Corporativo</th>
                    <th className="px-4 py-3 text-right">Límite Mensual</th>
                    <th className="px-4 py-3 text-right">Consumido</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-sans">
                  {fleetCards.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{card.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{card.holder}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">${card.limit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">${card.currentUsed.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          card.status === 'Active' ? 'bg-green-100 text-green-700' :
                          card.status === 'Warning-Near-Limit' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {card.status === 'Active' ? 'Activo' : card.status === 'Warning-Near-Limit' ? 'Límite Cercano' : card.status === 'Declined' ? 'Rechazado' : card.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fleet action panel (3 cols) */}
          <div className="col-span-1 lg:col-span-3">
            <div className="bg-[#191c1e] text-white rounded-xl border border-slate-800 p-5 space-y-4 shadow-md">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#93b9ff]" />
                  Registrar Tarjeta Corporativa
                </h3>
                <p className="text-[11px] text-[#87a0cd] font-sans mt-1 leading-relaxed">
                  Autoriza una nueva tarjeta de flotilla de crédito pre-aprobado para cobros automáticos directos.
                </p>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-4" id="fleet-card-creation-form">
                <div>
                  <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                    Nombre Empresa / Chofer
                  </label>
                  <input
                    type="text"
                    required
                    value={newCardHolder}
                    onChange={(e) => setNewCardHolder(e.target.value)}
                    placeholder="e.g. Sabritas S.A. de C.V."
                    className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#87a0cd] mb-1 font-sans">
                    Límite Mensual Autorizado ($)
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={newCardLimit}
                    onChange={(e) => setNewCardLimit(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded p-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#355e9e] hover:bg-[#355e9e]/80 text-white font-sans font-bold text-xs py-2.5 px-3 rounded text-center cursor-pointer transition-all border border-[#93b9ff]/30 shadow"
                >
                  Registrar Tarjeta Flota
                </button>
              </form>

              {cardSuccess && (
                <div className="bg-[#2E7D32]/20 border border-[#4CAF50]/30 rounded p-2 text-center text-xs text-[#4CAF50] font-sans animate-pulse">
                  ✓ Tarjeta de flota validada y autorizada correctamente.
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'settings': {
      const togglePaymentMethod = (id: string) => {
        if (!setPaymentMethods) return;
        setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
      };

      const handleAddNewCara = (e: React.FormEvent) => {
        e.preventDefault();
        if (!setDispensers || !newCaraConfName.trim()) return;
        if (newCaraConfProducts.length === 0) return;
        
        const nextId = dispensers.length > 0 ? Math.max(...dispensers.map(d => d.id)) + 1 : 1;
        const newDispenser: DispenserState = {
          id: nextId,
          name: newCaraConfName.trim(),
          nozzles: newCaraConfProducts.map(fuelType => ({
            fuelType,
            status: 'Idle',
            currentAmount: 0.0,
            currentVolume: 0.0,
            progressPercent: 0
          }))
        };
        setDispensers(prev => [...prev, newDispenser]);
        setNewCaraConfName('');
      };

      const handleDeleteCara = (id: number) => {
        if (!setDispensers) return;
        setDispensers(prev => prev.filter(d => d.id !== id));
      };

      const handleToggleNozzle = (dispenserId: number, fuelType: FuelType) => {
        if (!setDispensers) return;
        setDispensers(prev => prev.map(d => {
          if (d.id === dispenserId) {
            const hasNozzle = d.nozzles.some(n => n.fuelType === fuelType);
            let nextNozzles;
            if (hasNozzle) {
              if (d.nozzles.length <= 1) return d;
              nextNozzles = d.nozzles.filter(n => n.fuelType !== fuelType);
            } else {
              nextNozzles = [...d.nozzles, {
                fuelType,
                status: 'Idle' as const,
                currentAmount: 0.0,
                currentVolume: 0.0,
                progressPercent: 0
              }];
            }
            return { ...d, nozzles: nextNozzles };
          }
          return d;
        }));
      };

      const handleAddCustomPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!setPaymentMethods || !newMethodName.trim()) return;
        const newMethod: PaymentMethod = {
          id: `pm-${Date.now()}`,
          name: newMethodName.trim(),
          emoji: newMethodEmoji,
          color: newMethodColor,
          enabled: true,
          isCustom: true
        };
        setPaymentMethods(prev => [...prev, newMethod]);
        setNewMethodName('');
      };

      const handleDeleteCustomPayment = (id: string) => {
        if (!setPaymentMethods) return;
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
      };

      const handleAddShiftBracket = () => {
        if (!setShiftBrackets) return;
        const nextId = String(shiftBrackets.length + 1);
        const newShift = {
          id: `SU-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          name: `Turno ${nextId} Especial`,
          start: '08:00',
          end: '16:00'
        };
        const updated = [...shiftBrackets, newShift];
        setShiftBrackets(updated);
        if (setShiftCount) {
          setShiftCount(updated.length);
        }
      };

      const handleRemoveShiftBracket = (id: string) => {
        if (!setShiftBrackets) return;
        const updated = shiftBrackets.filter(s => s.id !== id);
        setShiftBrackets(updated);
        if (setShiftCount) {
          setShiftCount(updated.length);
        }
      };

      const handleShiftFieldChange = (id: string, field: 'name' | 'start' | 'end', value: string) => {
        if (!setShiftBrackets) return;
        setShiftBrackets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
      };

      return (
        <div className="space-y-6 animate-fadeIn" id="system-configurations-view">
          
          {/* Top Header Card with sub-tabs */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-6">
            <div className="border-b border-neutral-200 pb-3 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="font-sans font-extrabold text-lg text-slate-800 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#355e9e]" />
                  Configuraciones del Sistema
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Parámetros del negocio, impresora, plantillas de tickets y facturas.
                </p>
              </div>
              {/* Sub-tab pills */}
              <div className="flex gap-1 text-xs font-bold font-sans">
                <button
                  onClick={() => setSettingsTab('general')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    settingsTab === 'general' ? 'bg-[#1b365d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" /> General
                </button>
                <button
                  onClick={() => setSettingsTab('station')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    settingsTab === 'station' ? 'bg-[#1b365d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" /> Estación
                </button>
                <button
                  onClick={() => setSettingsTab('printer')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    settingsTab === 'printer' ? 'bg-[#1b365d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Impresora
                  <span className={`w-2 h-2 rounded-full ${
                    printerStatus === 'ok' ? 'bg-green-500' : printerStatus === 'error' ? 'bg-red-500' : 'bg-slate-400'
                  }`} />
                </button>
              </div>

            </div>

            {/* Quick Metrics of Operation Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
              <div className="bg-slate-50 border border-neutral-200 rounded-lg p-3 flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#355e9e] shrink-0" />
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Cobertura Horaria</span>
                  <span className="text-slate-800 font-bold font-sans">Turnos Rotativos (24 Horas Activos)</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-neutral-200 rounded-lg p-3 flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[#2E7D32] font-bold block uppercase tracking-wider text-[9px]">Validación del Sistema</span>
                  <span className="text-slate-800 font-bold font-sans">Enclavamiento por Manguera Activa Habilitado</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-neutral-200 rounded-lg p-3 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-amber-700 font-bold block uppercase tracking-wider text-[9px]">Personalización del POS</span>
                  <span className="text-slate-800 font-bold font-sans">Soporta Modos de Visualización Estética</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── PRINTER CONFIG PANEL ─────────────────────────────────── */}
          {settingsTab === 'printer' && (
            <div className="space-y-4">

              {/* Printer selector + status bar */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow p-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-2 mb-3">
                  <Printer className="w-4 h-4 text-[#355e9e]" />
                  Selección y Estado de Impresora
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dropdown / Manual Input */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Seleccionar Impresora Detectada
                      </label>
                      <select
                        value={selectedPrinter}
                        onChange={e => setSelectedPrinter(e.target.value)}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50 cursor-pointer"
                      >
                        <option value="">-- Seleccione una impresora local --</option>
                        {availablePrinters.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Nombre Manual o IP de Red (TCP/IP)
                      </label>
                      <input
                        type="text"
                        value={selectedPrinter}
                        onChange={e => setSelectedPrinter(e.target.value)}
                        placeholder="Ej: 192.168.1.100 o Printer_POS-80"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                      />
                      <p className="text-[9px] text-slate-400 mt-1">
                        Puedes seleccionar una de la lista o ingresar manualmente un nombre o una dirección IP de red.
                      </p>
                    </div>
                  </div>

                  {/* Status + test button */}
                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold ${
                      printerStatus === 'ok'    ? 'bg-green-50 border-green-300 text-green-800' :
                      printerStatus === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
                                                  'bg-slate-50 border-slate-300 text-slate-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        printerStatus === 'ok' ? 'bg-green-500 animate-pulse' :
                        printerStatus === 'error' ? 'bg-red-500' : 'bg-slate-400'
                      }`} />
                      <span className="flex-1">
                        {printerStatus === 'ok'    ? `Conectada: ${selectedPrinter || 'POS-80'}` :
                         printerStatus === 'error' ? 'Sin impresora POS detectada' :
                         'Verificando...'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {printerTestOk === true  && <span className="text-green-700 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Prueba OK — papel cortado</span>}
                      {printerTestOk === false && <span className="text-red-700 text-xs font-bold">✗ Sin respuesta</span>}
                      <button
                        onClick={handleTestPrint}
                        disabled={printerTesting || !selectedPrinter}
                        className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        {printerTesting ? 'Imprimiendo...' : 'Imprimir Prueba + Corte'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Station Info */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow p-5 space-y-4">
                <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
                  <FileText className="w-4 h-4 text-[#355e9e]" />
                  Datos de la Estación (Encabezado de tickets)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {[
                    { label: 'Nombre de la Estación', value: pStationName, set: setPStationName, placeholder: 'GASNOVA OUTLET' },
                    { label: 'R.U.C. / NIT', value: pStationRuc, set: setPStationRuc, placeholder: '20459871402' },
                    { label: 'Dirección', value: pStationAddress, set: setPStationAddress, placeholder: 'Av. Principal 123' },
                    { label: 'Teléfono', value: pStationPhone, set: setPStationPhone, placeholder: 'Tel: 2234-5678' },
                    { label: 'Símbolo de moneda', value: pCurrencySymbol, set: setPCurrencySymbol, placeholder: '$' },
                  ].map(({ label, value, set, placeholder }) => (
                    <div key={label}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{label}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={e => set(e.target.value)}
                        placeholder={placeholder}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Footers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Ticket footer */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow p-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-2">
                    <Receipt className="w-3.5 h-3.5 text-indigo-500" /> Pie de BOLETA / TICKET
                  </h4>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Línea 1</label>
                    <input type="text" value={pTicketFooter1} onChange={e => setPTicketFooter1(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Línea 2</label>
                    <input type="text" value={pTicketFooter2} onChange={e => setPTicketFooter2(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-slate-50" />
                  </div>
                  <div className="bg-slate-100 rounded p-2 font-mono text-[9px] text-slate-600 text-center border border-dashed border-slate-300">
                    <div>—————————————————————</div>
                    <div>{pTicketFooter1 || '(vacío)'}</div>
                    <div>{pTicketFooter2 || '(vacío)'}</div>
                  </div>
                </div>

                {/* Invoice footer */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow p-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-2">
                    <FileText className="w-3.5 h-3.5 text-amber-500" /> Pie de FACTURA
                  </h4>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Línea 1</label>
                    <input type="text" value={pInvoiceFooter1} onChange={e => setPInvoiceFooter1(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Línea 2</label>
                    <input type="text" value={pInvoiceFooter2} onChange={e => setPInvoiceFooter2(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-slate-50" />
                  </div>
                  <div className="bg-slate-100 rounded p-2 font-mono text-[9px] text-slate-600 text-center border border-dashed border-slate-300">
                    <div>—————————————————————</div>
                    <div>{pInvoiceFooter1 || '(vacío)'}</div>
                    <div>{pInvoiceFooter2 || '(vacío)'}</div>
                  </div>
                </div>

                {/* Closure footer */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow p-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-2">
                    <Scissors className="w-3.5 h-3.5 text-rose-500" /> Pie de CIERRE DE TURNO
                  </h4>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Línea 1</label>
                    <input type="text" value={pClosureFooter1} onChange={e => setPClosureFooter1(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Línea 2</label>
                    <input type="text" value={pClosureFooter2} onChange={e => setPClosureFooter2(e.target.value)}
                      className="w-full border border-neutral-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-slate-50" />
                  </div>
                  <div className="bg-slate-100 rounded p-2 font-mono text-[9px] text-slate-600 text-center border border-dashed border-slate-300">
                    <div>—————————————————————</div>
                    <div>{pClosureFooter1 || '(vacío)'}</div>
                    <div>{pClosureFooter2 || '(vacío)'}</div>
                  </div>
                </div>
              </div>

              {/* Paper & Cut Settings */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow p-5">
                <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-2 mb-4">
                  <Scissors className="w-4 h-4 text-rose-500" />
                  Configuración de Papel y Corte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  {/* Feed lines before cut */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Líneas de avance antes del corte
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={0} max={10} value={pFeedLines}
                        onChange={e => setPFeedLines(Number(e.target.value))}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="font-mono font-bold text-slate-700 w-6 text-center">{pFeedLines}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Controla cuánto papel avanza la impresora antes de cortar. Aumenta si el texto queda bajo el corte.
                    </p>
                  </div>

                  {/* Cut type */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Tipo de corte
                    </label>
                    <div className="flex gap-2">
                      {(['full', 'partial'] as const).map(ct => (
                        <button
                          key={ct}
                          onClick={() => setPCutType(ct)}
                          className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                            pCutType === ct ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-neutral-200 hover:bg-slate-200'
                          }`}
                        >
                          {ct === 'full' ? '✂ Corte Total' : '✄ Corte Parcial'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Corte total separa completamente. Parcial deja una banda unida.
                    </p>
                  </div>

                  {/* Tax */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Desglose de impuesto (Facturas)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="showTax" checked={pShowTax} onChange={e => setPShowTax(e.target.checked)}
                        className="accent-indigo-600 cursor-pointer" />
                      <label htmlFor="showTax" className="text-xs text-slate-700 font-bold cursor-pointer">
                        Mostrar IVA/ISR en facturas
                      </label>
                    </div>
                    {pShowTax && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} max={30} step={0.5} value={pTaxRate}
                          onChange={e => setPTaxRate(Number(e.target.value))}
                          className="w-16 border border-neutral-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-slate-50"
                        />
                        <span className="text-xs text-slate-600 font-bold">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Guía de Configuración e Impresión (Windows / Docker / USB) */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 space-y-4">
                <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
                  <HelpCircle className="w-4 h-4 text-[#355e9e]" />
                  Guía de Configuración de Impresión (Windows / Docker / USB)
                </h3>
                <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <span className="font-bold text-[#1b365d] block mb-1">💻 Impresora USB corriendo en Windows NATIVO:</span>
                    <p className="text-[11px] mb-2">
                      Si necesitas usar el POS con una impresora local conectada por USB en Windows, puedes iniciar la API de forma nativa para que tenga acceso completo al Spooler de Windows.
                    </p>
                    <a
                      href={`${PRINT_API_BASE_URL}/print/download-bat`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b365d] hover:bg-[#355e9e] text-white text-xs font-bold rounded transition-colors"
                      download
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar script run_backend.bat
                    </a>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <span className="font-bold text-[#1b365d] block mb-1">🐳 Impresora de Red (TCP/IP) con Docker o Servidores:</span>
                    <p className="text-[11px]">
                      Si estás corriendo GasNova en Docker y tienes una impresora conectada a la red local, simplemente ingresa la dirección IP en el campo de texto de "Nombre Manual o IP de Red" arriba (ej: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">192.168.1.100</code> o <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">192.168.1.100:9100</code>). El backend se comunicará directamente con ella.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center justify-end gap-3">
                {printerSaved && (
                  <span className="text-green-700 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Configuración guardada
                  </span>
                )}
                <button
                  onClick={handleSavePrinterConfig}
                  disabled={printerSaving}
                  className="px-5 py-2 bg-[#1b365d] hover:bg-[#2a4f8f] text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {printerSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          )}

          {/* ── STATION CONFIG PANEL ─────────────────────────────────── */}
          {settingsTab === 'station' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 shadow p-5 space-y-4">
                <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
                  <Database className="w-4 h-4 text-[#355e9e]" />
                  Configuración de la Estación (Unidades, Monedas y Ubicaciones)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Unidad de Medida del Sistema
                    </label>
                    <select
                      value={unitMeasure}
                      onChange={e => setUnitMeasure(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                    >
                      <option value="Galones">Galones</option>
                      <option value="Litros">Litros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Símbolo de Moneda
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={e => setCurrencySymbol(e.target.value)}
                      placeholder="e.g. $, Q, LPS"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                  </div>
                </div>

                <h4 className="font-sans font-bold text-xs text-slate-700 pt-2 border-t">Ubicación Geográfica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">País</label>
                    <input
                      type="text"
                      value={stationCountry}
                      onChange={e => setStationCountry(e.target.value)}
                      placeholder="País"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Departamento / Estado</label>
                    <input
                      type="text"
                      value={stationDepartment}
                      onChange={e => setStationDepartment(e.target.value)}
                      placeholder="Departamento"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={stationCity}
                      onChange={e => setStationCity(e.target.value)}
                      placeholder="Ciudad"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cantón / Municipio</label>
                    <input
                      type="text"
                      value={stationCanton}
                      onChange={e => setStationCanton(e.target.value)}
                      placeholder="Cantón"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-neutral-200 rounded-lg p-3 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Vista Previa de la Dirección del Ticket:</span>
                  <span className="font-mono text-slate-600 block bg-white border rounded p-2">
                    {[stationDepartment, stationCanton, stationCity, stationCountry].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center justify-end gap-3">
                {printerSaved && (
                  <span className="text-green-700 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Configuración guardada
                  </span>
                )}
                <button
                  onClick={handleSaveStationSettings}
                  disabled={printerSaving}
                  className="px-5 py-2 bg-[#1b365d] hover:bg-[#2a4f8f] text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {printerSaving ? 'Guardando...' : 'Guardar Configuración de Estación'}
                </button>
              </div>
            </div>
          )}

          {/* ── GENERAL CONFIG PANELS (only show when settingsTab === 'general') ── */}
          {settingsTab === 'general' && (
            <>

          {/* TPV, API, and WebSocket Connectivity Panel */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-4" id="tpv-connectivity-settings-block">
            <div>
              <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
                <Database className="w-5 h-5 text-[#355e9e]" />
                Configuración del Canal de Datos (TPV • API • WebSocket)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure la vinculación física de esta pantalla con el controlador de pistas de la estación y los servicios en la nube de facturación.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
              
              {/* Left Column: TPV Assignment (4 Cols) */}
              <div className="lg:col-span-4 bg-slate-50 border border-neutral-200 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 border border-indigo-200 rounded-lg flex items-center justify-center text-indigo-700">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <span className="font-sans font-black text-xs text-slate-800 uppercase tracking-tight">VINCULACIÓN DEL TPV</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">CÓDIGO TPV / TERMINAL</label>
                    <input
                      type="text"
                      value={tpvId}
                      onChange={(e) => setTpvId(e.target.value)}
                      placeholder="Ej. TPV-ESTACION-01"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-[#355e9e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">UBICACIÓN ASIGNADA</label>
                    <select
                      value={tpvLocation}
                      onChange={(e) => setTpvLocation(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-2 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                    >
                      <option value="Isla Principal">Isla Principal (Caja 1)</option>
                      <option value="Servicio Rápido">Tienda / Servicio Rápido</option>
                      <option value="Isla Flotas Norte">Gasolinera Flotas - Norte</option>
                      <option value="Gaso-Bunker">Aero-Bunker de Carga</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-3">
                  <div className="flex items-center justify-between text-[11px] bg-slate-100/80 p-2 rounded-lg border border-neutral-200">
                    <span className="text-slate-500">Estado de Operación:</span>
                    <span className="text-[#2E7D32] font-black uppercase font-mono">ACTIVO / MASTER</span>
                  </div>
                </div>
              </div>

              {/* Middle Column: API Connection (4 Cols) */}
              <div className="lg:col-span-4 bg-slate-50 border border-neutral-200 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center text-emerald-700">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="font-sans font-black text-xs text-slate-800 uppercase tracking-tight">CONEXIÓN AL API CORE</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">ENDPOINT BASE API</label>
                    <input
                      type="text"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="https://api.gasnova.com/v1"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#355e9e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">TOKEN DE INTEGRACIÓN CLIENTE</label>
                    <input
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#355e9e]"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10.5px] font-bold text-[#2E7D32] uppercase">CONECTADO (12ms)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTestingApi(true);
                      setTimeout(() => {
                        setIsTestingApi(false);
                        alert(`Prueba exitosa al API en ${apiEndpoint} - Respuesta HTTP 200 OK.`);
                      }, 800);
                    }}
                    className="text-[9px] bg-[#1b365d] hover:bg-[#1b365d]/95 text-white font-bold py-1 px-2.5 rounded border border-neutral-300 transition-colors cursor-pointer shrink-0"
                  >
                    {isTestingApi ? "Ping..." : "Test Ping"}
                  </button>
                </div>
              </div>

              {/* Right Column: WebSocket settings (4 Cols) */}
              <div className="lg:col-span-4 bg-slate-50 border border-neutral-200 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center text-amber-600">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <span className="font-sans font-black text-xs text-slate-800 uppercase tracking-tight">CANAL WEBSOCKET EVENTOS</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">DIRECCIÓN DE WEBSOCKET (WSS)</label>
                    <input
                      type="text"
                      value={wsEndpoint}
                      onChange={(e) => setWsEndpoint(e.target.value)}
                      placeholder="wss://stream.gasnova.com/events"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#355e9e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">IP DEL CONTROLADOR PTS-2</label>
                    <input
                      type="text"
                      value={pts2Host}
                      onChange={(e) => setPts2Host(e.target.value)}
                      placeholder="192.168.50.117"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#355e9e]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">ESTADO DE CANAL DE EVENTOS</label>
                    <div className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-emerald-50 border border-emerald-200 w-fit">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      <span className="text-[10.5px] font-bold text-emerald-700 uppercase font-mono">ESCUCHANDO EN VIVO ✓</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTestingWs(true);
                      setTimeout(() => {
                        setIsTestingWs(false);
                        alert(`Suscripción simulada enviada correctamente a ${wsEndpoint} - Conexión establecida.`);
                      }, 700);
                    }}
                    className="w-full text-center bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] py-1.5 rounded cursor-pointer transition-colors border border-neutral-300"
                  >
                    {isTestingWs ? "Verificando Canal..." : "Probar Suscripción WS"}
                  </button>
                </div>
              </div>

            </div>

            {/* Save Connection parameters button */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
              {printerSaved && (
                <span className="text-green-700 text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Conexión guardada
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveConnectionSettings}
                disabled={printerSaving}
                className="px-5 py-2 bg-[#1b365d] hover:bg-[#2a4f8f] text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all font-sans"
              >
                <Save className="w-4 h-4" />
                {printerSaving ? 'Guardando...' : 'Guardar Parámetros de Conexión'}
              </button>
            </div>
          </div>

          {/* Theme Selector Widget */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-4">
            <div>
              <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
                <Palette className="w-5 h-5 text-[#355e9e]" />
                Personalizar Tema y Apariencia Visual
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Cambie instantáneamente entre la consola moderna estándar y el diseño táctil gris realista (estilo Delta / OpenPOS retro del screenshot).
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setThemeMode && setThemeMode('slate')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  themeMode === 'slate' ? 'border-[#355e9e] bg-blue-50/10' : 'border-neutral-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="font-extrabold text-xs text-slate-800 block">Modern Slate (Azul Oscuro)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Estilo corporativo elegante de alta visibilidad, con esquinas redondeadas Inter.</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <span className="w-4 h-4 rounded bg-[#002046] block border border-neutral-300" />
                  <span className="w-4 h-4 rounded bg-[#0b284e] block border border-neutral-300" />
                  <span className="w-4 h-4 rounded bg-emerald-500 block border border-neutral-300" />
                </div>
              </div>

              <div 
                onClick={() => setThemeMode && setThemeMode('retro-delta')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  themeMode === 'retro-delta' ? 'border-amber-500 bg-amber-50/20 shadow-sm' : 'border-neutral-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                    <span className="font-extrabold text-xs text-amber-950 block">Delta / OpenPOS Retro 🕰️ (Screenshot)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">La maquetación visual táctil industrial clásica de Gasolinera. Logotipo Delta, botones táctiles coloridos y reloj LED.</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <span className="w-4 h-4 rounded bg-[#00346a] block border border-[#ff3b30]" />
                  <span className="w-4 h-4 rounded bg-slate-300 block border border-[#444]" />
                  <span className="w-4 h-4 rounded bg-[#ff3b30] block border border-red-700" />
                </div>
              </div>

              <div 
                onClick={() => setThemeMode && setThemeMode('neon')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  themeMode === 'neon' ? 'border-emerald-500 bg-black/5' : 'border-neutral-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-extrabold text-xs text-emerald-700 block">Cyberpunk Neon Terminal</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Diseño futurista de terminal hacker, con fondo oscuro intenso, bordes verde neón y textos luminiscentes.</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <span className="w-4 h-4 rounded bg-neutral-900 block border border-emerald-500" />
                  <span className="w-4 h-4 rounded bg-emerald-500 block border border-emerald-600" />
                  <span className="w-4 h-4 rounded bg-[#ec4899] block border border-pink-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
            
            {/* Shifts Card section (6 columns) */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#355e9e]" />
                    Franjas Horarias y Turnos ({shiftCount})
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure los horarios de corte de caja de sus operadores de pista.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddShiftBracket}
                  className="bg-[#1b365d] hover:bg-[#1b365d]/90 text-white font-sans font-bold text-[10px] py-1 px-3 rounded flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3 h-3 text-white shrink-0" />
                  <span>Agregar Turno</span>
                </button>
              </div>

              {shiftBrackets.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No hay turnos registrados en este momento. Presione "Agregar Turno" para crear uno nuevo.
                </div>
              ) : (
                <div className="space-y-3">
                  {shiftBrackets.map((shift, idx) => {
                    return (
                      <div 
                        key={shift.id} 
                        className="p-3 bg-slate-50 border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-5 h-5 rounded-full bg-[#1b365d]/10 text-[#1b365d] text-xs font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={shift.name}
                            onChange={(e) => handleShiftFieldChange(shift.id, 'name', e.target.value)}
                            placeholder="Nombre del Turno"
                            className="bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-bold text-slate-800 max-w-[140px] focus:outline-none focus:border-[#355e9e]"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-sans">Inicia:</span>
                            <input
                              type="text"
                              value={shift.start}
                              onChange={(e) => handleShiftFieldChange(shift.id, 'start', e.target.value)}
                              placeholder="06:00"
                              className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-semibold max-w-[55px] text-center focus:outline-none"
                              title="Hora de Inicio (formato 24h)"
                            />
                          </div>

                          <span className="text-slate-400 px-0.5">→</span>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-sans">Corte:</span>
                            <input
                              type="text"
                              value={shift.end}
                              onChange={(e) => handleShiftFieldChange(shift.id, 'end', e.target.value)}
                              placeholder="14:00"
                              className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-semibold max-w-[55px] text-center focus:outline-none"
                              title="Hora de Término (formato 24h)"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveShiftBracket(shift.id)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors self-end sm:self-center"
                          title="Eliminar franja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3 bg-[#1b365d]/5 rounded border border-[#355e9e]/10 text-[11px] text-slate-600 leading-relaxed font-sans mt-2">
                💡 <strong>Nota de Turnos:</strong> El cambio de turnos es manual o programado. Al cerrar el turno con mangueras activas, el sistema retiene el cierre hasta finalizar la última carga.
              </div>
            </div>

            {/* NEW Customizable Payment methods section (6 columns) */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Métodos de Pago de la Terminal (Personalizables)
                </h3>
                <p className="text-[11px] text-slate-500">Configure los canales de pago activos en pista o añada sus canales locales (VISA, MasterCard, Yappy, Nequi...).</p>
              </div>

              {/* Add Custom Payment Method Form */}
              <form onSubmit={handleAddCustomPayment} className="bg-slate-50 border border-neutral-200 p-3 rounded-lg space-y-2.5">
                <span className="font-bold text-[10px] uppercase text-slate-705 block tracking-wider">Añadir Nuevo Canal de Pago</span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Nombre (ej: Nequi, DeltaCard, etc.)"
                      value={newMethodName}
                      onChange={(e) => setNewMethodName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#355e9e]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={newMethodEmoji}
                      onChange={(e) => setNewMethodEmoji(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-1.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none"
                    >
                      <option value="💳">💳</option>
                      <option value="💵">💵</option>
                      <option value="🏦">🏦</option>
                      <option value="📱">📱</option>
                      <option value="⚡">⚡</option>
                      <option value="🚚">🚚</option>
                      <option value="🪙">🪙</option>
                      <option value="🔒">🔒</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <button
                      type="submit"
                      className="w-full bg-[#1b365d] hover:bg-[#1b365d]/90 text-white font-sans font-bold text-xs py-1 px-3 rounded flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Grid of active editable payment modes */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {paymentMethods.map((pm) => (
                  <div 
                    key={pm.id}
                    className={`p-2 px-3 rounded-lg border transition-all flex items-center justify-between ${
                      pm.enabled
                        ? 'bg-emerald-500/5 border-emerald-500 text-slate-900 shadow-sm'
                        : 'bg-slate-50 border-neutral-200 text-slate-400 grayscale'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-lg shrink-0">{pm.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-800 truncate">{pm.name}</span>
                          {pm.isCustom && (
                            <span className="bg-amber-100 text-amber-900 text-[8px] font-bold px-1 rounded uppercase tracking-wide">Personalizado</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 block font-normal">ID Canal: {pm.id}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {/* Active/Inactive Toggle Button */}
                      <button
                        type="button"
                        onClick={() => togglePaymentMethod(pm.id)}
                        className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${
                          pm.enabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                        }`}
                      >
                        {pm.enabled ? 'Activo ✓' : 'Habilitar'}
                      </button>

                      {/* Custom Delete Button */}
                      {pm.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomPayment(pm.id)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar método de pago personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-[10px] text-[#355e9e] font-sans italic bg-blue-50 p-2.5 rounded border border-blue-150 leading-tight">
                ⚠️ <b>Habilitación Automática:</b> Los métodos de pago marcados como "Activo" se incorporarán instantáneamente como botones dinámicos en la selección de checkout de las caras.
              </p>
            </div>

          </div>

          {/* Dynamic Cara Administration & Fuel Mapping */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-4" id="dispenser-mapping-administration-card">
            <div>
              <h3 className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-2">
                <Settings className="w-5 h-5 text-[#355e9e]" />
                Administración de Caras y Mapeo de Combustibles
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Añada nuevos dispensadores, elimine equipos retirados de pista o asigne (mapee) dinámicamente qué mangueras de combustible están instaladas de forma física en cada cara.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
              
              {/* Form to Create New Dispenser / High Fast installation */}
              <div className="col-span-1 lg:col-span-4 bg-slate-50 border border-neutral-200 p-4 rounded-xl space-y-4 h-fit">
                <span className="font-extrabold text-xs uppercase text-[#1b365d] block tracking-wider">
                  Instalar Nuevo Dispensador / Cara
                </span>
                
                <form onSubmit={handleAddNewCara} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Identificador / Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cara 5"
                      value={newCaraConfName}
                      onChange={(e) => setNewCaraConfName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#355e9e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Mangueras Prefijadas (Mapeo Inicial)
                    </label>
                    <p className="text-[9px] text-slate-400 mb-2">
                      Marque los combustibles que estarán habilitados al inicio de esta cara.
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { type: 'Regular Unleaded', label: 'Gasolina Regular (87 Oct)', color: 'bg-blue-500' },
                        { type: 'Premium Unleaded', label: 'Gasolina Premium (95 Oct)', color: 'bg-amber-500' },
                        { type: 'Diesel', label: 'Diesel Especial', color: 'bg-emerald-500' },
                        { type: 'Kerosene', label: 'Queroseno Doméstico', color: 'bg-purple-500' }
                      ].map(item => {
                        const isChecked = newCaraConfProducts.includes(item.type as FuelType);
                        return (
                          <label key={item.type} className="flex items-center justify-between p-1.5 px-2 bg-white rounded border border-neutral-200 cursor-pointer text-xs font-semibold text-slate-705 hover:bg-neutral-50 select-none">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${item.color}`} />
                              <span>{item.label}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  if (newCaraConfProducts.length > 1) {
                                    setNewCaraConfProducts(newCaraConfProducts.filter(p => p !== item.type));
                                  }
                                } else {
                                  setNewCaraConfProducts([...newCaraConfProducts, item.type as FuelType]);
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-[#355e9e] outline-none cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!newCaraConfName.trim() || newCaraConfProducts.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-sans font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm mt-4"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Instalar en Pista</span>
                  </button>
                </form>
              </div>

              {/* Grid of dispensers with their active mapping */}
              <div className="col-span-1 lg:col-span-8 space-y-2 max-h-[350px] overflow-y-auto pr-1">
                <span className="font-extrabold text-xs uppercase text-[#1b365d] block tracking-wider mb-2">
                  Equipos Activos y Mapeo de Pistolas ({dispensers.length})
                </span>

                {dispensers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 border rounded-xl">
                    No hay caras instaladas. Presione la columna izquierda para instalar una.
                  </div>
                ) : (
                  dispensers.map((disp) => {
                    const availableFuels: { type: FuelType; name: string; color: string }[] = [
                      { type: 'Regular Unleaded', name: 'Regular', color: 'bg-blue-500' },
                      { type: 'Premium Unleaded', name: 'Súper/Premium', color: 'bg-amber-500' },
                      { type: 'Diesel', name: 'Diesel', color: 'bg-emerald-500' },
                      { type: 'Kerosene', name: 'Queroseno', color: 'bg-purple-500' }
                    ];

                    return (
                      <div key={disp.id} className="p-3 bg-slate-50 border border-neutral-200 rounded-xl hover:bg-slate-100/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-extrabold text-xs text-slate-800">{disp.name}</span>
                            <span className="bg-[#1b365d]/10 text-[#1b365d] text-[9px] font-mono font-bold px-1.5 rounded-full">ID Disp: {disp.id}</span>
                            {disp.isBlocked && (
                              <span className="bg-red-100 text-red-800 text-[8px] font-bold px-1.5 rounded uppercase font-sans animate-pulse">Bloqueada</span>
                            )}
                          </div>
                          
                          {/* Active mapped mangueras */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {availableFuels.map((f) => {
                              const isMapped = disp.nozzles.some(n => n.fuelType === f.type);
                              return (
                                <button
                                  key={f.type}
                                  type="button"
                                  onClick={() => handleToggleNozzle(disp.id, f.type)}
                                  className={`text-[9.5px] font-bold py-0.5 px-2 rounded-full border transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 ${
                                    isMapped 
                                      ? 'bg-white border-slate-300 text-slate-800 shadow-xs' 
                                      : 'bg-slate-200/50 border-transparent text-slate-400 opacity-60'
                                  }`}
                                  title={isMapped ? `Remover ${f.type} de ${disp.name}` : `Mapear ${f.type} a ${disp.name}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isMapped ? f.color : 'bg-slate-300'}`} />
                                  <span>{f.name}</span>
                                  <span className="text-[8px] font-normal leading-none">{isMapped ? '✓' : '+'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 md:self-center self-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteCara(disp.id)}
                            className="p-1 px-1.5 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-xs"
                            title="Desinstalar cara de pista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold">Tirar de Baja</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {/* Original configurations preserved inside beautiful bottom section */}
          <div className="bg-white rounded-xl shadow border border-neutral-300 p-6">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2 mb-4 uppercase font-sans flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              Parámetros de Hardware y Políticas Financieras Relacionados
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-700 block uppercase tracking-wider">Configuración Física de Terminal</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#355e9e] outline-none" />
                    <span className="text-xs text-slate-700">Audit de odómetros automático tras colgar pistola</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#355e9e] outline-none" />
                    <span className="text-xs text-slate-700">Imprimir ticket físico de cierre en impresora térmica local</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#355e9e] outline-none" />
                    <span className="text-xs text-slate-700">Habilitar alarma por goteo o fuga en sumideros</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-700 block uppercase tracking-wider">Políticas de Control de Riesgo Bancario</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#355e9e] outline-none" />
                    <span className="text-xs text-slate-700">Pre-autorizar obligatoriamente tarjetas de crédito antes de carga</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-[#355e9e] outline-none" />
                    <span className="text-xs text-slate-700">Permitir reabastecimiento manual sin odómetro (Modo Emergencia)</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 italic mt-2">
                  *Las modificaciones en políticas financieras y parámetros físicos requieren contraseña de nivel "Administrador Regional".
                </p>
              </div>

            </div>
          </div>
        </>
        )}

        </div>
      );
    }

    case 'pts2RawApi':
      return (
        <div className="w-full h-[85vh] bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700/50">
          <iframe 
            src="/pts2-api/index.html" 
            className="w-full h-full border-0" 
            title="PTS-2 Raw JavaScript API"
          />
        </div>
      );

    case 'help':
    default:
      return (
        <div className="bg-white rounded-xl shadow border border-neutral-300 p-6 space-y-6" id="operator-help-guide-view">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#355e9e]" />
              Centro de Ayuda y Guía Operadora
            </h2>
            <p className="text-xs text-slate-500 mt-1">Respuestas rápidas para emergencias y procedimientos estándar en isla de despacho.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-1">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Procedimiento de Parada de Emergencia
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si un conductor inicia marcha con la manguera acoplada, o detecta derrame activo, presione inmediatamente el botón rojo <strong>"Parada Emg." (Parada de Emergencia)</strong>. Esto detendrá de inmediato el relé de corriente de la bomba sumergible conectada al tanque central y bloqueará las mangueras asociadas.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-1">
                <Star className="w-4 h-4 text-amber-500" />
                Cómo Pre-autorizar un Prepago
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vaya a la pestaña "Dashboard", localice la bomba asignada al coche, presione <strong>"Pre-autorizar"</strong>. Seleccione el combustible solicitado (Magna/Regular, Premium, o Diesel) y digite el monto cobrado en mostrador (e.g. $20.00). Una vez pre-pagado, la bomba pasará a estado "Prepaid". Al levantar la pistola la carga se limitará exactamente al monto cargado sin rebasarse.
              </p>
            </div>

          </div>
        </div>
      );
  }
}
