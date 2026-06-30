/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CaraCard from './components/CaraCard';
import RecentTransactions from './components/RecentTransactions';
import { DispenserState, TankState, PriceConfig, ScheduledPrice, Transaction, ShiftAlert, ShiftDetails, FuelType, NozzleState, PaymentMethod, UserProfile, NozzleTransaction, PumpStatus } from './types';
import { INITIAL_DISPENSERS, INITIAL_TANKS, INITIAL_PRICES, INITIAL_SCHEDULED_PRICES, INITIAL_SHIFTS, INITIAL_USERS } from './data';
import { AlertOctagon, Fuel, Printer, Lock, Unlock, RefreshCw } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import { api, printReceiptWindow } from './api';
import SimUniPumpPanel from './components/SimUniPumpPanel';
import QuickSwitchModal from './components/QuickSwitchModal';
import PreAuthDialog from './components/PreAuthDialog';
import AddCaraDialog from './components/AddCaraDialog';
import ShiftReceiptModal from './components/ShiftReceiptModal';
import NozzleTransactionsModal from './components/NozzleTransactionsModal';
import { useSystemSettings } from './hooks/useSystemSettings';
import { useVisibilityPolling } from './hooks/useVisibilityPolling';
import { litersToDisplay, displayToLiters, unitLabel, formatVolume } from './utils/units';

const PriceConfigTab = lazy(() => import('./components/PriceConfigTab'));
const ShiftReportTab = lazy(() => import('./components/ShiftReportTab'));
const InventoryTab = lazy(() => import('./components/InventoryTab'));
const UserHubTab = lazy(() => import('./components/UserHubTab'));
const OtherTabs = lazy(() => import('./components/OtherTabs'));

function TabFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

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

const getOperationalInitialDispensers = (): DispenserState[] => (
  INITIAL_DISPENSERS.map(dispenser => ({
    ...dispenser,
    nozzles: dispenser.nozzles.map(nozzle => ({
      ...nozzle,
      status: nozzle.status === 'Blocked' ? 'Blocked' : 'Idle',
      currentAmount: 0,
      currentVolume: 0,
      limitAmount: undefined,
      progressPercent: 0,
      isPostpaid: false,
      pendingTransactions: [],
    })),
  }))
);

const normalizeBackendTransaction = (item: any): Transaction => {
  const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
  const nozzle = Number(item.nozzle || item.Nozzle || 1);
  const inferredFuel = fuelGrades[nozzle - 1] || 'Regular Unleaded';
  const rawFuel = item.fuelType || item.fuel_type || item.FuelGradeName || item.ProductName || item.Product || inferredFuel;
  const fuelType = fuelGrades.includes(rawFuel as FuelType) ? rawFuel as FuelType : inferredFuel;
  const pumpId = Number(item.pumpId || item.pump_id || item.Pump || 1);
  const pumpName = item.pumpName || item.pump_name || `Cara ${pumpId}`;

  return {
    id: String(item.id || item.transaction_id || item.trx_id || `TRX-${Date.now()}`),
    dateTime: item.dateTime || item.date_time || item.created_at || 'N/A',
    pumpId,
    pumpName: pumpName.includes('(') ? pumpName : `${pumpName} (${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : fuelType === 'Diesel' ? 'Diesel' : fuelType})`,
    volume: Number(item.volume || 0),
    amount: Number(item.amount || 0),
    fuelType,
    paymentType: item.paymentType || item.payment_type || 'Cash',
  };
};

export default function App() {
  const checkIsActiveNozzle = (nozzleFuelType: string, nozzleNumber: number, pumpData: any) => {
    const rawStatus = pumpData.status_type || pumpData.Status || pumpData.status;
    if (rawStatus === 'PumpIdleStatus' || rawStatus === 'PumpOfflineStatus') {
      return false;
    }
    
    // Restore original nozzle ID matching behavior for Pumps 2 and 4
    if (pumpData.pump === 2 || pumpData.pump === 4) {
      const activeNozzleNumber = pumpData.nozzle || pumpData.Nozzle || pumpData.NozzleUp || 0;
      return activeNozzleNumber === nozzleNumber;
    }
    
    const gradeName = pumpData.fuel_grade_name || pumpData.FuelGradeName;
    if (gradeName) {
      const grade = gradeName.toLowerCase();
      const type = nozzleFuelType.toLowerCase();
      if (grade.includes('diesel') && type.includes('diesel')) return true;
      if ((grade.includes('petrol') || grade.includes('regular') || grade.includes('super')) && type.includes('regular')) return true;
      if (grade.includes('premium') && type.includes('premium')) return true;
      if (grade.includes('lpg') && type.includes('lpg')) return true;
      if (grade.includes('kerosene') && type.includes('kerosene')) return true;
    }
    
    const activeNozzleNumber = pumpData.nozzle || pumpData.Nozzle || pumpData.NozzleUp || 0;
    return activeNozzleNumber === nozzleNumber;
  };

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
  const [dispensers, setDispensers] = useState<DispenserState[]>(getOperationalInitialDispensers);
  const [tanks, setTanks] = useState<TankState[]>(INITIAL_TANKS);
  // prices / setPrices come from useSystemSettings (defined below)
  const [scheduledPrices, setScheduledPrices] = useState<ScheduledPrice[]>(INITIAL_SCHEDULED_PRICES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<ShiftAlert[]>(INITIAL_SHIFTS);

  // Simulation play state
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // SimUniPump web states
  const [nozzleUpStates, setNozzleUpStates] = useState<{ [key: string]: boolean }>({});
  const [triggerStates, setTriggerStates] = useState<{ [key: string]: boolean }>({});

  // Connection health states
  const [isApiOnline, setIsApiOnline] = useState<boolean>(true);
  const [isPts2Online, setIsPts2Online] = useState<boolean>(false);

  // States for Nozzle pending transactions, modal & countdown scheduler
  const [consolidationSeconds, setConsolidationSeconds] = useState<number>(300);
  const [selectedNozzleForTrx, setSelectedNozzleForTrx] = useState<{ dispenserId: number; fuelType: FuelType } | null>(null);
  const completingNozzlesRef = useRef<Set<string>>(new Set());

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
  const [preauthMode, setPreauthMode] = useState<'Limit' | 'Full'>('Limit');
  const [preauthLimitType, setPreauthLimitType] = useState<'Amount' | 'Volume'>('Amount');
  const [preauthAmount, setPreauthAmount] = useState<string>('20.00');

  // Create Cara/Dispenser Dialog modal state
  const [isAddCaraModalOpen, setIsAddCaraModalOpen] = useState<boolean>(false);
  const [newCaraName, setNewCaraName] = useState<string>('');
  const [newCaraProducts, setNewCaraProducts] = useState<FuelType[]>(['Regular Unleaded', 'Premium Unleaded', 'Diesel']);

  // Configuración de Turnos y Métodos de Pago
  const [shiftCount, setShiftCount] = useState<number>(3);

  // System Settings — loaded via hook (centralizes fetch + price mapping)
  const {
    settings: systemSettings,
    prices,
    setPrices,
    updateSetting: updateSystemSetting,
    saveSetting: saveSystemSetting,
    refetch: fetchSystemSettings,
  } = useSystemSettings();

  const unitMeasure = systemSettings.unitMeasure;
  const currencySymbol = systemSettings.currencySymbol;
  const stationCountry = systemSettings.stationCountry;
  const stationCity = systemSettings.stationCity;
  const stationCanton = systemSettings.stationCanton;
  const stationDepartment = systemSettings.stationDepartment;

  // Aliases so handlers that call the old setters still compile
  const setUnitMeasure = (v: 'Galones' | 'Litros') => updateSystemSetting('unitMeasure', v);
  const setCurrencySymbol = (v: string) => updateSystemSetting('currencySymbol', v);
  const setStationCountry = (v: string) => updateSystemSetting('stationCountry', v);
  const setStationCity = (v: string) => updateSystemSetting('stationCity', v);
  const setStationCanton = (v: string) => updateSystemSetting('stationCanton', v);
  const setStationDepartment = (v: string) => updateSystemSetting('stationDepartment', v);

  // Load pending transactions once system settings are ready
  useEffect(() => {
    api.getPendingTransactions().then(pRes => {
      if (pRes.ok && pRes.data) {
        const dbPending = pRes.data;
        setDispensers(prev => prev.map(d => ({
          ...d,
          nozzles: d.nozzles.map(n => {
            const matches = dbPending.filter((pt: any) => pt.pumpId === d.id && pt.fuelType === n.fuelType);
            const mapped = matches.map((pt: any) => ({
              id: pt.id,
              dateTime: pt.dateTime,
              dispenserId: pt.pumpId,
              // DB stores liters — convert to display unit
              volume: litersToDisplay(pt.volume, unitMeasure),
              amount: pt.amount,
              fuelType: pt.fuelType,
              status: 'Pending' as const,
              billingType: 'Ticket' as const,
              createdAt: Date.now(),
            }));
            return { ...n, pendingTransactions: mapped };
          }),
        })));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitMeasure]);

  // Periodic health check — pauses when the tab is hidden (useVisibilityPolling)
  useVisibilityPolling(async () => {
    const health = await api.checkPts2Health();
    setIsApiOnline(health.apiConnected);
    setIsPts2Online(health.pts2Connected);
  }, 5000);

  // ─── PTS-2 Real-time pump status polling (every 2 seconds) ───────────────────
  // Maps jsonPTS states → dashboard states and updates volume/amount live.
  useEffect(() => {
    if (isSimulating) return;
    /**
     * Maps a jsonPTS status_type string to a dashboard PumpStatus.
     *
     * PumpIdleStatus        → 'Idle'
     * PumpFillingStatus     → 'Dispensing'  (with live volume/amount)
     * PumpEndOfTransaction  → 'EndOfTransaction'  (needs close + billing)
     * PumpAuthorizedStatus  → 'Authorized'  (authorized, nozzle not yet lifted)
     * PumpOfflineStatus     → 'Offline'
     */
    const mapPts2Status = (statusType: string): PumpStatus => {
      switch (statusType) {
        case 'PumpFillingStatus':      return 'Dispensing';
        case 'PumpEndOfTransactionStatus': return 'EndOfTransaction';
        case 'PumpAuthorizedStatus':   return 'Authorized';
        case 'PumpOfflineStatus':      return 'Offline';
        case 'PumpIdleStatus':
        default:                       return 'Idle';
      }
    };

    const pollPumps = async () => {
      const res = await api.getAllPumpsStatus(dispensers.length > 0 ? dispensers.length : 4);
      if (!res.ok || !res.pumps) return;

      setDispensers(prev => prev.map(dispenser => {
        const pumpData = res.pumps!.find(p => p.pump === dispenser.id);
        if (!pumpData) return dispenser;

        const pts2Status = mapPts2Status(pumpData.status_type);

        return {
          ...dispenser,
          nozzles: dispenser.nozzles.map((nozzle, nozzleIdx) => {
            // Determine if this nozzle is the active one from PTS-2
            const thisNozzleNumber = nozzleIdx + 1;
            const isActiveNozzle = checkIsActiveNozzle(nozzle.fuelType, thisNozzleNumber, pumpData);

            // --- State update logic ---
            // Only update nozzles from PTS-2 data when:
            //  a) The nozzle is actively dispensing or end-of-transaction (PTS-2 is authoritative)
            //  b) The nozzle was 'Authorized' (PTS-2 confirmed the authorization)
            //  c) The nozzle is offline
            //
            // We DON'T override 'Blocked' or 'Prepaid' that the operator set locally
            // (the PTS-2 can take up to 1-2s to reflect those — optimistic local state).

            if (pts2Status === 'Dispensing' && isActiveNozzle) {
              // Live dispensing: update volume, amount and progress
              const vol = pumpData.volume ?? nozzle.currentVolume;
              const amt = pumpData.amount ?? nozzle.currentAmount;
              const limit = nozzle.limitAmount;
              const progress = limit && limit > 0
                ? Math.min(100, Math.round((amt / limit) * 100))
                : nozzle.progressPercent;

              return {
                ...nozzle,
                status: 'Dispensing',
                currentVolume: vol,
                currentAmount: amt,
                progressPercent: progress,
              };
            }

            if (pts2Status === 'EndOfTransaction' && isActiveNozzle) {
              const lastVol = pumpData.last_volume ?? nozzle.currentVolume;
              const lastAmt = pumpData.last_amount ?? nozzle.currentAmount;

              // If it was a prepaid transaction, automatically close and complete it
              if (nozzle.status === 'Prepaid') {
                setTimeout(() => {
                  const trxId = `TRX-${Math.floor(200 + Math.random() * 800)}`;
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  // Add directly to shift transactions list
                  const formatted: Transaction = {
                    id: trxId,
                    dateTime: `Hoy ${timeStr}`,
                    pumpId: dispenser.id,
                    pumpName: `Cara ${dispenser.id} (${nozzle.fuelType === 'Regular Unleaded' ? 'Regular' : nozzle.fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'})`,
                    volume: lastVol,
                    amount: lastAmt,
                    fuelType: nozzle.fuelType,
                    paymentType: 'Cash'
                  };
                  setTransactions(prev => [formatted, ...prev]);

                  // Persist to PostgreSQL database
                  persistTransaction(dispenser.id, trxId, nozzle.fuelType, lastVol, lastAmt, 'Cash');

                  // Deduct fuel from tank level
                  setTanks(prevTanks => prevTanks.map(tank => {
                    if (tank.fuelType === nozzle.fuelType) {
                      const nextLvl = Math.max(0, tank.currentLevel - lastVol);
                      return {
                        ...tank,
                        currentLevel: parseFloat(nextLvl.toFixed(1)),
                        status: nextLvl < 3500 ? 'Low Level Alert' : 'OK'
                      };
                    }
                    return tank;
                  }));

                  // Close transaction on backend
                  api.closeTransaction(dispenser.id);

                  // Add shift alert
                  const customAlert: ShiftAlert = {
                    id: `AL-PAID-${Math.random()}`,
                    dateTime: `Hoy ${timeStr}`,
                    pumpName: `Cara ${dispenser.id}`,
                    volume: `${lastVol.toFixed(2)} L`,
                    amount: `$${lastAmt.toFixed(2)}`,
                    paymentType: 'Cash',
                    message: `✓ Pago Recibido (Prepago): Cobro de $${lastAmt.toFixed(2)} liquidado para la Cara ${dispenser.id} (${nozzle.fuelType}).`,
                    isCustomNote: true
                  };
                  setAlerts(prev => [customAlert, ...prev]);
                }, 10);

                return {
                  ...nozzle,
                  status: 'Idle',
                  currentVolume: 0.0,
                  currentAmount: 0.0,
                  progressPercent: 0,
                  limitAmount: undefined,
                  isPostpaid: false,
                };
              }

              // Otherwise (e.g. postpaid), show Unpaid (awaiting payment/close)
              return {
                ...nozzle,
                status: 'Unpaid',
                currentVolume: lastVol,
                currentAmount: lastAmt,
                progressPercent: 100,
              };
            }

            if (pts2Status === 'Authorized' && isActiveNozzle) {
              // Confirmed authorized by PTS-2 — keep as Prepaid in UI
              if (nozzle.status !== 'Prepaid') {
                return { ...nozzle, status: 'Prepaid' };
              }
            }

            if (pts2Status === 'Offline') {
              return { ...nozzle, status: 'Offline' };
            }

            if (pts2Status === 'Idle' && nozzle.status === 'Unpaid') {
              // The nozzle was Unpaid but now the pump is Idle (i.e. hung up).
              // Move the transaction to the pending transactions queue (venta en cola) and set nozzle status to Idle.
              setTimeout(() => {
                completeFuelingJob(dispenser.id, nozzle.currentVolume, nozzle.currentAmount, nozzle.fuelType);
                api.closeTransaction(dispenser.id);
              }, 10);

              return {
                ...nozzle,
                status: 'Idle',
                currentVolume: 0,
                currentAmount: 0,
                progressPercent: 0,
                isPostpaid: false,
                limitAmount: undefined,
              };
            }

            if (pts2Status === 'Idle' && isActiveNozzle) {
              // PTS-2 is now idle: only reset if dashboard also thinks it's done
              // (avoid resetting a Prepaid that the PTS-2 hasn't processed yet)
              if (nozzle.status === 'Dispensing') {
                return {
                  ...nozzle,
                  status: 'Idle',
                  currentVolume: 0,
                  currentAmount: 0,
                  progressPercent: 0,
                  isPostpaid: false,
                  limitAmount: undefined,
                };
              }
            }

            return nozzle;
          }),
        };
      }));
    };

    // Visibility-aware interval: skip polling when the tab is hidden
    const interval = setInterval(() => {
      if (!document.hidden) pollPumps();
    }, 2000);
    if (!document.hidden) pollPumps();
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispensers.length, isSimulating]);

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
          const normalized = (res.data as any[]).map(normalizeBackendTransaction);
          const uniqueTx = normalized.filter((tx, index, self) =>
            self.findIndex(t => t.id === tx.id) === index
          );
          setTransactions(uniqueTx);
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
      alert('Por favor ingrese un monto o volumen válido para pre-autorizar.');
      return;
    }

    setDispensers(prev => prev.map(d => {
      if (d.id === preauthorizingPumpId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === preauthFuelGrade) {
              return {
                ...n,
                status: 'Prepaid',
                limitAmount: valLimit,
                isPostpaid: preauthMode === 'Full',
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

    // Call backend to authorize the pump
    const nozzleNumber = Math.max(1, FUEL_GRADES.indexOf(preauthFuelGrade) + 1);
    
    if (preauthMode === 'Full') {
      api.postpayAuthorizePump(preauthorizingPumpId, nozzleNumber);
    } else {
      // PTS-2 expects volumes in liters — convert only when limit is by Volume
      const finalLimit = (preauthLimitType === 'Volume' && valLimit !== undefined)
        ? displayToLiters(valLimit, unitMeasure)
        : valLimit;
      api.authorizePump(
        preauthorizingPumpId,
        nozzleNumber,
        preauthMode === 'Limit' ? preauthLimitType : undefined,
        preauthMode === 'Limit' ? finalLimit : undefined,
      );
    }

    // Add alert log
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const getModeLabel = () => {
      if (preauthMode === 'Limit') {
        return preauthLimitType === 'Amount'
          ? `Prepago $${valLimit?.toFixed(2)}`
          : `Prepago ${valLimit?.toFixed(2)} ${unitMeasure === 'Galones' ? 'Gal' : 'L'}`;
      }
      return 'Tanque Lleno';
    };

    const authNote: ShiftAlert = {
      id: `AL-AUTH-${Math.random()}`,
      dateTime: `Hoy ${timeStr}`,
      pumpName: `Cara ${preauthorizingPumpId} (${preauthFuelGrade})`,
      volume: preauthMode === 'Limit' && preauthLimitType === 'Volume' && valLimit ? `${valLimit.toFixed(2)} ${unitMeasure === 'Galones' ? 'Gal' : 'L'}` : '0.00 Gal',
      amount: preauthMode === 'Full' ? 'Tanque Lleno' : (preauthMode === 'Limit' && preauthLimitType === 'Amount' && valLimit ? `$${valLimit.toFixed(2)}` : 'S/L'),
      paymentType: preauthMode === 'Full' ? 'Postpago' : 'Pre-auth',
      message: `Cara ${preauthorizingPumpId} autorizada para carga de ${preauthFuelGrade} (${getModeLabel()})`,
      isCustomNote: true
    };
    setAlerts(prev => [authNote, ...prev]);
    setPreauthorizingPumpId(null);
  };

  // SimUniPump web simulator event handlers
  const handleToggleNozzleUp = (dispenserId: number, fuelType: FuelType) => {
    const key = `${dispenserId}-${fuelType}`;
    const wasUp = !!nozzleUpStates[key];
    const nextUp = !wasUp;

    setNozzleUpStates(prev => ({
      ...prev,
      [key]: nextUp
    }));

    if (!nextUp) {
      // Nozzle is hung up: clear trigger and if it was dispensing, complete it
      setTriggerStates(prev => ({
        ...prev,
        [key]: false
      }));

      setDispensers(prev => prev.map(d => {
        if (d.id === dispenserId) {
          return {
            ...d,
            nozzles: d.nozzles.map(n => {
              if (n.fuelType === fuelType && n.status === 'Dispensing') {
                const finalAmount = n.currentAmount;
                const finalVolume = n.currentVolume;
                setTimeout(() => {
                  completeFuelingJob(dispenserId, finalVolume, finalAmount, fuelType);
                }, 10);
                return {
                  ...n,
                  status: 'Idle',
                  currentAmount: 0.0,
                  currentVolume: 0.0,
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
    }
  };

  const handleToggleTrigger = (dispenserId: number, fuelType: FuelType) => {
    const key = `${dispenserId}-${fuelType}`;
    const wasActive = !!triggerStates[key];
    const nextActive = !wasActive;

    setTriggerStates(prev => ({
      ...prev,
      [key]: nextActive
    }));

    if (nextActive) {
      // If nozzle is up and authorized (Prepaid or postpaid), transition to Dispensing
      setDispensers(prev => prev.map(d => {
        if (d.id === dispenserId) {
          return {
            ...d,
            nozzles: d.nozzles.map(n => {
              if (n.fuelType === fuelType) {
                if (n.status === 'Prepaid' || n.isPostpaid) {
                  api.startDispensing(dispenserId);
                  return {
                    ...n,
                    status: 'Dispensing',
                    progressPercent: n.progressPercent || 0
                  };
                }
              }
              return n;
            })
          };
        }
        return d;
      }));
    }
  };

  const handleResetAllSimulator = () => {
    setNozzleUpStates({});
    setTriggerStates({});
    setDispensers(prev => prev.map(d => ({
      ...d,
      nozzles: d.nozzles.map(n => ({
        ...n,
        status: n.status === 'Dispensing' || n.status === 'Prepaid' ? 'Idle' : n.status,
        currentAmount: 0.0,
        currentVolume: 0.0,
        progressPercent: 0,
        limitAmount: undefined,
        isPostpaid: false
      }))
    })));
  };

  // Launch pre-authorized fuel load or simulate free refueling trigger
  const handleStartFuelingJob = (dispenserId: number, fuelType: FuelType) => {
    // Sync SimUniPump visual state: set nozzle to Up
    const key = `${dispenserId}-${fuelType}`;
    setNozzleUpStates(prev => ({ ...prev, [key]: true }));

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

    // Sync SimUniPump visual state: set nozzle to Up
    const key = `${dispenserId}-${fuelType}`;
    setNozzleUpStates(prev => ({ ...prev, [key]: true }));

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
    const nozzleNumber = Math.max(1, FUEL_GRADES.indexOf(fuelType) + 1);
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

  // Stop dispenser logically (PumpStop)
  const handleStopPump = (dispenserId: number, fuelType: FuelType) => {
    // Call backend to trigger stop
    api.stopPump(dispenserId).then(() => {
      // Add shift alert log
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const stopNote: ShiftAlert = {
        id: `AL-STP-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Cara ${dispenserId}`,
        volume: '0.00 Gal',
        amount: '$0.00',
        paymentType: 'Stop',
        message: `Mando de Detener (PumpStop) enviado a la Cara ${dispenserId} (${fuelType})`,
        isCustomNote: true
      };
      setAlerts(prev => [stopNote, ...prev]);
    });
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
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPrices(prev => prev.map(p =>
      p.fuelType === fuelType ? { ...p, price: newPrice, lastUpdated: `Hoy ${timeStr}` } : p
    ));

    const nozzleNumber = FUEL_GRADES.indexOf(fuelType) + 1;
    dispensers.forEach(d => {
      api.setPumpPrices(d.id, [{ nozzle: nozzleNumber, price: newPrice }]);
    });
  };

  const FUEL_GRADES: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene', 'LPG'];
  const PRICE_SETTING_KEY: Record<FuelType, string> = {
    'Regular Unleaded': 'price_regular_unleaded',
    'Premium Unleaded': 'price_premium_unleaded',
    'Diesel': 'price_diesel',
    'Kerosene': 'price_kerosene',
    'LPG': 'price_lpg',
  };

  const handleFetchPricesFromPts2 = async () => {
    const res = await api.getPumpPrices(1);
    if (!res.ok || !res.prices || res.prices.length === 0) {
      throw new Error(res.error || 'No se pudieron recuperar los precios desde el controlador PTS-2.');
    }
    for (const p of prices) {
      const nozzleNumber = FUEL_GRADES.indexOf(p.fuelType) + 1;
      const match = res.prices.find((item: any) => (item.Nozzle || item.nozzle) === nozzleNumber);
      if (match) {
        const priceVal = match.Price ?? p.price;
        setPrices(prev => prev.map(old =>
          old.fuelType === p.fuelType
            ? { ...old, price: priceVal, lastUpdated: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` }
            : old
        ));
        await saveSystemSetting(PRICE_SETTING_KEY[p.fuelType], String(priceVal));
      }
    }
  };

  const handleSyncPricesToPts2 = async () => {
    for (const p of prices) {
      const nozzleNumber = FUEL_GRADES.indexOf(p.fuelType) + 1;
      await saveSystemSetting(PRICE_SETTING_KEY[p.fuelType], String(p.price));
      for (const d of dispensers) {
        if (d.nozzles.some(n => n.fuelType === p.fuelType)) {
          await api.setPumpPrices(d.id, [{ nozzle: nozzleNumber, price: p.price }]);
        }
      }
    }
  };

  // Adding programmed price plan
  const handleAddScheduledPrice = (dateTime: string, fuelType: FuelType, newPrice: number) => {
    const randomId = `SP-${Math.floor(100 + Math.random() * 900)}`;
    setScheduledPrices(prev => [{ id: randomId, dateTime, fuelType, newPrice, status: 'Pending' }, ...prev]);
    api.createScheduledPrice({ id: randomId, date_time: dateTime, fuel_type: fuelType, new_price: newPrice })
      .then(res => { if (!res.ok) console.error('Error al agendar precio en backend:', res.error); });
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
  const handleRefillTank = (tankId: string, amount: number) => {
    const label = unitLabel(unitMeasure);
    setTanks(prev => prev.map(t => {
      if (t.id === tankId) {
        const newLvl = Math.min(t.maxCapacity, t.currentLevel + amount);
        const dayRemaining = newLvl >= 5000 ? 5 : newLvl >= 3000 ? 3 : 1;
        return {
          ...t,
          currentLevel: newLvl,
          recentDelivery: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${amount} ${label})`,
          status: newLvl < 3500 ? 'Low Level Alert' : 'OK',
          estDaysRemaining: dayRemaining,
        };
      }
      return t;
    }));

    // DB always stores liters
    const liters = displayToLiters(amount, unitMeasure);
    const tankNum = parseInt(tankId.replace('T-', '')) || 1;
    api.saveTankDelivery(tankNum, liters, undefined, 'Chofer Cisterna', 'TRUCK-109', `Recarga de ${amount} ${label}`);
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
      
      // Move pending rows into the final backend ledger
      allNewTransactions.forEach(tx => {
        processPendingTransactionInBackend(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType, 'Bajada');
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

    // Save to transient pending transactions database (DB always stores liters)
    const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const nozzleIndex = fuelGrades.indexOf(fuelType);
    const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;
    api.savePendingTransaction(dispenserId, randomTrxId, nozzleNumber, displayToLiters(volume, unitMeasure), amount, fuelType);

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

  const buildCombinedNozzleTransaction = (
    transactionsToCombine: NozzleTransaction[],
    dispenserId: number,
    fuelType: FuelType,
    documentNumber?: string
  ): NozzleTransaction => ({
    id: transactionsToCombine.length === 1 ? transactionsToCombine[0].id : documentNumber || `LOTE-${Date.now()}`,
    dateTime: transactionsToCombine.length === 1 ? transactionsToCombine[0].dateTime : `Lote ${transactionsToCombine.length} despachos`,
    dispenserId,
    volume: transactionsToCombine.reduce((sum, tx) => sum + tx.volume, 0),
    amount: transactionsToCombine.reduce((sum, tx) => sum + tx.amount, 0),
    fuelType,
    status: 'Processed',
    createdAt: Date.now(),
  });

  const handleProcessSelectedNozzleTrxs = (
    dispenserId: number,
    fuelType: FuelType,
    trxIds: string[],
    billingType: 'Bajada' | 'Ticket' | 'Factura' = 'Bajada',
    clientName?: string,
    clientRuc?: string,
    documentNumber?: string
  ): NozzleTransaction | null => {
    let processedTrxs: NozzleTransaction[] = [];
    const trxIdSet = new Set(trxIds);
    
    setDispensers(prev => prev.map(d => {
      if (d.id === dispenserId) {
        return {
          ...d,
          nozzles: d.nozzles.map(n => {
            if (n.fuelType === fuelType) {
              const trxs = n.pendingTransactions || [];
              processedTrxs = trxs
                .filter(t => trxIdSet.has(t.id))
                .map(t => ({ ...t, status: 'Processed', billingType }));
              return {
                ...n,
                pendingTransactions: trxs.filter(t => !trxIdSet.has(t.id))
              };
            }
            return n;
          })
        };
      }
      return d;
    }));

    if (processedTrxs.length > 0) {
      const formattedTransactions: Transaction[] = processedTrxs.map(pTx => ({
        id: pTx.id,
        dateTime: pTx.dateTime,
        pumpId: dispenserId,
        pumpName: `Cara ${dispenserId} (${fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Super' : 'Diesel'})`,
        volume: pTx.volume,
        amount: pTx.amount,
        fuelType: pTx.fuelType,
        paymentType: billingType === 'Factura' ? 'Credit Card' : 'Cash' // Map paymentType
      }));

      setTransactions(prev => [...formattedTransactions, ...prev]);

      // Move from pending_transactions into pump_transactions in the backend ledger
      processedTrxs.forEach((pTx) => {
        processPendingTransactionInBackend(
          dispenserId,
          pTx.id,
          pTx.fuelType,
          pTx.volume,
          pTx.amount,
          billingType === 'Factura' ? 'Credit Card' : 'Cash',
          billingType,
          documentNumber
        );
      });

      // Trigger safety log note
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const combinedTx = buildCombinedNozzleTransaction(processedTrxs, dispenserId, fuelType, documentNumber);
      const verifyNote: ShiftAlert = {
        id: `SYS-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Cara ${dispenserId}`,
        volume: `${combinedTx.volume.toFixed(1)} Gal`,
        amount: `$${combinedTx.amount.toFixed(2)}`,
        paymentType: billingType,
        message: `${processedTrxs.length === 1 ? `Despacho ${processedTrxs[0].id}` : `Lote de ${processedTrxs.length} despachos`} procesado como ${billingType === 'Factura' ? `Factura (RUC: ${clientRuc || '—'})` : billingType === 'Ticket' ? 'Ticket de Venta' : 'Bajada directa'}.`,
        isCustomNote: true
      };
      setAlerts(prev => [verifyNote, ...prev]);
      return combinedTx;
    }
    return null;
  };

  // Process single pending nozzle transaction manually
  const handleProcessSingleNozzleTrx = (
    dispenserId: number,
    fuelType: FuelType,
    trxId: string,
    billingType: 'Bajada' | 'Ticket' | 'Factura' = 'Bajada',
    clientName?: string,
    clientRuc?: string,
    documentNumber?: string
  ) => {
    return handleProcessSelectedNozzleTrxs(dispenserId, fuelType, [trxId], billingType, clientName, clientRuc, documentNumber);
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

      // Move pending rows into the final backend ledger
      newTransactions.forEach(tx => {
        processPendingTransactionInBackend(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType, 'Bajada');
      });

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const summaryAlert: ShiftAlert = {
        id: `SYS-AL-${Math.random()}`,
        dateTime: `Hoy ${timeStr}`,
        pumpName: `Cara ${dispenserId}`,
        volume: `${newTransactions.reduce((acc, t) => acc + t.volume, 0).toFixed(1)} ${unitMeasure === 'Galones' ? 'Gal' : 'L'}`,
        amount: `${currencySymbol}${newTransactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}`,
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

  // WebSocket connection for real-time dispenser updates
  useEffect(() => {
    if (isSimulating) return;

    const sockets: WebSocket[] = [];
    const baseApiUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8002';
    const baseWsUrl = baseApiUrl.replace('http://', 'ws://').replace('https://', 'wss://');

    dispensers.forEach(disp => {
      const wsUrl = `${baseWsUrl}/ws/pumps?pump_id=${disp.id}&interval=0.5`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'pump_status' && payload.data) {
            const backendStatus = payload.data;
            const nozzleId = backendStatus.Nozzle || backendStatus.nozzle || 1;
            const volume = backendStatus.Volume !== undefined ? backendStatus.Volume : backendStatus.volume || 0;
            const amount = backendStatus.Amount !== undefined ? backendStatus.Amount : backendStatus.amount || 0;
            const rawStatus = backendStatus.Status || backendStatus.status;

            setDispensers(prev => prev.map(d => {
              if (d.id === disp.id) {
                const activeNozzleId = backendStatus.Nozzle || backendStatus.nozzle || 0;
                return {
                  ...d,
                  nozzles: d.nozzles.map((n, idx) => {
                    const thisNozzleNumber = idx + 1;
                    const isTargetNozzle = checkIsActiveNozzle(n.fuelType, thisNozzleNumber, backendStatus);

                    let mappedStatus = n.status;
                    let currentVol = isTargetNozzle ? volume : 0;
                    let currentAmt = isTargetNozzle ? amount : 0;

                    if (n.status === 'Unpaid') {
                      mappedStatus = 'Unpaid';
                      currentVol = n.currentVolume;
                      currentAmt = n.currentAmount;
                    } else if (rawStatus === 'PumpOfflineStatus') {
                      mappedStatus = 'Blocked';
                    } else if (rawStatus === 'PumpIdleStatus') {
                      if (isTargetNozzle) {
                        mappedStatus = 'Ready';
                      } else {
                        mappedStatus = 'Idle';
                      }
                    } else if (rawStatus === 'PumpFillingStatus') {
                      if (isTargetNozzle) {
                        mappedStatus = 'Dispensing';
                      } else {
                        mappedStatus = 'Idle';
                      }
                    } else if (rawStatus === 'PumpEndOfTransactionStatus') {
                      if (isTargetNozzle) {
                        mappedStatus = 'Unpaid';
                        currentVol = volume || n.currentVolume;
                        currentAmt = amount || n.currentAmount;
                      } else {
                        mappedStatus = 'Idle';
                      }
                    }

                    return {
                      ...n,
                      status: mappedStatus,
                      currentAmount: currentAmt,
                      currentVolume: currentVol,
                      progressPercent: (isTargetNozzle && rawStatus === 'PumpFillingStatus')
                        ? Math.min(99, Math.round((volume / 15) * 100))
                        : (isTargetNozzle ? n.progressPercent : 0)
                    };
                  })
                };
              }
              return d;
            }));
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn(`WebSocket error on pump ${disp.id}:`, err);
      };

      sockets.push(ws);
    });

    return () => {
      sockets.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      });
    };
  }, [isSimulating, dispensers.length]);

  // Polling effect to sync with the backend (tanks and prices) when online (isSimulating = false)
  useEffect(() => {
    if (isSimulating) return;

    let active = true;
    const interval = setInterval(async () => {
      // Fetch tank levels (convert Liters to Gallons)
      const tankRes = await api.getProbeMeasurements();
      if (!active) return;
      if (tankRes.ok && tankRes.measurements) {
        setTanks(prev => prev.map(t => {
          const matchId = t.id === 'T-01' ? 1 : t.id === 'T-02' ? 2 : t.id === 'T-03' ? 3 : 0;
          const meas: any = tankRes.measurements?.find((m: any) => (m.Probe || m.probe || m.tank_id) === matchId);
          const rawVol = meas
            ? (meas.ProductVolume ?? meas.product_volume ?? meas.volume)
            : undefined;
          if (meas && rawVol !== undefined) {
            // rawVol from PTS-2 is always in liters — convert to display unit
            const displayVol = parseFloat(litersToDisplay(rawVol, unitMeasure).toFixed(1));
            return {
              ...t,
              currentLevel: displayVol,
              status: (displayVol / t.maxCapacity) < 0.15 ? 'Low Level Alert' : 'OK',
            };
          }
          return t;
        }));
      }

      // Fetch current active prices from PTS-2 (using pump 1 as reference) if online
      if (isPts2Online) {
        const priceRes = await api.getPumpPrices(1);
        if (!active) return;
        if (priceRes.ok && priceRes.prices && priceRes.prices.length > 0) {
          const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
          setPrices(currentPrices => currentPrices.map(p => {
            const nozzleIndex = fuelGrades.indexOf(p.fuelType);
            const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;
            const match = priceRes.prices?.find((item: any) => (item.Nozzle || item.nozzle) === nozzleNumber);
            if (match) {
              const priceVal = match.Price !== undefined ? match.Price : p.price;
              if (p.price !== priceVal) {
                return {
                  ...p,
                  price: priceVal,
                  lastUpdated: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                };
              }
            }
            return p;
          }));
        }
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
  }, [isSimulating, unitMeasure, isPts2Online]);

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
          processPendingTransactionInBackend(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType, 'Bajada');
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
    // Fetch pumps configuration
    api.getPumpsConfiguration().then(res => {
      if (res.ok && res.data) {
        const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene', 'LPG'];
        const mappedPumps = res.data.map((p: any) => {
          const nozzles = [];
          const count = p.nozzles_count || 3;
          for (let i = 0; i < count; i++) {
            nozzles.push({
              fuelType: fuelGrades[i] || 'Regular Unleaded',
              status: 'Idle' as PumpStatus,
              currentAmount: 0.0,
              currentVolume: 0.0,
              progressPercent: 0,
            });
          }
          return {
            id: p.id,
            name: p.name || `Cara ${p.id}`,
            nozzles: nozzles,
          };
        });
        setDispensers(mappedPumps);
      }
    });

    // Fetch tanks configuration
    api.getTanksConfiguration().then(res => {
      if (res.ok && res.data) {
        const mappedTanks = res.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          fuelType: item.fuelType as FuelType,
          currentLevel: item.fuelType === 'Regular Unleaded' ? 6525.0 : item.fuelType === 'Diesel' ? 6736.4 : 412.1,
          maxCapacity: item.maxCapacity || 26417.0,
          recentDelivery: item.fuelType === 'Regular Unleaded' ? '2024-05-25 (2000 Gal)' : item.fuelType === 'Diesel' ? '2024-05-20 (1500 Gal)' : '2024-05-26 (3000 Gal)',
          estDaysRemaining: item.fuelType === 'Regular Unleaded' ? 5 : item.fuelType === 'Diesel' ? 8 : 2,
          status: item.fuelType === 'LPG' ? 'Low Level Alert' : 'OK'
        }));
        setTanks(mappedTanks);
      }
    });

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
              const normalized = (tRes.data as any[]).map(normalizeBackendTransaction);
              const uniqueTx = normalized.filter((tx, index, self) =>
                self.findIndex(t => t.id === tx.id) === index
              );
              setTransactions(uniqueTx);
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

      // Move pending rows into the final backend ledger
      expiredTransactions.forEach(tx => {
        processPendingTransactionInBackend(tx.pumpId, tx.id, tx.fuelType, tx.volume, tx.amount, tx.paymentType, 'Bajada');
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
            const key = `${d.id}-${n.fuelType}`;
            const isTriggerActive = !!triggerStates[key];
            if (n.status === 'Dispensing' && isTriggerActive) {
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
  }, [isSimulating, prices, triggerStates]);

  // Helper to persist transaction to Postgres backend database
  const persistTransaction = (
    pumpId: number,
    trxId: string,
    fuelType: FuelType,
    volume: number,
    amount: number,
    paymentType: string
  ) => {
    let numericTrxId = 0;
    for (let i = 0; i < trxId.length; i++) {
      const char = trxId.charCodeAt(i);
      numericTrxId = (numericTrxId << 5) - numericTrxId + char;
      numericTrxId = numericTrxId & numericTrxId;
    }
    numericTrxId = Math.abs(numericTrxId) % 10000000;
    const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const nozzleIndex = fuelGrades.indexOf(fuelType);
    const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;

    // Convert volume to liters only if unitMeasure is Galones
    const volumeLiters = unitMeasure === 'Galones' ? volume * 3.78541 : volume;

    api.saveTransaction(pumpId, numericTrxId, nozzleNumber, volumeLiters, amount, paymentType).then(res => {
      if (res.ok) {
        console.log(`Transaction ${trxId} persisted in Postgres successfully`);
      }
    });
  };

  const processPendingTransactionInBackend = (
    pumpId: number,
    trxId: string,
    fuelType: FuelType,
    volume: number,
    amount: number,
    paymentType: string,
    documentType?: 'Bajada' | 'Ticket' | 'Factura',
    documentNumber?: string
  ) => {
    const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
    const nozzleIndex = fuelGrades.indexOf(fuelType);
    const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;
    const volumeLiters = unitMeasure === 'Galones' ? volume * 3.78541 : volume;
    const processPayload = {
      payment_type: paymentType,
      status: 'Completed',
      document_type: documentType,
      document_number: documentNumber,
      cashier_name: currentUser?.name,
    };

    api.processPendingTransaction(pumpId, trxId, processPayload).then(async res => {
      if (!res.ok) {
        const pendingRes = await api.savePendingTransaction(pumpId, trxId, nozzleNumber, volumeLiters, amount, fuelType);
        if (pendingRes.ok) {
          await api.processPendingTransaction(pumpId, trxId, processPayload);
        } else {
          console.error(`[processPendingTransactionInBackend] No se pudo garantizar pending ${trxId}:`, pendingRes.error);
        }
      }
    });
  };

  // Completions logic: Deduct fuel from tanks, register transaction, make sound alert
  const completeFuelingJob = (
    dispenserId: number, 
    volume: number, 
    amount: number, 
    fuelType: FuelType,
    paymentType?: 'Credit Card' | 'Debit Card' | 'Cash' | 'Fleet Card',
    trxId?: string,
    dateTimeStr?: string
  ) => {
    const completionKey = `${dispenserId}:${fuelType}`;
    if (!trxId && completingNozzlesRef.current.has(completionKey)) {
      return;
    }
    if (!trxId) {
      completingNozzlesRef.current.add(completionKey);
      window.setTimeout(() => {
        completingNozzlesRef.current.delete(completionKey);
      }, 2000);
    }

    // 1. Add Transaction Log (Pending at Nozzle Level)
    const randomTrxId = trxId || `TRX-${Math.floor(200 + Math.random() * 800)}`;
    const now = new Date();
    const timeStr = dateTimeStr || `Hoy ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const randPayment: 'Credit Card' | 'Debit Card' | 'Cash' | 'Fleet Card' = 
      paymentType || (Math.random() > 0.6 ? 'Credit Card' : Math.random() > 0.4 ? 'Debit Card' : Math.random() > 0.2 ? 'Cash' : 'Fleet Card');

    const nozzleTrx: NozzleTransaction = {
      id: randomTrxId,
      dateTime: timeStr.includes('Hoy') ? timeStr : `Hoy ${timeStr}`,
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
              const alreadyExists = n.pendingTransactions?.some(pt => pt.id === randomTrxId);
              if (alreadyExists) return n;
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

    // Save to transient pending transactions database if it's a new completed sale (not restoring from DB)
    if (!trxId) {
      const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
      const nozzleIndex = fuelGrades.indexOf(fuelType);
      const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;
      const volumeLiters = unitMeasure === 'Galones' ? volume * 3.78541 : volume;
      console.log(`[completeFuelingJob] Guardando venta en cola en BD: pump=${dispenserId}, trx=${randomTrxId}, nozzle=${nozzleNumber}, volume=${volumeLiters}, amount=${amount}`);
      api.savePendingTransaction(dispenserId, randomTrxId, nozzleNumber, volumeLiters, amount, fuelType).then(res => {
        if (res.ok) {
          console.log(`[completeFuelingJob] Venta en cola ${randomTrxId} guardada en BD exitosamente.`);
        } else {
          console.error(`[completeFuelingJob] Error guardando venta en cola ${randomTrxId} en BD:`, res.error);
        }
      });
    }

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
                  <button
                    onClick={() => handleCloseShift({})}
                    className="bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white font-sans font-bold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                    title="Cerrar el turno directamente desde el panel principal"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cerrar Turno</span>
                  </button>

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

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="dashboard-dispensers-grid">
                {dispensers.map((dispenser) => (
                  <CaraCard
                    key={dispenser.id}
                    dispenser={dispenser}
                    unitMeasure={unitMeasure}
                    currencySymbol={currencySymbol}
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
                      'LPG': prices.find(p => p.fuelType === 'LPG')?.price || 3.50,
                    }}
                    enabledPaymentMethods={enabledPaymentMethods}
                    paymentMethods={paymentMethods}
                    onStopPump={handleStopPump}
                    onPressNozzle={(dispenserId, fuelType) => {
                      setSelectedNozzleForTrx({ dispenserId, fuelType });
                    }}
                  />
                ))}
              </div>

              <div className="my-6">
                <SimUniPumpPanel
                  dispensers={dispensers}
                  isSimulating={isSimulating}
                  setIsSimulating={setIsSimulating}
                  onToggleNozzleUp={handleToggleNozzleUp}
                  nozzleUpStates={nozzleUpStates}
                  triggerStates={triggerStates}
                  onToggleTrigger={handleToggleTrigger}
                  onResetAllSimulator={handleResetAllSimulator}
                />
              </div>

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
                  <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50 animate-bounce" />
                  <span className="text-[10px] font-medium text-rose-400 font-bold">Cobro Pendiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                  <span className="text-[10px] font-medium text-slate-400">Bloqueada / Cerrada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-medium text-slate-400">Sin Señal / Offline</span>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-3">
              <RecentTransactions
                transactions={transactions}
                searchQuery={searchQuery}
                currencySymbol={currencySymbol}
                unitMeasure={unitMeasure}
              />
            </div>
          </div>
        );
        
      case 'priceConfig': {
        const enrichedPrices = prices
          .filter(p => tanks.some(t => t.fuelType === p.fuelType))
          .map(p => {
            const matchedTanks = tanks.filter(t => t.fuelType === p.fuelType).map(t => t.name);
            return {
              ...p,
              tankNames: matchedTanks.join(', ')
            };
          });

        const filteredScheduledPrices = scheduledPrices.filter(sp =>
          tanks.some(t => t.fuelType === sp.fuelType)
        );

        return (
          <Suspense fallback={<TabFallback />}>
            <PriceConfigTab
              prices={enrichedPrices}
              scheduledPrices={filteredScheduledPrices}
              onUpdatePrice={handleUpdatePrice}
              onAddScheduledPrice={handleAddScheduledPrice}
              onCancelScheduledPrice={handleCancelScheduledPrice}
              onFetchPricesFromPts2={handleFetchPricesFromPts2}
              onSyncPricesToPts2={handleSyncPricesToPts2}
            />
          </Suspense>
        );
      }

      case 'shiftReport': {
        const currentlyDispensingCount = dispensers.reduce((cnt, d) => {
          return cnt + d.nozzles.filter(n => n.status === 'Dispensing').length;
        }, 0);
        return (
          <Suspense fallback={<TabFallback />}>
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
          </Suspense>
        );
      }

      case 'inventory':
        return (
          <div className="space-y-6">
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
                              <span className="font-sans text-slate-500">{tank.name} ({tank.fuelType === 'Regular Unleaded' ? 'Regular' : tank.fuelType === 'Premium Unleaded' ? 'Súper' : tank.fuelType === 'Diesel' ? 'Diesel' : 'LPG'}):</span>
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
            <Suspense fallback={<TabFallback />}>
              <InventoryTab
                tanks={tanks}
                onRefillTank={handleRefillTank}
                onAddTank={handleAddTank}
                setTanks={setTanks}
              />
            </Suspense>
          </div>
        );

      case 'users':
        return (
          <Suspense fallback={<TabFallback />}>
            <UserHubTab
              currentUser={currentUser}
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          </Suspense>
        );

      default:
        // Transactions, Monthly summary, Cards/Flotas, Settings, Help tabs
        return (
          <Suspense fallback={<TabFallback />}>
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
          </Suspense>
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
        isApiOnline={isApiOnline}
        isPts2Online={isPts2Online}
      />

      <QuickSwitchModal
        pendingSwitchUser={pendingSwitchUser}
        onClose={() => {
          setPendingSwitchUser(null);
          setQuickSwitchPin('');
          setQuickSwitchError('');
        }}
        onSwitchSuccess={(user) => {
          setCurrentUser(user);
          setPendingSwitchUser(null);
          setQuickSwitchPin('');
          setQuickSwitchError('');
        }}
      />

      <NozzleTransactionsModal
        selectedNozzleForTrx={selectedNozzleForTrx}
        onClose={() => setSelectedNozzleForTrx(null)}
        dispensers={dispensers}
        prices={prices}
        unitMeasure={unitMeasure}
        currencySymbol={currencySymbol}
        shiftDetails={shiftDetails}
        currentUser={currentUser}
        onGenerateMockDispatch={handleGenerateMockDispatch}
        onProcessAllNozzleTrxs={handleProcessAllNozzleTrxs}
        onProcessSelectedNozzleTrxs={handleProcessSelectedNozzleTrxs}
        buildCombinedNozzleTransaction={buildCombinedNozzleTransaction}
      />

      <PreAuthDialog
        preauthorizingPumpId={preauthorizingPumpId}
        dispensers={dispensers}
        prices={prices}
        unitMeasure={unitMeasure}
        currencySymbol={currencySymbol}
        onConfirm={({ pumpId, fuelType, mode, limitType, amount: valLimit }) => {
          if (isShiftClosing) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const errorAlert: ShiftAlert = {
              id: `AL-SH-PREAUTH-ERR-${Math.random()}`,
              dateTime: `Hoy ${timeStr}`,
              pumpName: 'Pistas',
              volume: '—',
              amount: '—',
              paymentType: 'System',
              message: '🚫 Bloqueo de Cierre: No se permiten nuevas pre-autorizaciones durante el proceso de cierre de turno.',
              isCustomNote: true,
            };
            setAlerts(prev => [errorAlert, ...prev]);
            return;
          }

          setDispensers(prev => prev.map(d => {
            if (d.id === pumpId) {
              return {
                ...d,
                nozzles: d.nozzles.map(n => {
                  if (n.fuelType === fuelType) {
                    return {
                      ...n,
                      status: 'Prepaid',
                      limitAmount: mode === 'Limit' ? valLimit : undefined,
                      isPostpaid: mode === 'Full',
                      currentAmount: 0.0,
                      currentVolume: 0.0,
                      progressPercent: 0,
                    };
                  }
                  return n;
                }),
              };
            }
            return d;
          }));

          const fuelGrades: FuelType[] = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene'];
          const nozzleIndex = fuelGrades.indexOf(fuelType);
          const nozzleNumber = nozzleIndex >= 0 ? nozzleIndex + 1 : 1;

          if (mode === 'Full') {
            api.postpayAuthorizePump(pumpId, nozzleNumber);
          } else {
            let finalLimit = valLimit;
            if (limitType === 'Volume' && valLimit !== undefined && unitMeasure === 'Galones') {
              finalLimit = valLimit * 3.78541;
            }
            api.authorizePump(pumpId, nozzleNumber, mode === 'Limit' ? limitType : undefined, mode === 'Limit' ? finalLimit : undefined);
          }

          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const getModeLabel = () => {
            if (mode === 'Limit') {
              return limitType === 'Amount'
                ? `Prepago $${valLimit?.toFixed(2)}`
                : `Prepago ${valLimit?.toFixed(2)} ${unitMeasure === 'Galones' ? 'Gal' : 'L'}`;
            }
            return 'Tanque Lleno';
          };

          const authNote: ShiftAlert = {
            id: `AL-AUTH-${Math.random()}`,
            dateTime: `Hoy ${timeStr}`,
            pumpName: `Cara ${pumpId} (${fuelType})`,
            volume: mode === 'Limit' && limitType === 'Volume' && valLimit ? `${valLimit.toFixed(2)} ${unitMeasure === 'Galones' ? 'Gal' : 'L'}` : '0.00 Gal',
            amount: mode === 'Full' ? 'Tanque Lleno' : (mode === 'Limit' && limitType === 'Amount' && valLimit ? `$${valLimit.toFixed(2)}` : 'S/L'),
            paymentType: mode === 'Full' ? 'Postpago' : 'Pre-auth',
            message: `Cara ${pumpId} autorizada para carga de ${fuelType} (${getModeLabel()})`,
            isCustomNote: true,
          };
          setAlerts(prev => [authNote, ...prev]);
          setPreauthorizingPumpId(null);
        }}
        onCancel={() => setPreauthorizingPumpId(null)}
      />

      <AddCaraDialog
        isOpen={isAddCaraModalOpen}
        onConfirm={(name, products) => {
          const nextId = dispensers.length > 0 ? Math.max(...dispensers.map(d => d.id)) + 1 : 1;
          const newDispenser: DispenserState = {
            id: nextId,
            name: name.trim(),
            nozzles: products.map(fuelType => ({
              fuelType,
              status: 'Idle' as PumpStatus,
              currentAmount: 0.0,
              currentVolume: 0.0,
              progressPercent: 0,
            })),
          };
          setDispensers(prev => [...prev, newDispenser]);

          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const alertNote: ShiftAlert = {
            id: `AL-ADD-${Math.random()}`,
            dateTime: `Hoy ${timeStr}`,
            pumpName: name.trim(),
            volume: '—',
            amount: '—',
            paymentType: 'System',
            message: `NUEVO DISPENSADOR INSTALADO: Se ha habilitado ${name.trim()} con ${products.length} mangueras (${products.map(fp => fp.split(' ')[0]).join(', ')}).`,
            isCustomNote: true,
          };
          setAlerts(prev => [alertNote, ...prev]);
          setIsAddCaraModalOpen(false);
        }}
        onCancel={() => {
          setIsAddCaraModalOpen(false);
          setNewCaraName('');
          setNewCaraProducts(['Regular Unleaded', 'Premium Unleaded', 'Diesel']);
        }}
      />

      <ShiftReceiptModal
        show={showShiftReceipt}
        shiftDetails={shiftDetails}
        transactions={transactions}
        unitMeasure={unitMeasure}
        currencySymbol={currencySymbol}
        pendingMeters={pendingMeters}
        onClose={() => setShowShiftReceipt(false)}
      />

    </div>
  );
}
