/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CaraCard from './components/CaraCard';
import RecentTransactions from './components/RecentTransactions';
import PriceConfigTab from './components/PriceConfigTab';
import ShiftReportTab from './components/ShiftReportTab';
import InventoryTab from './components/InventoryTab';
import OtherTabs from './components/OtherTabs';
import { DispenserState, TankState, PriceConfig, ScheduledPrice, Transaction, ShiftAlert, ShiftDetails, FuelType, NozzleState, PaymentMethod, UserProfile, NozzleTransaction, PumpStatus } from './types';
import { INITIAL_DISPENSERS, INITIAL_TANKS, INITIAL_PRICES, INITIAL_SCHEDULED_PRICES, INITIAL_TRANSACTIONS, INITIAL_SHIFTS, INITIAL_USERS } from './data';
import { Play, Pause, AlertOctagon, HelpCircle, Check, X, Fuel, Info, Plus, Printer, FileText, Lock, Unlock, RefreshCw, Delete } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import UserHubTab from './components/UserHubTab';
import { api, printReceiptWindow } from './api';

const getShiftNameFromId = (id: string, shiftBrackets: any[]) => {
  if (!id) return 'Matutino';
  const parts = id.split('-');
  const lastPart = parts[parts.length - 1];
  const shiftNum = parseInt(lastPart, 10);
  if (isNaN(shiftNum)) return 'Matutino';
  const index = (shiftNum - 1) % shiftBrackets.length;
  const bracket = shiftBrackets[index];
  if (!bracket) return 'Matutino';
  return bracket.name.replace('Turno ', '');
};

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication & Users State Database
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_USERS[1]); // DEFAULT: John Doe
  const [pendingSwitchUser, setPendingSwitchUser] = useState<UserProfile | null>(null);
  const [quickSwitchPin, setQuickSwitchPin] = useState<string>('');
  const [quickSwitchError, setQuickSwitchError] = useState<string>('');

  // Primary state models
  const [dispensers, setDispensers] = useState<DispenserState[]>(INITIAL_DISPENSERS);
  const [tanks, setTanks] = useState<TankState[]>(INITIAL_TANKS);
  const [prices, setPrices] = useState<PriceConfig[]>(INITIAL_PRICES);
  const [scheduledPrices, setScheduledPrices] = useState<ScheduledPrice[]>(INITIAL_SCHEDULED_PRICES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [alerts, setAlerts] = useState<ShiftAlert[]>(INITIAL_SHIFTS);

  // Simulation play state
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // States for Nozzle pending transactions, modal & countdown scheduler
  const [consolidationSeconds, setConsolidationSeconds] = useState<number>(300);
  const [selectedNozzleForTrx, setSelectedNozzleForTrx] = useState<{ dispenserId: number; fuelType: FuelType } | null>(null);
  const [selectedNozzleTrx, setSelectedNozzleTrx] = useState<NozzleTransaction | null>(null);

  // Custom sub-dialog states for billing
  const [billingMode, setBillingMode] = useState<'none' | 'ticket' | 'invoice'>('none');
  const [invoiceClientName, setInvoiceClientName] = useState<string>('');
  const [invoiceClientRuc, setInvoiceClientRuc] = useState<string>('');
  const [billingSuccessDoc, setBillingSuccessDoc] = useState<{ type: 'ticket' | 'invoice'; tx: NozzleTransaction; docNumber: string; clientName?: string; clientRuc?: string } | null>(null);

  // Shift metadata state
  const [shiftDetails, setShiftDetails] = useState<ShiftDetails>({
    shiftId: 'SH-20240527-01',
    operatorName: 'John Doe',
    startTime: '22024-05-27 06:00 AM', // corrected to look like photo
    endTime: '2024-05-27 02:00 PM',
    status: 'Active',
  });
  const [nextShiftData, setNextShiftData] = useState<any>(null);

  // Active Pre-authorization dialog state
  const [preauthorizingPumpId, setPreauthorizingPumpId] = useState<number | null>(null);
  const [preauthFuelGrade, setPreauthFuelGrade] = useState<FuelType>('Regular Unleaded');
  const [preauthMode, setPreauthMode] = useState<'Limit' | 'Full' | 'Postpaid' | 'LiftInmediate'>('Limit');
  const [preauthAmount, setPreauthAmount] = useState<string>('20.00');

  // Create Cara/Dispenser Dialog modal state
  const [isAddCaraModalOpen, setIsAddCaraModalOpen] = useState<boolean>(false);
  const [newCaraName, setNewCaraName] = useState<string>('');
  const [newCaraProducts, setNewCaraProducts] = useState<FuelType[]>(['Regular Unleaded', 'Premium Unleaded', 'Diesel']);

  // Configuración de Turnos y Métodos de Pago
  const [shiftCount, setShiftCount] = useState<number>(3);

  // System Settings State
  const [unitMeasure, setUnitMeasure] = useState<'Galones' | 'Litros'>('Galones');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [stationCountry, setStationCountry] = useState('Guatemala');
  const [stationCity, setStationCity] = useState('Ciudad de Guatemala');
  const [stationCanton, setStationCanton] = useState('');
  const [stationDepartment, setStationDepartment] = useState('Guatemala');

  const fetchSystemSettings = () => {
    api.getSystemSettings().then(res => {
      if (res.ok && res.data) {
        const data = res.data;
        if (data.unit_measure) setUnitMeasure(data.unit_measure);
        if (data.currency_symbol) setCurrencySymbol(data.currency_symbol);
        if (data.station_country) setStationCountry(data.station_country);
        if (data.station_city) setStationCity(data.station_city);
        if (data.station_canton !== undefined) setStationCanton(data.station_canton);
        if (data.station_department) setStationDepartment(data.station_department);
      }
    });
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);
  const [shiftBrackets, setShiftBrackets] = useState([
    { id: '1', name: 'Turno Matutino', start: '06:00', end: '14:00' },
    { id: '2', name: 'Turno Vespertino', start: '14:00', end: '22:00' },
    { id: '3', name: 'Turno Nocturno', start: '22:00', end: '06:00' },
  ]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'Cash', name: 'Efectivo / Cash', emoji: '💵', color: 'emerald', enabled: true },
    { id: 'Credit Card', name: 'Tarjeta de Crédito', emoji: '💳', color: 'blue', enabled: true },
    { id: 'Debit Card', name: 'Tarjeta de Débito', emoji: '🏦', color: 'amber', enabled: true },
    { id: 'Fleet Card', name: 'Vales y Flotillas Corporativas', emoji: '🚚', color: 'slate', enabled: true }
  ]);
  const [themeMode, setThemeMode] = useState<string>('slate');

  const enabledPaymentMethods = paymentMethods.filter(p => p.enabled).map(p => p.id);

  // Cierre de Turno states
  const [isShiftClosing, setIsShiftClosing] = useState<boolean>(false);
  const [pendingMeters, setPendingMeters] = useState<{ [key: string]: string } | null>(null);
  const [showShiftReceipt, setShowShiftReceipt] = useState<boolean>(false);

  // Triggered when manual sync is requested from the footer
  const handleManualSync = () => {
    // Refresh transactions from database
    if (shiftDetails.shiftId) {
      api.getShiftTransactions(shiftDetails.shiftId).then(res => {
        if (res.ok && res.data) {
          setTransactions(res.data as Transaction[]);
        }
      });
    }

    // Refresh scheduled prices from PostgreSQL
    api.getScheduledPrices().then(res => {
      if (res.ok && res.data) {
        const mapped = res.data.map((item: any) => ({
          id: item.id,
          dateTime: item.date_time,
          fuelType: item.fuel_type as FuelType,
          newPrice: item.new_price,
          status: item.status as any
        }));
        setScheduledPrices(mapped);
      }
    });

    // Log manual sync event
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const syncAlert: ShiftAlert = {
      id: `AL-SYNC-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: 'SISTEMA',
      volume: '—',
      amount: '—',
      paymentType: 'Auto',
      message: `🔄 Sincronización manual completada con la base de datos PostgreSQL.`,
      isCustomNote: true
    };
    setAlerts(prev => [syncAlert, ...prev]);
  };

  // Pre-authorization handler
  const handlePreAuthorizeClick = (dispenserId: number, fuelType: FuelType) => {
    if (isShiftClosing) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errorAlert: ShiftAlert = {
        id: `AL-SH-PREAUTH-ERR-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Pistas`,
        volume: '—',
        amount: '—',
        paymentType: 'System',
        message: `🚫 Bloqueo de Cierre: No se permiten nuevas pre-autorizaciones durante el proceso de cierre de turno.`,
        isCustomNote: true
      };
      setAlerts(prev => [errorAlert, ...prev]);
      return;
    }

    // Check if Cara is already in use by another nozzle
    const disp = dispensers.find(d => d.id === dispenserId);
    if (disp) {
      const activeNozzle = disp.nozzles.find(n => n.status === 'Dispensing' || n.status === 'Prepaid' || n.status === 'Unpaid');
      if (activeNozzle && activeNozzle.fuelType !== fuelType) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const errorAlert: ShiftAlert = {
          id: `AL-ERR-${Math.random()}`,
          dateTime: `Hoy ${timeStr}`,
          pumpName: `Cara ${dispenserId}`,
          volume: '—',
          amount: '—',
          paymentType: 'System',
          message: `🚫 Enclavamiento: La Cara ${dispenserId} ya está ocupada con ${activeNozzle.fuelType}. La manguera de ${fuelType} permanecerá inactiva.`,
          isCustomNote: true
        };
        setAlerts(prev => [errorAlert, ...prev]);
        return;
      }
    }
    setPreauthorizingPumpId(dispenserId);
    setPreauthFuelGrade(fuelType);
    setPreauthMode('Limit');
    setPreauthAmount('20.00');
  };

  const handleConfirmPreauth = () => {
    if (preauthorizingPumpId === null) return;
    
    const valLimit = preauthMode === 'Limit' ? parseFloat(preauthAmount) : undefined;
    if (preauthMode === 'Limit' && (!valLimit || isNaN(valLimit) || valLimit <= 0)) {
      alert('Por favor ingrese un monto válido para pre-autorizar.');
      return;
    }

    setDispensers(prev => prev.map(d => {
      if (d.id === preauthorizingPumpId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === preauthFuelGrade) {
              const isDirect = preauthMode === 'LiftInmediate';
              return {
                ...n,
                status: isDirect ? 'Dispensing' : 'Prepaid',
                limitAmount: isDirect ? undefined : valLimit,
                isPostpaid: preauthMode === 'Postpaid' || isDirect,
                currentAmount: 0.0,
                currentVolume: 0.0,
                progressPercent: isDirect ? 1 : 0
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // Call backend to authorize the pump
    const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const nozzleIndex = fuelGrades.indexOf(preauthFuelGrade);
    const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;
    
    if (preauthMode === 'Postpaid' || preauthMode === 'LiftInmediate' || preauthMode === 'Full') {
      api.postpayAuthorizePump(preauthorizingPumpId, nozzleNumber);
    } else {
      api.authorizePump(
        preauthorizingPumpId,
        nozzleNumber,
        preauthMode === 'Limit' ? 'Amount' : undefined,
        preauthMode === 'Limit' ? valLimit : undefined
      );
    }

    // Add alert log
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const getModeLabel = () => {
      if (preauthMode === 'Postpaid') return 'Postpago (Servicio Libre)';
      if (preauthMode === 'LiftInmediate') return 'Autodespacho (Descolgar e Iniciar)';
      if (preauthMode === 'Limit') return `Prepago $${valLimit?.toFixed(2)}`;
      return 'Estanque Lleno (Full)';
    };

    const authNote: ShiftAlert = {
      id: `AL-AUTH-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${preauthorizingPumpId} (${preauthFuelGrade})`,
      volume: '0.00 Gal',
      amount: preauthMode === 'Postpaid' ? 'Postpago' : preauthMode === 'LiftInmediate' ? 'Autodespacho' : valLimit ? `$${valLimit.toFixed(2)}` : 'S/L',
      paymentType: preauthMode === 'Postpaid' ? 'Postpago' : preauthMode === 'LiftInmediate' ? 'Autodespacho' : 'Pre-auth',
      message: `Cara ${preauthorizingPumpId} autorizada para carga de ${preauthFuelGrade} (${getModeLabel()})`,
      isCustomNote: true
    };
    setAlerts(prev => [authNote, ...prev]);
    setPreauthorizingPumpId(null);
  };

  // Launch pre-authorized fuel load or simulate free refueling trigger
  const handleStartFuelingJob = (dispenserId: number, fuelType: FuelType) => {
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType && n.status === 'Prepaid') {
              return {
                ...n,
                status: 'Dispensing', // transitions to dispensing and starts count increment
                progressPercent: 0
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // Call backend start-dispensing logical endpoint
    api.startDispensing(dispenserId);
  };

  // Direct descolgar (lift) & start dispensing immediately (autoservicio)
  const handleDirectLiftAndStart = (dispenserId: number, fuelType: FuelType) => {
    if (isShiftClosing) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errorAlert: ShiftAlert = {
        id: `AL-SH-LIFT-ERR-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Pistas`,
        volume: '—',
        amount: '—',
        paymentType: 'System',
        message: `🚫 Bloqueo de Cierre: No se permite iniciar despachos directos durante el proceso de cierre de turno.`,
        isCustomNote: true
      };
      setAlerts(prev => [errorAlert, ...prev]);
      return;
    }

    // Check if Cara is already in use by another nozzle
    const disp = dispensers.find(d => d.id === dispenserId);
    if (disp) {
      const activeNozzle = disp.nozzles.find(n => n.status === 'Dispensing' || n.status === 'Prepaid' || n.status === 'Unpaid');
      if (activeNozzle && activeNozzle.fuelType !== fuelType) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const errorAlert: ShiftAlert = {
          id: `AL-LIFT-ERR-${Math.random()}`,
          dateTime: `Hoy ${timeStr}`,
          pumpName: `Cara ${dispenserId}`,
          volume: '—',
          amount: '—',
          paymentType: 'System',
          message: `🚫 Bloqueo Mecánico: No se puede activar la manguera de ${fuelType} en la Cara ${dispenserId} porque ya está activa la manguera de ${activeNozzle.fuelType}.`,
          isCustomNote: true
        };
        setAlerts(prev => [errorAlert, ...prev]);
        return;
      }
    }

    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType && (n.status === 'Idle' || n.status === 'Ready')) {
              return {
                ...n,
                status: 'Dispensing',
                isPostpaid: true, // Defaults to postpaid
                currentAmount: 0.0,
                currentVolume: 0.0,
                progressPercent: 1
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // Call backend to authorize postpaid and start dispensing
    const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const nozzleIndex = fuelGrades.indexOf(fuelType);
    const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;
    api.postpayAuthorizePump(dispenserId, nozzleNumber).then(() => {
      api.startDispensing(dispenserId);
    });

    // Add alert log
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const liftAlert: ShiftAlert = {
      id: `AL-LIFT-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${dispenserId} (${fuelType.split(' ')[0]})`,
      volume: '0.00 Gal',
      amount: 'Postpago',
      paymentType: 'Postpago',
      message: `⚡ Cara ${dispenserId}: Se ha descolgado la manguera de ${fuelType} - Iniciando despacho directo de combustible`,
      isCustomNote: true
    };
    setAlerts(prev => [liftAlert, ...prev]);
  };

  // Emergency Stop Handler (instant transition to Blocked)
  const handleEmergencyStopClick = (dispenserId: number, fuelType: FuelType) => {
    let stoppedAmount = 0;
    let stoppedVolume = 0;
    let wasDispensing = false;

    // First pass: capture current values from the dispensing nozzle
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType) {
              if (n.status === 'Dispensing') {
                wasDispensing = true;
                stoppedAmount = n.currentAmount;
                stoppedVolume = n.currentVolume;

                // Build pending transaction with what was dispensed so far
                const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const stopTrxId = `TRX-S${Math.floor(100 + Math.random() * 900)}`;
                const pendingTrx: NozzleTransaction = {
                  id: stopTrxId,
                  dateTime: `Hoy ${timeStr}`,
                  dispenserId,
                  volume: stoppedVolume,
                  amount: stoppedAmount,
                  fuelType,
                  status: 'Pending',
                  billingType: 'Ticket',
                  createdAt: Date.now()
                };

                // Reset nozzle to Idle and attach the pending transaction
                return {
                  ...n,
                  status: 'Idle' as PumpStatus,
                  currentAmount: 0,
                  currentVolume: 0,
                  progressPercent: 0,
                  isPostpaid: false,
                  limitAmount: undefined,
                  pendingTransactions: [...(n.pendingTransactions || []), pendingTrx]
                };
              }
              // Non-dispensing nozzle (e.g. Blocked) → just reset to Idle
              return {
                ...n,
                status: 'Idle' as PumpStatus,
                currentAmount: 0,
                currentVolume: 0,
                progressPercent: 0,
                isPostpaid: false,
                limitAmount: undefined
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // Call backend to trigger emergency stop
    api.emergencyStopPump(dispenserId);

    // Deduct dispensed volume from tank
    if (wasDispensing && stoppedVolume > 0) {
      setTanks(prevTanks => prevTanks.map(tank => {
        if (tank.fuelType === fuelType) {
          const nextLvl = Math.max(0, tank.currentLevel - stoppedVolume);
          return {
            ...tank,
            currentLevel: parseFloat(nextLvl.toFixed(1)),
            status: nextLvl < 3500 ? 'Low Level Alert' : 'OK'
          };
        }
        return tank;
      }));
    }

    // Add shift alert
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stopAlert: ShiftAlert = {
      id: `AL-EMG-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${dispenserId} (${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'})`,
      volume: wasDispensing ? `${stoppedVolume.toFixed(2)} Gal` : '0.00 Gal',
      amount: wasDispensing ? `$${stoppedAmount.toFixed(2)}` : '$0.00',
      paymentType: wasDispensing ? 'Hose Pend.' : 'S.O.S',
      message: wasDispensing
        ? `■ Despacho detenido manualmente en Cara ${dispenserId} (${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'}). ${stoppedVolume.toFixed(2)} Gal · $${stoppedAmount.toFixed(2)} agregados a despachos pendientes.`
        : `🛑 PARADA DE EMERGENCIA en Cara ${dispenserId} - Manguera ${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'} (sin despacho activo).`,
      isCustomNote: true
    };
    setAlerts(prev => [stopAlert, ...prev]);
  };

  // Unlock / reset pump to general Ready state
  const handleResetPumpClick = (dispenserId: number, fuelType: FuelType) => {
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType) {
              return {
                ...n,
                status: 'Idle',
                currentAmount: 0.0,
                currentVolume: 0.0,
                progressPercent: 0
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // Call backend to unlock pump
    api.unlockPump(dispenserId);

    // Shift Note log
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const resetNote: ShiftAlert = {
      id: `AL-RST-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${dispenserId}`,
      volume: '0.00 Gal',
      amount: '$0.00',
      paymentType: 'Reset',
      message: `Manguera ${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'} de la Cara ${dispenserId} desbloqueada y armada exitosamente.`,
      isCustomNote: true
    };
    setAlerts(prev => [resetNote, ...prev]);
  };

  // Add Dispenser dynamically (opens customize creation modal)
  const handleAddDispenser = () => {
    const nextId = dispensers.length > 0 ? Math.max(...dispensers.map(d => d.id)) + 1 : 1;
    setNewCaraName(`Cara ${nextId}`);
    setNewCaraProducts(['Regular Unleaded', 'Premium Unleaded', 'Diesel']);
    setIsAddCaraModalOpen(true);
  };

  // Confirm creation of Cara
  const handleConfirmAddCara = () => {
    if (!newCaraName.trim()) return;
    if (newCaraProducts.length === 0) return;

    const nextId = dispensers.length > 0 ? Math.max(...dispensers.map(d => d.id)) + 1 : 1;
    const newDispenser: DispenserState = {
      id: nextId,
      name: newCaraName.trim(),
      nozzles: newCaraProducts.map(fuelType => ({
        fuelType,
        status: 'Idle',
        currentAmount: 0.0,
        currentVolume: 0.0,
        progressPercent: 0
      }))
    };
    setDispensers(prev => [...prev, newDispenser]);

    // Note log
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const alertNote: ShiftAlert = {
      id: `AL-ADD-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: newCaraName.trim(),
      volume: '—',
      amount: '—',
      paymentType: 'System',
      message: `NUEVO DISPENSADOR INSTALADO: Se ha habilitado la ${newCaraName.trim()} con un total de ${newCaraProducts.length} mangueras (${newCaraProducts.map(fp => fp.split(' ')[0]).join(', ')}).`,
      isCustomNote: true
    };
    setAlerts(prev => [alertNote, ...prev]);
    setIsAddCaraModalOpen(false);
  };

  // Toggle Dispenser Global Block Handler
  const handleToggleBlockDispenser = (dispenserId: number) => {
    let nextState = false;
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        nextState = !d.isBlocked;
        return {
          ...d,
          isBlocked: nextState,
          nozzles: d.nozzles.map(n => {
            if (nextState) {
              return {
                ...n,
                status: n.status === 'Dispensing' ? 'Dispensing' : 'Blocked'
              };
            } else {
              return {
                ...n,
                status: n.status === 'Blocked' ? 'Idle' : n.status
              };
            }
          })
        };
      }
      return d;
    }));

    // Call backend to lock or unlock dispenser
    if (nextState) {
      api.lockPump(dispenserId);
    } else {
      api.unlockPump(dispenserId);
    }

    // Audit log update
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const blockMsg = nextState
      ? `🛑 Consola: Cara ${dispenserId} BLOQUEADA por seguridad del operador. Todas las mangueras inhabilitadas.`
      : `✓ Consola: Cara ${dispenserId} DESBLOQUEADA y re-armada de forma remota.`;

    const alertNote: ShiftAlert = {
      id: `AL-LCK-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${dispenserId}`,
      volume: '—',
      amount: '—',
      paymentType: 'System',
      message: blockMsg,
      isCustomNote: true
    };
    setAlerts(prev => [alertNote, ...prev]);
  };

  // Update customize nozzle list for a dispenser (1-4 products)
  const handleUpdateNozzles = (dispenserId: number, updatedNozzles: NozzleState[]) => {
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: updatedNozzles
        };
      }
      return d;
    }));

    // Log update
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const alertNote: ShiftAlert = {
      id: `AL-HOS-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${dispenserId}`,
      volume: '—',
      amount: '—',
      paymentType: 'System',
      message: `Configuración: Cara ${dispenserId} actualizada con ${updatedNozzles.length} producto(s): ${updatedNozzles.map(u => u.fuelType.split(' ')[0]).join(', ')}.`,
      isCustomNote: true
    };
    setAlerts(prev => [alertNote, ...prev]);
  };

  // Collect Postpaid Payment
  const handleCollectPayment = (
    dispenserId: number, 
    fuelType: FuelType, 
    paymentType: 'Credit Card' | 'Debit Card' | 'Cash' | 'Fleet Card'
  ) => {
    let collectedAmount = 0;
    let collectedVolume = 0;

    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType && n.status === 'Unpaid') {
              collectedAmount = n.currentAmount;
              collectedVolume = n.currentVolume;
              return {
                ...n,
                status: 'Idle',
                currentAmount: 0.0,
                currentVolume: 0.0,
                progressPercent: 0,
                isPostpaid: false
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // Register transaction with chosen payment method
    if (collectedAmount > 0) {
      completeFuelingJob(dispenserId, collectedVolume, collectedAmount, fuelType, paymentType);
      // Close transaction on backend
      api.closeTransaction(dispenserId);
      
      // Extra confirmation alert log
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const methodLabels = {
        'Cash': 'Efectivo',
        'Credit Card': 'Tarjeta de Crédito',
        'Debit Card': 'Tarjeta de Débito',
        'Fleet Card': 'Vale Corporativo / Flotas'
      };
      
      const customAlert: ShiftAlert = {
        id: `AL-PAID-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Cara ${dispenserId}`,
        volume: `${collectedVolume.toFixed(2)} Gal`,
        amount: `$${collectedAmount.toFixed(2)}`,
        paymentType: paymentType,
        message: `✓ Pago Recibido: Cobro de $${collectedAmount.toFixed(2)} liquidado con ${methodLabels[paymentType]} para la Cara ${dispenserId} (${fuelType}).`,
        isCustomNote: true
      };
      setAlerts(prev => [customAlert, ...prev]);
    }
  };

  // Add Fuel Tank dynamically
  const handleAddTank = (name: string, fuelType: FuelType, maxCapacity: number) => {
    const nextId = `T-${String(tanks.length + 1).padStart(2, '0')}`;
    const newTank: TankState = {
      id: nextId,
      name: name,
      fuelType,
      currentLevel: Math.round(maxCapacity * 0.5), // Starts 50% filled for immediate fidelity
      maxCapacity,
      recentDelivery: 'N/A',
      estDaysRemaining: 5,
      status: 'OK'
    };
    setTanks(prev => [...prev, newTank]);

    // Note alert log
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logItem: ShiftAlert = {
      id: `AL-ADD-TANK-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: nextId,
      volume: '—',
      amount: '—',
      paymentType: 'System',
      message: `NUEVO TANQUE REGISTRADO: Se ha dado de alta el tanque ${nextId} (${name}) para guardar ${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'} de hasta ${maxCapacity} Galones.`,
      isCustomNote: true
    };
    setAlerts(prev => [logItem, ...prev]);
  };

  // Price updates (Configurator Panel)
  const handleUpdatePrice = (fuelType: FuelType, newPrice: number) => {
    setPrices(prev => prev.map(p => {
      if (p.fuelType === fuelType) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          ...p,
          price: newPrice,
          lastUpdated: `Hoy ${timeStr}`
        };
      }
      return p;
    }));

    // Call backend to update prices on all dispensers
    const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const nozzleIndex = fuelGrades.indexOf(fuelType);
    const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;
    dispensers.forEach(d => {
      api.setPumpPrices(d.id, [{ nozzle: nozzleNumber, price: newPrice }]);
    });
  };

  // Adding programmed price plan
  const handleAddScheduledPrice = (dateTime: string, fuelType: FuelType, newPrice: number) => {
    const randomId = `SP-${Math.floor(100 + Math.random() * 900)}`;
    const newSchedule: ScheduledPrice = {
      id: randomId,
      dateTime,
      fuelType,
      newPrice,
      status: 'Pending'
    };
    setScheduledPrices(prev => [newSchedule, ...prev]);

    api.createScheduledPrice({
      id: randomId,
      date_time: dateTime,
      fuel_type: fuelType,
      new_price: newPrice
    }).then(res => {
      if (!res.ok) {
        console.error("Error al agendar precio en backend:", res.error);
      }
    });
  };

  const handleCancelScheduledPrice = (id: string) => {
    setScheduledPrices(prev => prev.map(sp => sp.id === id ? { ...sp, status: 'Cancelled' } : sp));

    api.cancelScheduledPrice(id).then(res => {
      if (!res.ok) {
        console.error("Error al cancelar precio programado en backend:", res.error);
      }
    });
  };

  // Inventory Replenish delivery function
  const handleRefillTank = (tankId: string, gallons: number) => {
    setTanks(prev => prev.map(t => {
      if (t.id === tankId) {
        const newLvl = Math.min(t.maxCapacity, t.currentLevel + gallons);
        const dayRemaining = newLvl >= 5000 ? 5 : newLvl >= 3000 ? 3 : 1;
        return {
          ...t,
          currentLevel: newLvl,
          recentDelivery: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${gallons} Gal)`,
          status: newLvl < 3500 ? 'Low Level Alert' : 'OK',
          estDaysRemaining: dayRemaining
        };
      }
      return t;
    }));

    // Save to PostgreSQL backend
    const liters = gallons * 3.78541;
    const tankNum = parseInt(tankId.replace('T-', '')) || 1;
    api.saveTankDelivery(tankNum, liters, undefined, 'Chofer Cisterna', 'TRUCK-109', `Recarga de ${gallons} Galones`).then(res => {
      if (res.ok) {
        console.log('Tank delivery persisted in Postgres successfully');
      }
    });
  };

  // Notes left during active shift
  const handleAddShiftNote = (text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const note: ShiftAlert = {
      id: `AL-CUSTOM-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: 'AUDIT',
      volume: '—',
      amount: '—',
      paymentType: 'Note',
      message: text,
      isCustomNote: true
    };
    setAlerts(prev => [note, ...prev]);
  };

  // Consolidate all pending nozzle transactions into the main transactions history
  const handleConsolidateAllPending = () => {
    let allNewTransactions: Transaction[] = [];
    
    setDispensers(prevDispensers => {
      return prevDispensers.map(d => {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.pendingTransactions && n.pendingTransactions.length > 0) {
              const formatted = n.pendingTransactions.map(pt => ({
                id: pt.id,
                dateTime: pt.dateTime,
                pumpId: d.id,
                pumpName: `Cara ${d.id} (${n.fuelType === 'Regular Unleaded' ? 'Regular' : n.fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'})`,
                volume: pt.volume,
                amount: pt.amount,
                fuelType: pt.fuelType,
                paymentType: pt.billingType || 'Auto-Lote'
              }));
              allNewTransactions.push(...formatted);
              return {
                ...n,
                pendingTransactions: []
              };
            }
            return n;
          })
        };
      });
    });

    if (allNewTransactions.length > 0) {
      setTransactions(prev => [...allNewTransactions, ...prev]);
      
      // Persist to PostgreSQL backend
      allNewTransactions.forEach(tx => {
        persistTransaction(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType);
      });

      // Update alerts with batch consolidated notification
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const summaryAlert: ShiftAlert = {
        id: `SYS-AL-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: 'SISTEMA',
        volume: `${allNewTransactions.reduce((acc, t) => acc + t.volume, 0).toFixed(1)} G`,
        amount: `$${allNewTransactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}`,
        paymentType: 'Auto-Batch',
        message: `Consolidación de ${allNewTransactions.length} despachos acumulados finalizada correctamente (Ciclo 5 min).`,
        isCustomNote: true
      };
      setAlerts(prev => [summaryAlert, ...prev]);
    }
    
    setConsolidationSeconds(300); // Reset timer
  };

  // 5 Minutos background auto consolidator clock effect
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isSimulating) {
      timerId = setInterval(() => {
        setConsolidationSeconds(prev => {
          if (prev <= 1) {
            // Execute consolidation asynchronously outside state transition to prevent nested updates
            setTimeout(() => {
              handleConsolidateAllPending();
            }, 10);
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isSimulating]);

  // Generate quick mock dispatch on dispenser nozzle for testing convenience
  const handleGenerateMockDispatch = (dispenserId: number, fuelType: FuelType) => {
    const randomTrxId = `TRX-${Math.floor(200 + Math.random() * 800)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Calculate volume based on price
    const unitPrice = prices.find(p => p.fuelType === fuelType)?.price || 4.19;
    const amount = parseFloat((30 + Math.random() * 40).toFixed(2));
    const volume = parseFloat((amount / unitPrice).toFixed(2));

    const mockTrx: NozzleTransaction = {
      id: randomTrxId,
      dateTime: `Simulado ${timeStr}`,
      dispenserId,
      volume,
      amount,
      fuelType,
      status: 'Pending',
      billingType: 'Ticket',
      createdAt: Date.now()
    };

    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType) {
              return {
                ...n,
                pendingTransactions: [...(n.pendingTransactions || []), mockTrx]
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // Trigger alert
    const newAlertItem: ShiftAlert = {
      id: `AL-MOCK-${Math.random()}`,
      dateTime: `Simulado ${timeStr}`,
      pumpName: `Cara ${dispenserId}`,
      volume: `${volume.toFixed(2)} Gal`,
      amount: `$${amount.toFixed(2)}`,
      paymentType: 'Auto-Sim.',
      message: `Despacho de prueba generado en manguera ${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'}.`,
    };
    setAlerts(prev => [newAlertItem, ...prev]);
  };

  // Process single pending nozzle transaction manually
  const handleProcessSingleNozzleTrx = (
    dispenserId: number,
    fuelType: FuelType,
    trxId: string,
    billingType: 'Ticket' | 'Factura' = 'Ticket',
    clientName?: string,
    clientRuc?: string
  ) => {
    let processedTrx: NozzleTransaction | null = null;
    
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType) {
              const trxs = n.pendingTransactions || [];
              const target = trxs.find(t => t.id === trxId);
              if (target) {
                processedTrx = { ...target, status: 'Processed', billingType };
              }
              return {
                ...n,
                pendingTransactions: trxs.filter(t => t.id !== trxId)
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    if (processedTrx) {
      const pTx = processedTrx as NozzleTransaction;
      const formatted: Transaction = {
        id: pTx.id,
        dateTime: pTx.dateTime,
        pumpId: dispenserId,
        pumpName: `Cara ${dispenserId} (${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'})`,
        volume: pTx.volume,
        amount: pTx.amount,
        fuelType: pTx.fuelType,
        paymentType: billingType === 'Factura' ? 'Credit Card' : 'Cash' // Map paymentType
      };

      setTransactions(prev => [formatted, ...prev]);

      // Persist to PostgreSQL backend
      persistTransaction(dispenserId, pTx.id, pTx.fuelType, pTx.volume, pTx.amount, formatted.paymentType);

      // Trigger safety log note
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const verifyNote: ShiftAlert = {
        id: `SYS-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Cara ${dispenserId}`,
        volume: `${pTx.volume.toFixed(1)} Gal`,
        amount: `$${pTx.amount.toFixed(2)}`,
        paymentType: billingType === 'Factura' ? 'Factura' : 'Ticket',
        message: `Despacho ${pTx.id} procesado individualmente como ${billingType === 'Factura' ? `Factura (RUC: ${clientRuc || '—'})` : 'Ticket de Venta'}.`,
        isCustomNote: true
      };
      setAlerts(prev => [verifyNote, ...prev]);
    }
  };

  // Process all pending transactions of a specific nozzle
  const handleProcessAllNozzleTrxs = (dispenserId: number, fuelType: FuelType) => {
    let newTransactions: Transaction[] = [];
    
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType) {
              const trxs = n.pendingTransactions || [];
              const formatted = trxs.map(pt => ({
                id: pt.id,
                dateTime: pt.dateTime,
                pumpId: d.id,
                pumpName: `Cara ${d.id} (${n.fuelType === 'Regular Unleaded' ? 'Regular' : n.fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'})`,
                volume: pt.volume,
                amount: pt.amount,
                fuelType: pt.fuelType,
                paymentType: 'Cash' as const
              }));
              newTransactions.push(...formatted);
              return {
                ...n,
                pendingTransactions: []
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    if (newTransactions.length > 0) {
      setTransactions(prev => [...newTransactions, ...prev]);

      // Persist to PostgreSQL backend
      newTransactions.forEach(tx => {
        persistTransaction(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType);
      });

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const summaryAlert: ShiftAlert = {
        id: `SYS-AL-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Cara ${dispenserId}`,
        volume: `${newTransactions.reduce((acc, t) => acc + t.volume, 0).toFixed(1)} G`,
        amount: `$${newTransactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}`,
        paymentType: 'Manguera-Batch',
        message: `Vaciado y procesamiento de lote completo (${newTransactions.length} despachos) de la manguera finalizado correctamente por el operador.`,
        isCustomNote: true
      };
      setAlerts(prev => [summaryAlert, ...prev]);
    }
  };

  // Keep active shift operator synchronized with logged-in user
  useEffect(() => {
    if (currentUser) {
      setShiftDetails(prev => ({
        ...prev,
        operatorName: currentUser.name
      }));
    }
  }, [currentUser]);

  // Polling effect to sync with the backend
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      // Polling status of dispensers
      for (const disp of dispensers) {
        const res = await api.getPumpStatus(disp.id);
        if (!active) return;
        if (res.ok && res.status) {
          const backendStatus = res.status;
          const nozzleId = backendStatus.nozzle || 1;
          const volume = backendStatus.volume || 0;
          const amount = backendStatus.amount || 0;

          setDispensers(prev => prev.map(d => {
            if (d.id === disp.id) {
              return {
                ...d,
                nozzles: d.nozzles.map((n, idx) => {
                  const isTargetNozzle = (idx + 1) === nozzleId;
                  if (isTargetNozzle) {
                    let mappedStatus = n.status;
                    if (backendStatus.status === 'PumpIdleStatus') {
                      mappedStatus = 'Idle';
                    } else if (backendStatus.status === 'PumpFillingStatus') {
                      mappedStatus = 'Dispensing';
                    } else if (backendStatus.status === 'PumpEndOfTransactionStatus') {
                      mappedStatus = 'Unpaid';
                    } else if (backendStatus.status === 'PumpOfflineStatus') {
                      mappedStatus = 'Blocked';
                    }
                    
                    return {
                      ...n,
                      status: mappedStatus,
                      currentAmount: amount,
                      currentVolume: volume,
                      progressPercent: backendStatus.status === 'PumpFillingStatus' ? Math.min(99, Math.round((volume / 15) * 100)) : n.progressPercent
                    };
                  }
                  return n;
                })
              };
            }
            return d;
          }));
        }
      }

      // Fetch tank levels (convert Liters to Gallons)
      const tankRes = await api.getProbeMeasurements();
      if (!active) return;
      if (tankRes.ok && tankRes.measurements) {
        setTanks(prev => prev.map(t => {
          const matchId = t.id === 'T-01' ? 1 : t.id === 'T-02' ? 2 : t.id === 'T-03' ? 3 : 0;
          const meas = tankRes.measurements?.find(m => m.tank_id === matchId);
          if (meas && meas.volume !== undefined) {
            const gallons = parseFloat((meas.volume / (unitMeasure === 'Litros' ? 1.0 : 3.78541)).toFixed(1));
            return {
              ...t,
              currentLevel: gallons,
              status: (gallons / t.maxCapacity) < 0.15 ? 'Low Level Alert' : 'OK'
            };
          }
          return t;
        }));
      }

      // Fetch scheduled prices to check if any transitioned from Pending to Applied
      const schedRes = await api.getScheduledPrices();
      if (!active) return;
      if (schedRes.ok && schedRes.data) {
        const mapped = schedRes.data.map((item: any) => ({
          id: item.id,
          dateTime: item.date_time,
          fuelType: item.fuel_type as FuelType,
          newPrice: item.new_price,
          status: item.status as any
        }));

        setScheduledPrices(prev => {
          mapped.forEach((newSp: any) => {
            const oldSp = prev.find(p => p.id === newSp.id);
            if (oldSp && oldSp.status === 'Pending' && newSp.status === 'Applied') {
              // Update fuel price locally
              setPrices(currentPrices => currentPrices.map(p => 
                p.fuelType === newSp.fuelType 
                  ? { ...p, price: newSp.newPrice, lastUpdated: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` } 
                  : p
              ));

              // Add a shift alert
              const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const newAlert: ShiftAlert = {
                id: `AL-SCHED-APP-${Math.random()}`,
                dateTime: `Hoy ${timeStr}`,
                pumpName: 'SISTEMA',
                volume: '0.00 Gal',
                amount: `$0.00`,
                paymentType: 'Auto',
                message: `Precio programado aplicado para ${newSp.fuelType}: $${newSp.newPrice.toFixed(2)}/Gal`,
                isCustomNote: true
              };
              setAlerts(currentAlerts => [newAlert, ...currentAlerts]);
            }
          });
          return mapped;
        });
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [dispensers]);

  // 5-minute auto-consolidation logic per individual transaction
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const expiredTransactions: NozzleTransaction[] = [];

      setDispensers(prev => {
        let changed = false;
        const next = prev.map(d => {
          let dispenserChanged = false;
          const nextNozzles = d.nozzles.map(n => {
            const trxs = n.pendingTransactions || [];
            if (trxs.length === 0) return n;

            // Filter out transactions that have been pending for >= 5 minutes (300 seconds)
            const expiredInNozzle = trxs.filter(t => {
              const created = t.createdAt || now;
              return now - created >= 300000; // 5 minutes in milliseconds
            });

            if (expiredInNozzle.length > 0) {
              expiredTransactions.push(...expiredInNozzle);
              dispenserChanged = true;
              changed = true;
              return {
                ...n,
                pendingTransactions: trxs.filter(t => !expiredInNozzle.some(exp => exp.id === t.id))
              };
            }
            return n;
          });

          if (dispenserChanged) {
            return { ...d, nozzles: nextNozzles };
          }
          return d;
        });

        return changed ? next : prev;
      });

      if (expiredTransactions.length > 0) {
        // Add all expired ones to the active shift history transactions
        const nowObj = new Date();
        const timeStr = nowObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const formattedTrxs: Transaction[] = expiredTransactions.map(pTx => {
          return {
            id: pTx.id,
            dateTime: `Autoconsol. ${timeStr}`,
            pumpId: pTx.dispenserId,
            pumpName: `Cara ${pTx.dispenserId} (${pTx.fuelType === 'Regular Unleaded' ? 'Regular' : pTx.fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'})`,
            volume: pTx.volume,
            amount: pTx.amount,
            fuelType: pTx.fuelType,
            paymentType: 'Cash' // Default auto-consolidation payment method
          };
        });

        setTransactions(prev => [...formattedTrxs, ...prev]);

        // Persist all auto-consolidated transactions to backend
        formattedTrxs.forEach(tx => {
          persistTransaction(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType);
        });

        // Trigger safety alert log for each auto-consolidation
        expiredTransactions.forEach(pTx => {
          const autoAlert: ShiftAlert = {
            id: `AL-AUTO-${Math.random()}`,
            dateTime: `Hoy ${timeStr}`,
            pumpName: `Cara ${pTx.dispenserId}`,
            volume: `${pTx.volume.toFixed(1)} G`,
            amount: `$${pTx.amount.toFixed(2)}`,
            paymentType: 'Auto-Cons.',
            message: `Despacho ${pTx.id} consolidado automáticamente (tiempo límite de 5 min por despacho superado).`,
            isCustomNote: true
          };
          setAlerts(prev => [autoAlert, ...prev]);
        });
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, []);

  // Load users, active shift, and scheduled prices from backend on mount
  useEffect(() => {
    api.getUsers().then(res => {
      if (res.ok && res.data) {
        setUsers(res.data);
      }
    });

    api.getShifts().then(res => {
      if (res.ok && res.data) {
        const active = res.data.find((s: any) => s.status === 'Active');
        if (active) {
          setShiftDetails({
            shiftId: active.shift_id,
            operatorName: active.operator_name,
            startTime: active.start_time || 'N/A',
            endTime: '',
            status: 'Active'
          });

          // Cargar las transacciones del turno activo desde la base de datos
          api.getShiftTransactions(active.shift_id).then(tRes => {
            if (tRes.ok && tRes.data) {
              setTransactions(tRes.data as Transaction[]);
            } else {
              // Si falla o está vacío, iniciar con un arreglo vacío
              setTransactions([]);
            }
          });
        }
      }
    });

    api.getScheduledPrices().then(res => {
      if (res.ok && res.data) {
        const mapped = res.data.map((item: any) => ({
          id: item.id,
          dateTime: item.date_time,
          fuelType: item.fuel_type as FuelType,
          newPrice: item.new_price,
          status: item.status as any
        }));
        setScheduledPrices(mapped);
      }
    });
  }, []);

  // User Management callbacks
  const handleAddUser = (newUser: Omit<UserProfile, 'id'>) => {
    api.createUser(newUser).then(res => {
      if (res.ok && res.data) {
        const createdUser: UserProfile = {
          id: res.data.id,
          name: res.data.name,
          username: res.data.username,
          role: res.data.role as any,
          avatar: res.data.avatar || '👤',
          pin: newUser.pin, // retain pin locally
          status: res.data.status as any
        };
        setUsers(prev => [...prev, createdUser]);
      } else {
        // Fallback local check
        const nextId = `U-${String(users.length + 1).padStart(2, '0')}`;
        const user: UserProfile = {
          id: nextId,
          ...newUser
        };
        setUsers(prev => [...prev, user]);
      }
    });
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    api.deleteUser(userId).then(res => {
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        // Fallback local check
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPendingSwitchUser(null);
    setQuickSwitchPin('');
    setQuickSwitchError('');
  };

  const handleQuickSwitchInitiate = (user: UserProfile) => {
    setPendingSwitchUser(user);
    setQuickSwitchPin('');
    setQuickSwitchError('');
  };

  const handleQuickSwitchPinSubmit = () => {
    if (!pendingSwitchUser) return;

    api.verifyUserPin(pendingSwitchUser.username, quickSwitchPin).then(res => {
      if (res.ok && res.data) {
        setCurrentUser(pendingSwitchUser);
        setPendingSwitchUser(null);
        setQuickSwitchPin('');
        setQuickSwitchError('');
      } else {
        // Fallback local check if connection failed (network error)
        if (!res.ok && (!res.error || !res.error.startsWith('API error'))) {
          if (pendingSwitchUser.pin === quickSwitchPin) {
            setCurrentUser(pendingSwitchUser);
            setPendingSwitchUser(null);
            setQuickSwitchPin('');
            setQuickSwitchError('');
          } else {
            setQuickSwitchError('Código PIN inválido. Intente de nuevo.');
            setQuickSwitchPin('');
          }
        } else {
          // Reached API but PIN was incorrect
          setQuickSwitchError('Código PIN inválido. Intente de nuevo.');
          setQuickSwitchPin('');
        }
      }
    });
  };

  // Submit automatically when input gets to 4 digits inside the quick switcher modal
  useEffect(() => {
    if (pendingSwitchUser && quickSwitchPin.length === 4) {
      const t = setTimeout(() => {
        handleQuickSwitchPinSubmit();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [quickSwitchPin, pendingSwitchUser]);

  const executeShiftClosureFinal = (meters: { [key: string]: string }) => {
    const expiredTransactions: Transaction[] = [];

    // 1. Block all dispensers and collect pending transfers
    setDispensers(prev => prev.map(d => {
      return {
        ...d,
        isBlocked: true,
        nozzles: d.nozzles.map(n => {
          const trxs = n.pendingTransactions || [];
          trxs.forEach(pt => {
            expiredTransactions.push({
              id: pt.id,
              dateTime: pt.dateTime,
              pumpId: d.id,
              pumpName: `Cara ${d.id} (${n.fuelType === 'Regular Unleaded' ? 'Regular' : n.fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'})`,
              volume: pt.volume,
              amount: pt.amount,
              fuelType: pt.fuelType,
              paymentType: 'Cash'
            });
          });
          return {
            ...n,
            status: 'Blocked',
            pendingTransactions: []
          };
        })
      };
    }));

    if (expiredTransactions.length > 0) {
      setTransactions(prev => [...expiredTransactions, ...prev]);

      // Persist to PostgreSQL backend
      expiredTransactions.forEach(tx => {
        persistTransaction(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType);
      });
    }

    // 2. Set shift status to 'Closed' and call closeShift in backend
    const endTimeStr = new Date().toLocaleString();
    setShiftDetails(prev => ({
      ...prev,
      status: 'Closed',
      endTime: endTimeStr
    }));

    // Calculate totals for physical print closure receipt (combining regular and expired transactions)
    const allShiftTransactions = [...expiredTransactions, ...transactions];
    const regularSales = allShiftTransactions.filter(t => t.fuelType === 'Regular Unleaded');
    const premiumSales = allShiftTransactions.filter(t => t.fuelType === 'Premium Unleaded');
    const dieselSales = allShiftTransactions.filter(t => t.fuelType === 'Diesel');

    const regularVol = regularSales.reduce((sum, t) => sum + t.volume, 0);
    const regularAmt = regularSales.reduce((sum, t) => sum + t.amount, 0);
    const premiumVol = premiumSales.reduce((sum, t) => sum + t.volume, 0);
    const premiumAmt = premiumSales.reduce((sum, t) => sum + t.amount, 0);
    const dieselVol = dieselSales.reduce((sum, t) => sum + t.volume, 0);
    const dieselAmt = dieselSales.reduce((sum, t) => sum + t.amount, 0);

    const totalSales = allShiftTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalVolume = allShiftTransactions.reduce((sum, t) => sum + t.volume, 0);
    const transactionCount = allShiftTransactions.length;

    const fuelBreakdown = [
      { fuel_type: 'Regular Unleaded', volume: regularVol, amount: regularAmt },
      { fuel_type: 'Premium Unleaded', volume: premiumVol, amount: premiumAmt },
      { fuel_type: 'Diesel', volume: dieselVol, amount: dieselAmt }
    ];

    const paymentBreakdown = [
      { method: 'Tarjeta', amount: allShiftTransactions.filter(t => t.paymentType !== 'Cash').reduce((sum, t) => sum + t.amount, 0) },
      { method: 'Efectivo', amount: allShiftTransactions.filter(t => t.paymentType === 'Cash').reduce((sum, t) => sum + t.amount, 0) }
    ];

    // Trigger physical print of shift closure
    const closedShiftName = getShiftNameFromId(shiftDetails.shiftId, shiftBrackets);
    api.printClosure({
      shift_id:          shiftDetails.shiftId,
      shift_name:        closedShiftName,
      operator_name:     shiftDetails.operatorName,
      start_time:        shiftDetails.startTime,
      end_time:          endTimeStr,
      total_sales:       totalSales,
      total_volume:      totalVolume,
      transaction_count: transactionCount,
      fuel_breakdown:    fuelBreakdown,
      payment_breakdown: paymentBreakdown
    }).catch(err => console.error("Error printing physical closure:", err));

    api.closeShift(shiftDetails.shiftId, shiftDetails.operatorName, endTimeStr).then(res => {
      if (res.ok && res.data) {
        setNextShiftData(res.data.new_shift);
        // Automatically print next shift ticket!
        if (res.data.new_shift) {
          const nextShiftName = getShiftNameFromId(res.data.new_shift.shift_id, shiftBrackets);
          api.printNextShift({
            shift_id:            res.data.new_shift.shift_id,
            shift_name:          nextShiftName,
            previous_shift_id:   shiftDetails.shiftId,
            previous_shift_name: closedShiftName,
            operator_name:       res.data.new_shift.operator_name,
            start_time:          res.data.new_shift.start_time
          }).catch(err => console.error("Error printing physical next shift:", err));
        }
      }
    });

    // 3. Clear closing temporary states
    setIsShiftClosing(false);

    // 4. Register closure alert in log
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add custom note log if some transactions were forced down
    const forcedMsg = expiredTransactions.length > 0 
      ? ` y se liquidaron automáticamente ${expiredTransactions.length} despacho(s) pendiente(s) de manguera a caja.`
      : '.';

    const customAlert: ShiftAlert = {
      id: `AL-SH-CLOSED-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Sistema`,
      volume: '—',
      amount: expiredTransactions.length > 0 ? `$${expiredTransactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}` : '—',
      paymentType: 'System',
      message: `🔒 Cierre de Turno Exitoso: Se han bloqueado todas las caras de despacho de forma automática${forcedMsg}`,
      isCustomNote: true
    };
    setAlerts(prev => [customAlert, ...prev]);

    // 5. Open the modal at the top level
    setShowShiftReceipt(true);
  };

  const handleCloseShift = (manualMeters: { [key: string]: string }) => {
    // Check if any dispenser has an active nozzle in 'Dispensing' state
    const currentlyDispensingCount = dispensers.reduce((cnt, d) => {
      return cnt + d.nozzles.filter(n => n.status === 'Dispensing').length;
    }, 0);

    // Save manual meters entered by the operator
    setPendingMeters(manualMeters);

    if (currentlyDispensingCount > 0) {
      // Enter "Waiting to complete" state
      setIsShiftClosing(true);
      
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const customAlert: ShiftAlert = {
        id: `AL-SH-PRE-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Pistas`,
        volume: '—',
        amount: '—',
        paymentType: 'System',
        message: `⏳ Cierre de Turno Retenido: Esperando que finalicen las ${currentlyDispensingCount} manguera(s) que están despachando...`,
        isCustomNote: true
      };
      setAlerts(prev => [customAlert, ...prev]);
    } else {
      // No active dispensing. Complete close procedure immediately!
      executeShiftClosureFinal(manualMeters);
    }
  };

  // Monitor when isShiftClosing is true and count of dispensing nozzles becomes 0
  useEffect(() => {
    if (!isShiftClosing) return;

    const currentlyDispensingCount = dispensers.reduce((cnt, d) => {
      return cnt + d.nozzles.filter(n => n.status === 'Dispensing').length;
    }, 0);

    if (currentlyDispensingCount === 0) {
      executeShiftClosureFinal(pendingMeters || {});
    }
  }, [dispensers, isShiftClosing, pendingMeters]);

  // Global Engine looping simulated increments for 'Dispensing' or 'Fueling' pumps
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setDispensers(prevDispensers => {
        let isUpdated = false;
        const nextDispensers = prevDispensers.map(d => {
          let hasDispensingNozzle = false;
          const nextNozzles = d.nozzles.map(n => {
            if (n.status === 'Dispensing') {
              isUpdated = true;
              hasDispensingNozzle = true;
              
              // Get current price
              const activePriceObj = prices.find(p => p.fuelType === n.fuelType);
              const activePrice = activePriceObj ? activePriceObj.price : 4.19;

              // Random increments per simulated 1.2s tick
              const amountIncrement = parseFloat((Math.random() * 2.2 + 0.5).toFixed(2));
              const targetAmount = n.currentAmount + amountIncrement;
              const targetVolume = targetAmount / activePrice;

              // Compute percent
              let progress = Math.min(100, n.progressPercent + Math.round(Math.random() * 15 + 5));

              // Check if postpaid flow is completed → add to pending dispatches, reset to Idle
              if (n.isPostpaid && targetVolume >= 10.5 + (d.id * 1.5)) {
                const finalAmount = parseFloat(targetAmount.toFixed(2));
                const finalVolume = parseFloat(targetVolume.toFixed(3));
                setTimeout(() => {
                  completeFuelingJob(d.id, finalVolume, finalAmount, n.fuelType);
                }, 10);
                return {
                  ...n,
                  currentAmount: 0,
                  currentVolume: 0,
                  status: 'Idle' as PumpStatus,
                  progressPercent: 0,
                  isPostpaid: false,
                  limitAmount: undefined
                };
              }

              // Check pre-paid bounds
              if (n.limitAmount && targetAmount >= n.limitAmount) {
                const finalAmount = n.limitAmount;
                const finalVolume = finalAmount / activePrice;

                setTimeout(() => {
                  completeFuelingJob(d.id, finalVolume, finalAmount, n.fuelType);
                }, 10);

                return {
                  ...n,
                  currentAmount: 0.0,
                  currentVolume: 0.0,
                  status: 'Idle',
                  progressPercent: 0,
                  limitAmount: undefined,
                  isPostpaid: false
                };
              }

              // Free load auto finishes around 11 to 14 gallons
              if (!n.limitAmount && targetVolume >= 11.2 + (d.id * 1.5)) {
                setTimeout(() => {
                  completeFuelingJob(d.id, targetVolume, targetAmount, n.fuelType);
                }, 10);

                return {
                  ...n,
                  currentAmount: 0.0,
                  currentVolume: 0.0,
                  status: 'Idle',
                  progressPercent: 0,
                  isPostpaid: false
                };
              }

              return {
                ...n,
                currentAmount: targetAmount,
                currentVolume: targetVolume,
                progressPercent: progress
              };
            }
            return n;
          });

          return {
            ...d,
            nozzles: nextNozzles
          };
        });

        return isUpdated ? nextDispensers : prevDispensers;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating, prices]);

  // Helper to persist transaction to Postgres backend database
  const persistTransaction = (
    pumpId: number,
    trxId: string,
    fuelType: FuelType,
    volume: number,
    amount: number,
    paymentType: string
  ) => {
    const numericTrxId = parseInt(trxId.replace(/\D/g, '')) || Math.floor(Math.random() * 10000);
    const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const nozzleIndex = fuelGrades.indexOf(fuelType);
    const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;

    // Convert volume from gallons to liters for Postgres backend
    const volumeLiters = volume * 3.78541;

    api.saveTransaction(pumpId, numericTrxId, nozzleNumber, volumeLiters, amount, paymentType).then(res => {
      if (res.ok) {
        console.log(`Transaction ${trxId} persisted in Postgres successfully`);
      }
    });
  };

  // Completions logic: Deduct fuel from tanks, register transaction, make sound alert
  const completeFuelingJob = (
    dispenserId: number, 
    volume: number, 
    amount: number, 
    fuelType: FuelType,
    paymentType?: 'Credit Card' | 'Debit Card' | 'Cash' | 'Fleet Card'
  ) => {
    // 1. Add Transaction Log (Pending at Nozzle Level)
    const randomTrxId = `TRX-${Math.floor(200 + Math.random() * 800)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const randPayment: 'Credit Card' | 'Debit Card' | 'Cash' | 'Fleet Card' = 
      paymentType || (Math.random() > 0.6 ? 'Credit Card' : Math.random() > 0.4 ? 'Debit Card' : Math.random() > 0.2 ? 'Cash' : 'Fleet Card');

    const nozzleTrx: NozzleTransaction = {
      id: randomTrxId,
      dateTime: `Hoy ${timeStr}`,
      dispenserId,
      volume,
      amount,
      fuelType,
      status: 'Pending',
      billingType: randPayment === 'Cash' ? 'Ticket' : 'Ticket', // Default sub-type
      createdAt: Date.now()
    };

    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType) {
              return {
                ...n,
                pendingTransactions: [...(n.pendingTransactions || []), nozzleTrx]
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    // 2. Reduce Tank Levels
    setTanks(prevTanks => prevTanks.map(tank => {
      if (tank.fuelType === fuelType) {
        const nextLvl = Math.max(0, tank.currentLevel - volume);
        const isLow = nextLvl < 3500;
        return {
          ...tank,
          currentLevel: parseFloat(nextLvl.toFixed(1)),
          status: isLow ? 'Low Level Alert' : 'OK',
          estDaysRemaining: isLow ? 2 : 5
        };
      }
      return tank;
    }));

    // 3. Add to Shift Alert List
    const newAlertItem: ShiftAlert = {
      id: `AL-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${dispenserId}`,
      volume: `${volume.toFixed(2)} Gal`,
      amount: `$${amount.toFixed(2)}`,
      paymentType: 'Hose Pend.',
      message: `Despacho completado en manguera ${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'}. Listo para procesar/comprobar.`,
    };
    setAlerts(prev => [newAlertItem, ...prev]);
  };

  // Helper inline selector prices of first load
  const activeRegularPrice = prices.find(p => p.fuelType === 'Regular Unleaded')?.price || 4.19;

  // Render Main Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-tab-layout">
            {/* Primary Main Content: dispensers grid (9 cols) */}
            <div className="col-span-1 lg:col-span-9 space-y-4">
              
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl px-4 py-3 border border-slate-700/50 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Fuel className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white font-sans tracking-tight leading-none">Consola de Dispensadores</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{dispensers.length} caras activas · Turno {shiftDetails.shiftId}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Cierre de Turno Rápido Button */}
                  <button
                    onClick={() => handleCloseShift({})}
                    className="bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white font-sans font-bold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                    title="Cerrar el turno directamente desde el panel principal"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cerrar Turno</span>
                  </button>

                  {/* Simulated Trigger Refuel button for demo fluidity */}
                  <button
                    onClick={() => {
                      setDispensers(prev => prev.map(d => d.id === 3 ? {
                        ...d,
                        nozzles: d.nozzles.map(n => n.fuelType === 'Regular Unleaded' ? {
                          ...n,
                          status: 'Dispensing',
                          currentAmount: 2.50,
                          currentVolume: 0.60,
                          progressPercent: 15
                        } : n)
                      } : d));
                    }}
                    className="bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 hover:text-white font-semibold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow border border-slate-600/40 transition-all"
                    title="Simular auto-llenado"
                  >
                    <Fuel className="w-3.5 h-3.5 text-blue-400" />
                    <span>Demo Cara 3</span>
                  </button>
                </div>
              </div>



              {/* Alerta de Tanque Bajo (Menos del 15% con animación de pulso) */}
              {tanks.some(tank => (tank.currentLevel / tank.maxCapacity) < 0.15) && (
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse-alert" id="tank-low-capacity-danger-alert">
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 bg-red-100 p-2.5 rounded-full shrink-0 flex items-center justify-center">
                      <AlertOctagon className="w-5 h-5 text-red-600" />
                    </span>
                    <div>
                      <p className="font-sans font-extrabold text-xs uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                        ALERTA DE SEGURIDAD: INVENTARIO DE TANQUE BAJO (MENOS DEL 15%)
                      </p>
                      <p className="text-xs text-slate-700 mt-1">
                        Los siguientes tanques de almacenamiento están por debajo del nivel de contingencia (15%):
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tanks
                          .filter(tank => (tank.currentLevel / tank.maxCapacity) < 0.15)
                          .map(tank => {
                            const pct = ((tank.currentLevel / tank.maxCapacity) * 100).toFixed(1);
                            return (
                              <div key={tank.id} className="bg-white border border-red-200 rounded px-2.5 py-1.5 text-slate-800 font-mono text-[10.5px] font-bold flex items-center gap-1.5 shadow-sm">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping" />
                                <span className="font-sans text-slate-500">{tank.name} ({tank.fuelType === 'Regular Unleaded' ? 'Regular' : tank.fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'}):</span>
                                <span className="text-red-700 font-extrabold">{tank.currentLevel.toLocaleString()} Gal ({pct}%)</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action block to quickly refill */}
                  <div className="flex flex-wrap gap-1.5 shrink-0 self-end md:self-center">
                    {tanks
                      .filter(tank => (tank.currentLevel / tank.maxCapacity) < 0.15)
                      .map(tank => (
                        <button
                          key={tank.id}
                          onClick={() => handleRefillTank(tank.id, 5000)}
                          className="bg-red-700 hover:bg-red-800 text-white font-sans font-bold text-[10px] uppercase px-3 py-1.5 rounded transition-all shadow-sm cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95"
                          title={`Suministrar 5,000 Galones a ${tank.name}`}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-white" />
                          <span>Reabastecer {tank.name} (+5k Gal)</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {isShiftClosing && (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-amber-500/5 border-2 border-amber-300 text-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse" id="shift-closure-waiting-banner">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-spin shrink-0" style={{ animationDuration: '4s', display: 'inline-block' }}>⏳</span>
                    <div>
                      <p className="font-sans font-extrabold text-xs uppercase tracking-wide text-amber-900 flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                        CIERRE DE TURNO EN ESPERA (MANGUERAS ACTIVAS)
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Esperando que terminen las cargas en: <strong className="font-mono text-slate-900">{dispensers.filter(d => d.nozzles.some(n => n.status === 'Dispensing')).map(d => `Cara ${d.id}`).join(', ') || 'procesando...'}</strong>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        No se permiten nuevas pre-autorizaciones. Todas las caras se bloquearán automáticamente al finalizar los despachos en curso.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setIsShiftClosing(false);
                        setPendingMeters(null);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold text-[10px] uppercase px-3 py-1.5 rounded transition-all shadow-sm cursor-pointer"
                    >
                      Cancelar Cierre
                    </button>
                  </div>
                </div>
              )}

              {/* Dispenser Cards Layout Grid - Optimized to fit all elements cleanly */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="dashboard-dispensers-grid">
                {dispensers.map((dispenser) => (
                  <CaraCard
                    key={dispenser.id}
                    dispenser={dispenser}
                    onPreAuthorize={handlePreAuthorizeClick}
                    onStartFueling={handleStartFuelingJob}
                    onEmergencyStop={handleEmergencyStopClick}
                    onResetPump={handleResetPumpClick}
                    onToggleBlockDispenser={handleToggleBlockDispenser}
                    onUpdateNozzles={handleUpdateNozzles}
                    onCollectPayment={handleCollectPayment}
                    onDirectLiftAndStart={handleDirectLiftAndStart}
                    activePrices={{
                      'Regular Unleaded': prices.find(p => p.fuelType === 'Regular Unleaded')?.price || 4.19,
                      'Premium Unleaded': prices.find(p => p.fuelType === 'Premium Unleaded')?.price || 4.69,
                      'Diesel': prices.find(p => p.fuelType === 'Diesel')?.price || 4.49,
                      'Kerosene': prices.find(p => p.fuelType === 'Kerosene')?.price || 3.89,
                    }}
                    enabledPaymentMethods={enabledPaymentMethods}
                    paymentMethods={paymentMethods}
                    onPressNozzle={(dispenserId, fuelType) => {
                      setSelectedNozzleForTrx({ dispenserId, fuelType });
                      setSelectedNozzleTrx(null);
                      setBillingMode('none');
                    }}
                  />
                ))}
              </div>

              {/* Status Reference Bar Guide */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/40 rounded-xl px-4 py-2.5 flex flex-wrap gap-x-5 gap-y-1.5 items-center justify-center shadow">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50 animate-pulse" />
                  <span className="text-[10px] font-medium text-slate-400">Despachando</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-medium text-slate-400">Listo / Armado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-[10px] font-medium text-slate-400">Colgada / Inactiva</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-medium text-slate-400">Prepago Autorizado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                  <span className="text-[10px] font-medium text-slate-400">Bloqueada / Cerrada</span>
                </div>
              </div>

            </div>

            {/* Right Side Column panel: recent transactions list (3 cols) */}
            <div className="col-span-1 lg:col-span-3">
              <RecentTransactions
                transactions={transactions}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        );
        
      case 'priceConfig':
        return (
          <PriceConfigTab
            prices={prices}
            scheduledPrices={scheduledPrices}
            onUpdatePrice={handleUpdatePrice}
            onAddScheduledPrice={handleAddScheduledPrice}
            onCancelScheduledPrice={handleCancelScheduledPrice}
          />
        );

      case 'shiftReport': {
        const currentlyDispensingCount = dispensers.reduce((cnt, d) => {
          return cnt + d.nozzles.filter(n => n.status === 'Dispensing').length;
        }, 0);
        return (
          <ShiftReportTab
            shiftDetails={shiftDetails}
            transactions={transactions}
            alerts={alerts}
            onAddNote={handleAddShiftNote}
            onCloseShift={handleCloseShift}
            isShiftClosing={isShiftClosing}
            activeDispensingCount={currentlyDispensingCount}
            prices={{
              'Regular Unleaded': prices.find(p => p.fuelType === 'Regular Unleaded')?.price || 4.19,
              'Premium Unleaded': prices.find(p => p.fuelType === 'Premium Unleaded')?.price || 4.69,
              'Diesel': prices.find(p => p.fuelType === 'Diesel')?.price || 4.49,
            }}
          />
        );
      }

      case 'inventory':
        return (
          <InventoryTab
            tanks={tanks}
            onRefillTank={handleRefillTank}
            onAddTank={handleAddTank}
            setTanks={setTanks}
          />
        );

      case 'users':
        return (
          <UserHubTab
            currentUser={currentUser}
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );

      default:
        // Transactions, Monthly summary, Cards/Flotas, Settings, Help tabs
        return (
          <OtherTabs
            tabId={activeTab}
            transactions={transactions}
            shiftCount={shiftCount}
            setShiftCount={setShiftCount}
            shiftBrackets={shiftBrackets}
            setShiftBrackets={setShiftBrackets}
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            dispensers={dispensers}
            setDispensers={setDispensers}
            onSettingsChange={fetchSystemSettings}
          />
        );
    }
  };

  const getThemeClasses = () => {
    switch (themeMode) {
      case 'retro-delta':
        return 'bg-[#e5e7eb] text-[#111827] border-[12px] border-neutral-400 p-2 shadow-inner rounded-3xl transition-all duration-300';
      case 'neon':
        return 'bg-neutral-950 text-emerald-400 border-4 border-emerald-500/20 p-2 transition-all duration-300';
      case 'slate':
      default:
        return 'bg-[#f8f9fb] text-[#191c1e] transition-all duration-300';
    }
  };

  if (!currentUser) {
    return (
      <LoginScreen 
        users={users} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
        }} 
      />
    );
  }

  // Find shortest remaining seconds for any pending transaction across all dispensers
  const getMinPendingTransactionTimeLeft = () => {
    let minTimeLeftMs = Infinity;
    let shortestTrxId = '';
    const now = Date.now();
    let totalPending = 0;

    dispensers.forEach(d => {
      d.nozzles.forEach(n => {
        const trxs = n.pendingTransactions || [];
        trxs.forEach(t => {
          totalPending++;
          const cr = t.createdAt || now;
          const elapsed = now - cr;
          const left = 300000 - elapsed;
          if (left < minTimeLeftMs) {
            minTimeLeftMs = left;
            shortestTrxId = t.id;
          }
        });
      });
    });

    if (totalPending === 0) {
      return null;
    }

    const secLeft = Math.max(0, Math.ceil(minTimeLeftMs / 1000));
    return {
      shortestTrxId,
      secLeft,
      totalPending
    };
  };

  const pendingAutoConsolidationInfo = getMinPendingTransactionTimeLeft();

  return (
    <div className={`min-h-screen flex flex-col select-none scale-100 ${getThemeClasses()}`} id="main-terminal-app-frame">
      
      {/* Header element */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        allUsers={users}
        onLogout={handleLogout}
        onQuickSwitchUser={handleQuickSwitchInitiate}
      />

      {/* Primary Context Workspace container */}
      <main className="flex-1 px-4 lg:px-6 py-6 overflow-y-auto w-full max-w-7xl mx-auto" id="terminal-workspace-window">
        {renderTabContent()}
      </main>

      {/* Footer element */}
      <Footer
        shiftId={shiftDetails.shiftId}
        shiftName={(() => {
          if (!shiftDetails.shiftId) return 'Matutino';
          const parts = shiftDetails.shiftId.split('-');
          const lastPart = parts[parts.length - 1];
          const shiftNum = parseInt(lastPart, 10);
          if (isNaN(shiftNum)) return 'Matutino';
          const index = (shiftNum - 1) % shiftBrackets.length;
          const bracket = shiftBrackets[index];
          if (!bracket) return 'Matutino';
          return bracket.name.replace('Turno ', '');
        })()}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        onManualSync={handleManualSync}
        pendingAutoConsolidationInfo={pendingAutoConsolidationInfo}
      />

      {/* Quick relevo switch PIN prompt overlay */}
      {pendingSwitchUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn" id="quick-switch-pin-modal">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-300 space-y-4">
            
            <div className="text-center">
              <span className="text-4xl bg-slate-100 p-2 rounded-full inline-block mb-2">{pendingSwitchUser.avatar}</span>
              <h3 className="font-sans font-extrabold text-base text-slate-800">Clave de Seguridad Relevo</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ingrese el PIN de {pendingSwitchUser.name} para relevar la sesión.
              </p>
            </div>

            {/* PIN Dots indicators */}
            <div className="flex items-center justify-center gap-2.5 py-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    quickSwitchPin.length > idx 
                      ? 'bg-[#1b365d] border-[#1b365d] scale-110' 
                      : 'bg-white border-neutral-300'
                  }`}
                />
              ))}
            </div>

            {quickSwitchError && (
              <p className="text-[11px] text-red-600 font-sans font-bold text-center leading-none animate-pulse">
                ⚠️ {quickSwitchError}
              </p>
            )}

            {/* Numeric touch keypad for quick PIN entry */}
            <div className="grid grid-cols-3 gap-2 max-w-[210px] mx-auto" id="quick-switch-pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setQuickSwitchError('');
                    if (quickSwitchPin.length < 4) {
                      setQuickSwitchPin(prev => prev + num);
                    }
                  }}
                  className="h-10 text-base font-mono font-black border border-neutral-200 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => {
                  setQuickSwitchError('');
                  setQuickSwitchPin('');
                }}
                className="text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer flex items-center justify-center border border-red-100"
              >
                BORRAR
              </button>
              <button
                onClick={() => {
                  setQuickSwitchError('');
                  if (quickSwitchPin.length < 4) {
                    setQuickSwitchPin(prev => prev + '0');
                  }
                }}
                className="h-10 text-base font-mono font-black border border-neutral-200 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={() => {
                  setQuickSwitchError('');
                  setQuickSwitchPin(prev => prev.slice(0, -1));
                }}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl cursor-pointer flex items-center justify-center"
              >
                <Delete className="w-4 h-4 text-[#355e9e]" />
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPendingSwitchUser(null)}
                className="flex-1 border border-neutral-300 text-slate-700 font-sans font-bold text-xs py-2 px-3 rounded-xl cursor-pointer transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuickSwitchPinSubmit}
                className="flex-1 bg-[#1b365d] hover:bg-[#132a4e] text-white font-sans font-bold text-xs py-2 px-3 rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Verificar PIN
              </button>
            </div>

            <p className="text-[10px] text-center font-mono text-slate-400">
              Demo: Clave para {pendingSwitchUser.name} es <strong className="text-[#355e9e]">{pendingSwitchUser.pin}</strong>
            </p>

          </div>
        </div>
      )}

      {/* Nozzle Pending Transactions Modal */}
      {selectedNozzleForTrx !== null && (() => {
        const dispenserId = selectedNozzleForTrx.dispenserId;
        const fuelType = selectedNozzleForTrx.fuelType;
        const dispenser = dispensers.find(d => d.id === dispenserId);
        const nozzle = dispenser?.nozzles.find(n => n.fuelType === fuelType);
        const pendingList = nozzle?.pendingTransactions || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn" id="nozzle-transactions-modal">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full text-white overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-white uppercase font-sans">
                      Despachos en Pistola: Cara {dispenserId} — Manguera {fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Administre, imprima comprobantes y procese transacciones de esta manguera.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedNozzleForTrx(null);
                    setSelectedNozzleTrx(null);
                    setBillingMode('none');
                    setBillingSuccessDoc(null);
                  }}
                  className="p-1 text-slate-404 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 bg-gradient-to-b from-slate-900 to-slate-950">
                
                {/* Left Panel: List of Pending Transactions (7 Cols) */}
                <div className="col-span-1 md:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Despachos Registrados en Pistolera ({pendingList.length})
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateMockDispatch(dispenserId, fuelType)}
                        className="text-[9px] bg-slate-805 hover:bg-slate-700 hover:text-amber-300 text-slate-300 font-bold py-1 px-2.5 rounded-lg border border-slate-705 flex items-center gap-1 transition-all cursor-pointer"
                        title="Simular nueva venta instantáneamente para evaluar tickets/facturas"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Simular Carga</span>
                      </button>

                      {pendingList.length > 0 && (
                        <button
                          onClick={() => {
                            handleProcessAllNozzleTrxs(dispenserId, fuelType);
                            setSelectedNozzleTrx(null);
                            setBillingMode('none');
                          }}
                          className="text-[9px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 animate-spin-slow" />
                          <span>Procesar Todas</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {pendingList.length === 0 ? (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500 shadow-inner">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-300">No hay despachos acumulados</p>
                        <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                          Esta manguera se encuentra libre de despachos pendientes. Los nuevos despachos autorizados o completados se almacenarán aquí a la espera de facturación o transcurso de 5 min.
                        </p>
                      </div>
                      <button
                        onClick={() => handleGenerateMockDispatch(dispenserId, fuelType)}
                        className="bg-indigo-605 hover:bg-indigo-505 text-white font-sans font-bold text-[10px] uppercase py-1.5 px-3 rounded-lg cursor-pointer inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cargar Despacho de Prueba</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {pendingList.map((tx) => {
                        const isSelected = selectedNozzleTrx?.id === tx.id;
                        return (
                          <div
                            key={tx.id}
                            onClick={() => {
                              setSelectedNozzleTrx(tx);
                              setBillingMode('none');
                              setBillingSuccessDoc(null);
                            }}
                            className={`p-3 rounded-xl border transition-all duration-250 cursor-pointer flex items-center justify-between relative ${
                              isSelected
                                ? 'bg-indigo-950/80 border-indigo-501/80 shadow-md ring-1 ring-indigo-501/30'
                                : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  fuelType === 'Regular Unleaded' 
                                    ? 'bg-green-500' 
                                    : fuelType === 'Premium Unleaded' 
                                    ? 'bg-blue-500' 
                                    : 'bg-amber-600'
                                }`} />
                                <span className="font-mono text-[10.5px] font-black text-white">{tx.id}</span>
                                <span className="text-[9px] text-slate-400 font-mono">{tx.dateTime}</span>
                              </div>
                              <div className="text-[11px] text-slate-300">
                                Volumen: <strong className="font-mono text-white">{tx.volume.toFixed(2)} Gls</strong> | Combustible: <span className="text-indigo-300 font-medium">{fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-black text-amber-400 font-mono">${tx.amount.toFixed(2)}</p>
                              {(() => {
                                const created = tx.createdAt || Date.now();
                                const sLeft = Math.max(0, Math.ceil((300000 - (Date.now() - created)) / 1000));
                                const min = Math.floor(sLeft / 60);
                                const sec = sLeft % 60;
                                return (
                                  <p className="text-[8px] font-mono uppercase bg-indigo-950/60 border border-indigo-700/50 px-1.5 py-0.5 rounded text-indigo-300 mt-1 inline-block" title="Tiempo antes de que esta transacción se auto-consolide">
                                    Auto-Cons: <strong className="text-white font-black">{min}:{String(sec).padStart(2, '0')}</strong>
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Panel: Transaction Actions Panel (5 Cols) */}
                <div className="col-span-1 md:col-span-5 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-5 space-y-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Opciones de Despacho Seleccionado
                  </span>

                  {billingSuccessDoc ? (
                    /* Render Beautiful Printed Outcome Proof */
                    <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-4 text-center space-y-4">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-sans font-black text-xs text-white">¡Comprobante Emitido con Éxito!</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          La transacción {billingSuccessDoc.tx.id} fue procesada y registrada en el historial principal del turno en curso.
                        </p>
                      </div>

                      {/* Mock printed layout inside receipt */}
                      <div className="bg-white text-slate-800 text-left p-3.5 rounded-lg border border-slate-200 font-mono text-[9px] space-y-2 mx-auto max-w-[240px] shadow-lg leading-tight relative overflow-hidden">
                        {/* Red thermal banner pattern */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-[#1b365d]" />
                        <div className="text-center font-sans">
                          <p className="font-black text-[10px] text-slate-900 uppercase tracking-wide">⛽ GASNOVA OUTLET</p>
                          <p className="text-[7.5px] text-slate-500">R.U.C. 20459871402 • ESTACIÓN CENTRAL</p>
                        </div>
                        <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-slate-800">
                          <p><span className="font-bold">DOCUMENTO:</span> {billingSuccessDoc.type === 'invoice' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}</p>
                          <p><span className="font-bold">NÚMERO:</span> {billingSuccessDoc.docNumber}</p>
                          <p><span className="font-bold">SURTIDOR:</span> CARA {dispenserId} • ISLA 1</p>
                        </div>

                        {billingSuccessDoc.type === 'invoice' && (
                          <div className="border-t border-dashed border-slate-300 pt-1.5 space-y-0.5 text-slate-800">
                            <p><span className="font-bold">CLIENTE:</span> {billingSuccessDoc.clientName}</p>
                            <p><span className="font-bold">R.U.C.:</span> {billingSuccessDoc.clientRuc}</p>
                          </div>
                        )}

                        <div className="border-t border-dashed border-slate-300 pt-1.5 space-y-1 text-slate-800">
                          <p><span className="font-bold">PRODUCTO:</span> {fuelType === 'Regular Unleaded' ? 'Regular 90 Oct' : fuelType === 'Premium Unleaded' ? 'Súper 95 Oct' : 'Diesel B5'}</p>
                          <p><span className="font-bold">VOLUMEN:</span> {billingSuccessDoc.tx.volume.toFixed(2)} Gls</p>
                          <p className="text-[11px] font-black text-right pt-1 text-slate-900">COD. TOTAL: ${billingSuccessDoc.tx.amount.toFixed(2)}</p>
                        </div>

                        <div className="text-center text-[7px] text-slate-500 border-t border-dashed border-slate-300 pt-1.5">
                          <p>Representación impresa autorizada de comprobante electrónico.</p>
                          <p className="font-bold mt-1">¡Gracias por su preferencia!</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBillingSuccessDoc(null);
                            setSelectedNozzleTrx(null);
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] py-1.5 rounded-lg cursor-pointer"
                        >
                          Cerrar
                        </button>
                        <button
                           onClick={async () => {
                             if (!billingSuccessDoc) return;
                             const fuelType = selectedNozzleForTrx?.fuelType || billingSuccessDoc.tx.fuelType;
                             const dispenserId = selectedNozzleForTrx?.dispenserId || billingSuccessDoc?.tx?.dispenserId;
                             const unitPrice = prices.find(p => p.fuelType === fuelType)?.price || 4.19;
                             const receiptData = {
                               docType:     (billingSuccessDoc.type === 'invoice' ? 'factura' : 'ticket') as 'ticket' | 'factura',
                               docNumber:   billingSuccessDoc.docNumber,
                               shiftId:     shiftDetails.shiftId,
                               pumpName:    `Cara ${selectedNozzleForTrx?.dispenserId ?? '?'}`,
                               fuelType:    fuelType,
                               volumeGal:   billingSuccessDoc.tx.volume,
                               unitPrice:   unitPrice,
                               totalAmount: billingSuccessDoc.tx.amount,
                               paymentType: billingSuccessDoc.type === 'factura' ? 'Factura' : 'Efectivo',
                               cashierName: currentUser?.name,
                               clientName:  billingSuccessDoc.clientName,
                               clientRuc:   billingSuccessDoc.clientRuc,
                             };
                             // Try ESC/POS backend first (silent print)
                             const backendRes = await api.printReceipt({
                               doc_type:     receiptData.docType,
                               doc_number:   receiptData.docNumber,
                               shift_id:     receiptData.shiftId,
                               pump_name:    receiptData.pumpName,
                               fuel_type:    receiptData.fuelType,
                               volume_gal:   receiptData.volumeGal,
                               unit_price:   receiptData.unitPrice,
                               total_amount: receiptData.totalAmount,
                               payment_type: receiptData.paymentType,
                               cashier_name: receiptData.cashierName,
                               client_name:  receiptData.clientName,
                               client_ruc:   receiptData.clientRuc,
                             });
                             if (!backendRes.ok) {
                               // Fallback: browser window.print() with 80mm receipt
                               printReceiptWindow(receiptData);
                             }
                           }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>
                  ) : selectedNozzleTrx ? (
                    <div className="space-y-4">
                      {/* Active Dispatch Specs Card */}
                      <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-indigo-400 font-bold font-mono">ID: {selectedNozzleTrx.id}</p>
                          <span className="text-[9px] text-slate-400 font-mono">{selectedNozzleTrx.dateTime}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                          <div>
                            <span className="text-[9px] text-slate-500 block">Combustible</span>
                            <span className="font-bold text-white leading-tight">
                              {fuelType === 'Regular Unleaded' ? 'Regular 90' : fuelType === 'Premium Unleaded' ? 'Super 95' : 'Diesel'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">Total Soles</span>
                            <span className="font-bold text-amber-400 font-mono">${selectedNozzleTrx.amount.toFixed(2)}</span>
                          </div>
                          <div className="pt-1">
                            <span className="text-[9px] text-slate-500 block">Volumen</span>
                            <span className="font-semibold text-slate-300 font-mono">{selectedNozzleTrx.volume.toFixed(2)} Gls</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">Surtidor</span>
                            <span className="font-semibold text-slate-200 font-sans">Cara {dispenserId}</span>
                          </div>
                        </div>
                      </div>

                      {billingMode === 'none' && (
                        /* Choose Action mode (Process / Ticket / Invoice) */
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              handleProcessSingleNozzleTrx(dispenserId, fuelType, selectedNozzleTrx.id, 'Ticket');
                              setSelectedNozzleTrx(null);
                            }}
                            className="w-full text-left p-2.5 bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-900/50 hover:border-indigo-700/60 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-400/10 group-hover:bg-indigo-500/20">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                              <div>
                                <span className="font-sans font-black text-xs text-white block leading-tight">Procesar Despacho</span>
                                <span className="text-[9px] text-slate-400 leading-none">Registra directamente y limpia la pistola.</span>
                              </div>
                            </div>
                            <span className="text-slate-500 group-hover:text-white transition-colors text-xs">➔</span>
                          </button>

                          <button
                            onClick={() => {
                              setBillingMode('ticket');
                            }}
                            className="w-full text-left p-2.5 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-404/10 group-hover:bg-emerald-500/25">
                                <Printer className="w-3.5 h-3.5" />
                              </span>
                              <div>
                                <span className="font-sans font-black text-xs text-white block leading-tight">📄 Emitir Ticket Boleta</span>
                                <span className="text-[9px] text-slate-400 leading-none">Imprime ticket de caja térmica rápida.</span>
                              </div>
                            </div>
                            <span className="text-slate-500 group-hover:text-white transition-colors text-xs">➔</span>
                          </button>

                          <button
                            onClick={() => {
                              setBillingMode('invoice');
                              setInvoiceClientName('');
                              setInvoiceClientRuc('');
                            }}
                            className="w-full text-left p-2.5 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-400/10 group-hover:bg-amber-500/25">
                                <FileText className="w-3.5 h-3.5" />
                              </span>
                              <div>
                                <span className="font-sans font-black text-xs text-white block leading-tight">🏛️ Emitir Factura RUC</span>
                                <span className="text-[9px] text-slate-400 leading-none">Completa RUC de la empresa corporativa.</span>
                              </div>
                            </div>
                            <span className="text-slate-500 group-hover:text-white transition-colors text-xs">➔</span>
                          </button>
                        </div>
                      )}

                      {billingMode === 'ticket' && (
                        /* Ticket sub-flow layout and validation form */
                        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                          <p className="text-[10.5px] font-black text-indigo-300">COMPROBACIÓN DEL TICKET</p>
                          <p className="text-[9.5px] text-slate-400">Se procesará el despacho {selectedNozzleTrx.id} emitiendo un ticket rápido de estación.</p>
                          
                          <div className="flex gap-2 pt-1 uppercase">
                            <button
                              onClick={() => setBillingMode('none')}
                              className="flex-1 border border-slate-800 hover:bg-slate-900 text-slate-305 font-bold text-[10px] py-1.5 rounded-lg cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              onClick={() => {
                                const docNumber = `BO-${Math.floor(100 + Math.random() * 800)}-${Math.floor(1000 + Math.random() * 8999)}`;
                                handleProcessSingleNozzleTrx(dispenserId, fuelType, selectedNozzleTrx.id, 'Ticket');
                                setBillingSuccessDoc({
                                  type: 'ticket',
                                  tx: selectedNozzleTrx,
                                  docNumber
                                });
                              }}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Generar Ticket</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {billingMode === 'invoice' && (
                        /* Invoice input form styling */
                        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                          <p className="text-[10.5px] font-black text-indigo-300 uppercase tracking-wide">🏛️ Rellenar Datos Factura</p>
                          
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold block uppercase">RUC del Cliente</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={invoiceClientRuc}
                                  onChange={(e) => setInvoiceClientRuc(e.target.value)}
                                  placeholder="Ej: 20459871402"
                                  className="bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-550 rounded px-2 py-1 text-[11px] font-mono w-full focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInvoiceClientRuc('20612048590');
                                    setInvoiceClientName('SERVICIOS LOGISTICOS GENERALES S.A.');
                                  }}
                                  className="text-[9px] bg-slate-800 hover:bg-slate-705 text-slate-300 px-2 py-1 rounded border border-slate-700 font-bold cursor-pointer"
                                  title="Autorellenar para test rápido"
                                >
                                  AUTO
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold block uppercase">Establecimiento / Razón Social</label>
                              <input
                                  type="text"
                                  value={invoiceClientName}
                                  onChange={(e) => setInvoiceClientName(e.target.value)}
                                  placeholder="Ej: SERVICIOS LOGISTICOS DEL PERU"
                                  className="bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-550 rounded px-2 py-1 text-[11px] font-sans w-full focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                           <div className="flex gap-2 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => setBillingMode('none')}
                              className="flex-1 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-[10px] py-1.5 rounded-lg cursor-pointer"
                            >
                              Volver
                            </button>
                            <button
                              onClick={() => {
                                if (!invoiceClientRuc.trim() || !invoiceClientName.trim()) {
                                  alert('Por favor complete el RUC y Razón Social.');
                                  return;
                                }
                                const docNumber = `FE-${Math.floor(100 + Math.random() * 800)}-${Math.floor(1000 + Math.random() * 8999)}`;
                                handleProcessSingleNozzleTrx(
                                  dispenserId, 
                                  fuelType, 
                                  selectedNozzleTrx.id, 
                                  'Factura',
                                  invoiceClientName,
                                  invoiceClientRuc
                                );
                                setBillingSuccessDoc({
                                  type: 'invoice',
                                  tx: selectedNozzleTrx,
                                  docNumber,
                                  clientName: invoiceClientName,
                                  clientRuc: invoiceClientRuc
                                });
                              }}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-1.5 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Emitir Factura</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center p-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl">
                      <p className="text-[10.5px] text-slate-400">
                        Seleccione un despacho de la lista para gestionarlo de forma individual. Podrá imprimir un Ticket Térmico boleta o emitir Factura tributaria con RUC.
                      </p>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Footer Section */}
              <div className="p-3.5 border-t border-slate-805 bg-slate-950 flex justify-end shrink-0 gap-2">
                <button
                  onClick={() => {
                    setSelectedNozzleForTrx(null);
                    setSelectedNozzleTrx(null);
                    setBillingMode('none');
                    setBillingSuccessDoc(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-bold text-xs py-1.5 px-4 rounded-xl cursor-pointer transition-colors"
                >
                  Cerrar Ventana
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Pre-Authorization Dialog Modal Layout */}
      {preauthorizingPumpId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn" id="preauth-dialog-modal">
          <div className="bg-[#191c1e] text-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800">
            
            {/* Title banner */}
            <div className="bg-[#1b365d] px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-[#93b9ff]" />
                <h3 className="font-sans font-bold text-base text-white">Pre-autorizar Bomba {preauthorizingPumpId}</h3>
              </div>
              <button
                onClick={() => setPreauthorizingPumpId(null)}
                className="text-slate-400 hover:text-white transition-all text-xl"
              >
                ×
              </button>
            </div>

            {/* Dialog variables form body */}
            <div className="p-6 space-y-4">
              
              {/* Selector 1: Fuel Grades */}
              <div>
                <label className="block text-xs font-bold text-[#87a0cd] uppercase tracking-wider mb-2 font-sans">
                  Seleccionar Octanaje / Grado
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {prices.map(p => (
                    <button
                      key={p.fuelType}
                      type="button"
                      onClick={() => setPreauthFuelGrade(p.fuelType)}
                      className={`py-2 px-1 text-center font-bold font-sans text-xs rounded border transition-all cursor-pointer ${
                        preauthFuelGrade === p.fuelType
                          ? 'bg-[#355e9e] border-[#93b9ff] text-white'
                          : 'bg-[#133562]/30 border-[#133562] text-[#87a0cd] hover:border-[#355e9e]'
                      }`}
                    >
                      <p className="truncate text-[11px] leading-tight">{p.fuelType.split(' ')[0]}</p>
                      <span className="font-mono text-[10px] text-slate-300 block font-normal">${p.price.toFixed(2)}/G</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector 2: Mode Toggle prepay limit, postpaid, or unlimited direct flow */}
              <div>
                <label className="block text-xs font-bold text-[#87a0cd] uppercase tracking-wider mb-2 font-sans">
                  Modalidad de Despacho
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreauthMode('Limit')}
                    className={`py-2 text-center text-[11px] font-bold rounded border cursor-pointer ${
                      preauthMode === 'Limit'
                        ? 'bg-[#355e9e] border-[#93b9ff] text-white'
                        : 'bg-slate-800/40 border-slate-700 text-[#87a0cd]'
                    }`}
                  >
                    💰 Prepago
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreauthMode('Postpaid')}
                    className={`py-2 text-center text-[11px] font-bold rounded border cursor-pointer ${
                      preauthMode === 'Postpaid'
                        ? 'bg-[#355e9e] border-[#93b9ff] text-white'
                        : 'bg-slate-800/40 border-slate-700 text-[#87a0cd]'
                    }`}
                  >
                    📂 Postpago
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreauthMode('Full');
                      setPreauthAmount('999'); // dummy full tank
                    }}
                    className={`py-2 text-center text-[11px] font-bold rounded border cursor-pointer ${
                      preauthMode === 'Full'
                        ? 'bg-[#355e9e] border-[#93b9ff] text-white'
                        : 'bg-slate-800/40 border-slate-700 text-[#87a0cd]'
                    }`}
                  >
                    🚗 Llenado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreauthMode('LiftInmediate');
                    }}
                    className={`py-2 text-center text-[11px] font-bold rounded border cursor-pointer ${
                      preauthMode === 'LiftInmediate'
                        ? 'bg-[#355e9e] border-[#93b9ff] text-white'
                        : 'bg-slate-800/40 border-slate-700 text-[#87a0cd]'
                    }`}
                  >
                    ⚡ Descolgar e Iniciar
                  </button>
                </div>
              </div>

              {/* Selector 3: Amount config */}
              {preauthMode === 'Limit' && (
                <div>
                  <label className="block text-xs font-bold text-[#87a0cd] uppercase tracking-wider mb-2 font-sans">
                    Importe Precargado ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#87a0cd] font-mono text-sm">$</span>
                    <input
                      type="number"
                      step="5"
                      value={preauthAmount}
                      onChange={(e) => setPreauthAmount(e.target.value)}
                      className="w-full bg-[#1b365d]/50 border border-[#355e9e] rounded py-1.5 pl-7 pr-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#93b9ff]"
                    />
                  </div>

                  {/* Quick select presets */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {['10.00', '20.00', '45.00', '60.00'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPreauthAmount(preset)}
                        className="bg-[#2d3133] hover:bg-[#355e9e] font-mono text-xs rounded text-slate-300 hover:text-white py-1 cursor-pointer border border-[#44474e]/40"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {preauthMode === 'Full' && (
                <div className="p-3 rounded-lg bg-[#355e9e]/15 border border-[#355e9e]/30 flex gap-2 items-start text-xs text-[#87a0cd]">
                  <Info className="w-4 h-4 text-[#93b9ff] shrink-0 mt-0.5" />
                  <p>
                    El dispensador fluirá hasta que el sensor de presión detecte estanque lleno. El total de galonaje se cobrará automáticamente al terminar.
                  </p>
                </div>
              )}

              {preauthMode === 'Postpaid' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2 items-start text-xs text-amber-200">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Servicio Libre (Postpago). El combustible fluirá libremente y, al terminar, el dispensador quedará en estado <strong>Pendiente de Cobro</strong> hasta liquidarlo en caja.
                  </p>
                </div>
              )}

              {preauthMode === 'LiftInmediate' && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-2 items-start text-xs text-emerald-200">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Auto-Descolgue Inmediato</strong>. Habilita el surtidor de modo que, al retirar la manguera, el despacho inicia de forma inmediata sin pasos secundarios.
                  </p>
                </div>
              )}

            </div>

            {/* Footer triggers */}
            <div className="bg-slate-900/60 p-4 border-t border-slate-800 flex justify-between gap-3 text-xs font-sans">
              <button
                type="button"
                onClick={() => setPreauthorizingPumpId(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 py-2 rounded text-center cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmPreauth}
                className="flex-1 bg-[#2E7D32] hover:bg-[#2E7D32]/80 text-white font-bold py-2 rounded text-center cursor-pointer transition-all border border-green-700 shadow flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar / Liberar</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Cara / Dispenser Dialog Modal Layout */}
      {isAddCaraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn" id="add-cara-dialog-modal">
          <div className="bg-[#191c1e] text-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-800">
            
            {/* Title banner */}
            <div className="bg-[#1b365d] px-5 py-3.5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-emerald-400" />
                <h3 className="font-sans font-bold text-sm text-white">Instalar Nueva Cara/Dispensador</h3>
              </div>
              <button
                onClick={() => setIsAddCaraModalOpen(false)}
                className="text-slate-400 hover:text-white transition-all text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Dialog Form Body */}
            <div className="p-5 space-y-4">
              
              {/* Name Input */}
              <div>
                <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1.5 font-sans">
                  Nombre de la Cara / Dispensador
                </label>
                <input
                  type="text"
                  value={newCaraName}
                  onChange={(e) => setNewCaraName(e.target.value)}
                  placeholder="Ej. Cara 7"
                  className="w-full bg-[#1b365d]/40 border border-[#355e9e] rounded py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#93b9ff] font-sans"
                />
              </div>

              {/* Select Products / Checkbox group */}
              <div>
                <label className="block text-[10px] font-bold text-[#87a0cd] uppercase tracking-wider mb-1.5 font-sans">
                  Asignar Mangueras (de 1 a 4 combustibles)
                </label>
                <p className="text-[9px] text-slate-400 mb-2 leading-relaxed font-sans">
                  Seleccione los combustibles disponibles que surtirá esta cara. Debe marcar al menos uno.
                </p>

                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5">
                  {[
                    { type: 'Regular Unleaded', name: 'Gasolina Regular (87 Oct)', color: 'bg-blue-500' },
                    { type: 'Premium Unleaded', name: 'Gasolina Premium (95 Oct)', color: 'bg-amber-500' },
                    { type: 'Diesel', name: 'Diesel Especial', color: 'bg-emerald-500' },
                    { type: 'Kerosene', name: 'Queroseno Doméstico', color: 'bg-purple-500' }
                  ].map((prod) => {
                    const isChecked = newCaraProducts.includes(prod.type as FuelType);
                    return (
                      <label
                        key={prod.type}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-slate-800/85 border-[#355e9e]/70 text-white font-semibold' 
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${prod.color}`} />
                          <span className="text-xs font-sans">{prod.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              if (newCaraProducts.length > 1) {
                                setNewCaraProducts(newCaraProducts.filter(p => p !== prod.type));
                              }
                            } else {
                              if (newCaraProducts.length < 4) {
                                setNewCaraProducts([...newCaraProducts, prod.type as FuelType]);
                              }
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

            {/* Footer Actions */}
            <div className="bg-slate-900/60 p-4 border-t border-slate-800 flex justify-between gap-3 text-xs font-sans">
              <button
                type="button"
                onClick={() => setIsAddCaraModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 py-1.5 rounded text-center cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmAddCara}
                disabled={!newCaraName.trim() || newCaraProducts.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-1.5 rounded text-center cursor-pointer transition-all border border-emerald-700 shadow flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Root-Level Shift Receipt modal */}
      {showShiftReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fadeIn" id="app-receipt-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-300">
            {/* Header */}
            <div className="bg-[#1b365d] px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#93b9ff]" />
                <h3 className="font-sans font-bold text-base">Cierre de Turno Exitoso</h3>
              </div>
              <button
                onClick={() => setShowShiftReceipt(false)}
                className="text-white hover:text-slate-200 font-sans text-xl"
              >
                ×
              </button>
            </div>

            {/* Printout Content mimicking physical receipt slip */}
            <div className="p-6 space-y-4 font-mono text-xs text-slate-800 bg-[#fbfbfb] max-h-[450px] overflow-y-auto" id="physical-receipt-slip">
              <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                <p className="font-bold text-lg font-sans text-[#1b365d]">GasNova Consolidated POS</p>
                <p className="text-[10px] text-slate-400">Estación Central de Servicio #109</p>
                <p className="text-[10px] text-slate-400">Corte Emitido: {new Date().toLocaleString()}</p>
              </div>

              {/* Shift info block */}
              <div className="space-y-1 py-1 border-b border-dashed border-neutral-300 font-sans">
                <p className="flex justify-between"><span>Shift ID:</span> <span className="font-mono font-bold text-slate-900">{shiftDetails.shiftId}</span></p>
                <p className="flex justify-between"><span>Operador Saliente:</span> <span className="font-bold text-slate-900">{shiftDetails.operatorName}</span></p>
                <p className="flex justify-between"><span>Inicio de Turno:</span> <span className="font-mono text-slate-700">{shiftDetails.startTime}</span></p>
                <p className="flex justify-between"><span>Fin de Turno:</span> <span className="font-mono text-slate-700">{shiftDetails.endTime}</span></p>
                <p className="flex justify-between"><span>Estado:</span> <span className="font-bold text-red-605 uppercase font-mono bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px]">CERRADO Y BLOQUEADO</span></p>
              </div>

              {/* Revenue list */}
              <div className="space-y-1.5 py-1.5 border-b border-dashed border-neutral-300">
                <p className="font-bold text-slate-900 pb-1">VENTAS POR GRADO:</p>
                <p className="flex justify-between"><span>Gasolina Regular:</span> <span>{transactions.filter(t => t.fuelType === 'Regular Unleaded').reduce((sum, t) => sum + t.volume, 0).toFixed(2)} Gal (${transactions.filter(t => t.fuelType === 'Regular Unleaded').reduce((sum, t) => sum + t.amount, 0).toFixed(2)})</span></p>
                <p className="flex justify-between"><span>Gasolina Premium:</span> <span>{transactions.filter(t => t.fuelType === 'Premium Unleaded').reduce((sum, t) => sum + t.volume, 0).toFixed(2)} Gal (${transactions.filter(t => t.fuelType === 'Premium Unleaded').reduce((sum, t) => sum + t.amount, 0).toFixed(2)})</span></p>
                <p className="flex justify-between"><span>Diesel Especial:</span> <span>{transactions.filter(t => t.fuelType === 'Diesel').reduce((sum, t) => sum + t.volume, 0).toFixed(2)} Gal (${transactions.filter(t => t.fuelType === 'Diesel').reduce((sum, t) => sum + t.amount, 0).toFixed(2)})</span></p>
              </div>

              {/* Payments summary */}
              <div className="space-y-1.5 py-1.5 border-b border-dashed border-neutral-300">
                <p className="font-bold text-slate-900 pb-1">MÉTODOS DE PAGO:</p>
                <p className="flex justify-between"><span>Pago Tarjetas:</span> <span>${transactions.filter(t => t.paymentType !== 'Cash').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span></p>
                <p className="flex justify-between"><span>Pago Efectivo:</span> <span>${transactions.filter(t => t.paymentType === 'Cash').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span></p>
                <p className="text-sm font-bold text-slate-900 pt-1.5 border-t border-neutral-200 flex justify-between font-sans">
                  <span>TOTAL RECAUDADO:</span> 
                  <span className="font-mono text-base font-extrabold text-[#1b365d]">${transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span>
                </p>
              </div>

              {/* Manual readings audit results */}
              <div className="space-y-1 py-1 text-[10px]">
                <p className="font-bold text-slate-900 pb-1 uppercase font-sans">Lectura de Odómetros (Audit Físico):</p>
                {[1,2,3,4,5,6].map(n => {
                  const name = `Pump ${n}`;
                  const sys = n === 1 ? 45.67 : n === 2 ? 12.34 : n === 3 ? 10.50 : 0.00;
                  const man = pendingMeters ? (parseFloat(pendingMeters[name] || '0') || 0) : 0;
                  const diff = man - sys;
                  return (
                    <div key={n} className="flex justify-between text-[#191c1e] py-0.5 animate-fadeIn">
                      <span>Bomba {n} (Sist: {sys.toFixed(2)})</span>
                      <span className="font-bold">Man: {man.toFixed(2)} (Dif: <span className={diff === 0 ? 'text-green-600' : 'text-red-705'}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</span>)</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-center pt-4 border-t border-dashed border-neutral-300 text-[10px] text-slate-400 leading-normal font-sans">
                <p className="font-bold text-slate-600">*** FIN DEL REPORTE FINAL DE TURNO ***</p>
                <p className="mt-3">Firma Operador Saliente: ______________________</p>
                <p className="mt-2">Firma Supervisor POS: ______________________</p>
              </div>
            </div>

            {/* Close footer controls */}
            <div className="bg-slate-50 px-6 py-4 flex flex-col gap-2.5 border-t border-neutral-200 font-sans">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const allShiftTransactions = transactions;
                    const regularSales = allShiftTransactions.filter(t => t.fuelType === 'Regular Unleaded');
                    const premiumSales = allShiftTransactions.filter(t => t.fuelType === 'Premium Unleaded');
                    const dieselSales = allShiftTransactions.filter(t => t.fuelType === 'Diesel');

                    const regularVol = regularSales.reduce((sum, t) => sum + t.volume, 0);
                    const regularAmt = regularSales.reduce((sum, t) => sum + t.amount, 0);
                    const premiumVol = premiumSales.reduce((sum, t) => sum + t.volume, 0);
                    const premiumAmt = premiumSales.reduce((sum, t) => sum + t.amount, 0);
                    const dieselVol = dieselSales.reduce((sum, t) => sum + t.volume, 0);
                    const dieselAmt = dieselSales.reduce((sum, t) => sum + t.amount, 0);

                    const totalSales = allShiftTransactions.reduce((sum, t) => sum + t.amount, 0);
                    const totalVolume = allShiftTransactions.reduce((sum, t) => sum + t.volume, 0);
                    const transactionCount = allShiftTransactions.length;

                    const fuelBreakdown = [
                      { fuel_type: 'Regular Unleaded', volume: regularVol, amount: regularAmt },
                      { fuel_type: 'Premium Unleaded', volume: premiumVol, amount: premiumAmt },
                      { fuel_type: 'Diesel', volume: dieselVol, amount: dieselAmt }
                    ];

                    const paymentBreakdown = [
                      { method: 'Tarjeta', amount: allShiftTransactions.filter(t => t.paymentType !== 'Cash').reduce((sum, t) => sum + t.amount, 0) },
                      { method: 'Efectivo', amount: allShiftTransactions.filter(t => t.paymentType === 'Cash').reduce((sum, t) => sum + t.amount, 0) }
                    ];

                    const closedShiftName = getShiftNameFromId(shiftDetails.shiftId, shiftBrackets);
                    api.printClosure({
                      shift_id:          shiftDetails.shiftId,
                      shift_name:        closedShiftName,
                      operator_name:     shiftDetails.operatorName,
                      start_time:        shiftDetails.startTime,
                      end_time:          shiftDetails.endTime || new Date().toLocaleString(),
                      total_sales:       totalSales,
                      total_volume:      totalVolume,
                      transaction_count: transactionCount,
                      fuel_breakdown:    fuelBreakdown,
                      payment_breakdown: paymentBreakdown
                    }).catch(err => console.error("Error reprinting physical closure:", err));
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold text-xs py-2.5 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Reimprimir Cierre</span>
                </button>
                <button
                  onClick={() => setShowShiftReceipt(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-sans font-bold text-xs py-2.5 px-3 rounded text-center cursor-pointer transition-colors"
                >
                  Cerrar Ventana
                </button>
              </div>

              <button
                onClick={() => {
                  // Reopen a new shift
                  setIsShiftClosing(false);
                  setPendingMeters(null);
                  setShowShiftReceipt(false);
                  
                  // Reset shift metadata to active, utilizing nextShiftData from backend if available
                  const nextOperator = nextShiftData ? nextShiftData.operator_name : (shiftDetails.operatorName === 'John Doe' ? 'Jane Smith' : 'John Doe');
                  const nextId = nextShiftData ? nextShiftData.shift_id : `SH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(10 + Math.random() * 90))}`;
                  const nextStart = nextShiftData ? nextShiftData.start_time : new Date().toLocaleString();
                  
                  setShiftDetails({
                    shiftId: nextId,
                    operatorName: nextOperator,
                    startTime: nextStart,
                    endTime: '—',
                    status: 'Active'
                  });
                  setNextShiftData(null);
                  setTransactions([]); // Clear transactions for the new shift

                  // Unlock all dispensers
                  setDispensers(prev => prev.map(d => ({
                    ...d,
                    isBlocked: false,
                    nozzles: d.nozzles.map(n => ({
                      ...n,
                      status: 'Idle'
                    }))
                  })));

                  // Append shift alert log
                  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const launchAlert: ShiftAlert = {
                    id: `AL-LAUNCH-${Math.random()}`,
                    dateTime: `Hoy ${timeStr}`,
                    pumpName: `Sistema`,
                    volume: '—',
                    amount: '—',
                    paymentType: 'System',
                    message: `☀️ Inició Nuevo Turno: Operador asignado ${nextOperator}. Todas las caras de despacho se encuentran re-armadas y habilitadas con precios consolidados vigentes.`,
                    isCustomNote: true
                  };
                  setAlerts(prev => [launchAlert, ...prev]);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-2.5 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors uppercase tracking-wider"
              >
                <Unlock className="w-4 h-4" />
                <span>Iniciar Siguiente Turno (Habilitar Pistas)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
