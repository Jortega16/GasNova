import React, { useState } from 'react';
import { Fuel, X, Check, Plus, RefreshCw, FileText, Printer } from 'lucide-react';
import { DispenserState, PriceConfig, ShiftDetails, UserProfile, FuelType, NozzleTransaction } from '../types';
import { api, printReceiptWindow } from '../api';

interface NozzleTransactionsModalProps {
  selectedNozzleForTrx: { dispenserId: number; fuelType: FuelType } | null;
  onClose: () => void;
  dispensers: DispenserState[];
  prices: PriceConfig[];
  unitMeasure: 'Galones' | 'Litros';
  currencySymbol: string;
  shiftDetails: ShiftDetails;
  currentUser: UserProfile | null;
  onGenerateMockDispatch: (dispenserId: number, fuelType: FuelType) => void;
  onProcessAllNozzleTrxs: (dispenserId: number, fuelType: FuelType) => void;
  onProcessSelectedNozzleTrxs: (
    dispenserId: number,
    fuelType: FuelType,
    trxIds: string[],
    billingType: 'Bajada' | 'Ticket' | 'Factura',
    clientName?: string,
    clientRuc?: string,
    documentNumber?: string
  ) => NozzleTransaction | null;
  buildCombinedNozzleTransaction: (
    transactionsToCombine: NozzleTransaction[],
    dispenserId: number,
    fuelType: FuelType,
    documentNumber?: string
  ) => NozzleTransaction;
}

const NozzleTransactionsModal: React.FC<NozzleTransactionsModalProps> = ({
  selectedNozzleForTrx,
  onClose,
  dispensers,
  prices,
  unitMeasure,
  currencySymbol,
  shiftDetails,
  currentUser,
  onGenerateMockDispatch,
  onProcessAllNozzleTrxs,
  onProcessSelectedNozzleTrxs,
  buildCombinedNozzleTransaction,
}) => {
  const [selectedTrx, setSelectedTrx] = useState<NozzleTransaction | null>(null);
  const [selectedTrxIds, setSelectedTrxIds] = useState<string[]>([]);
  const [billingMode, setBillingMode] = useState<'none' | 'ticket' | 'invoice'>('none');
  const [invoiceClientName, setInvoiceClientName] = useState<string>('');
  const [invoiceClientRuc, setInvoiceClientRuc] = useState<string>('');
  const [billingSuccessDoc, setBillingSuccessDoc] = useState<{
    type: 'ticket' | 'invoice';
    tx: NozzleTransaction;
    docNumber: string;
    clientName?: string;
    clientRuc?: string;
    count?: number;
  } | null>(null);

  if (!selectedNozzleForTrx) return null;

  const dispenserId = selectedNozzleForTrx.dispenserId;
  const fuelType = selectedNozzleForTrx.fuelType;
  const dispenser = dispensers.find(d => d.id === dispenserId);
  const nozzle = dispenser?.nozzles.find(n => n.fuelType === fuelType);
  const pendingList = nozzle?.pendingTransactions || [];
  const selectedTrxs = pendingList.filter(tx => selectedTrxIds.includes(tx.id));
  const activeTrxs = selectedTrxs.length > 0 ? selectedTrxs : (selectedTrx ? [selectedTrx] : []);
  const activeCombinedTx = activeTrxs.length > 0 ? buildCombinedNozzleTransaction(activeTrxs, dispenserId, fuelType) : null;
  const activeLabel = activeTrxs.length > 1 ? `${activeTrxs.length} despachos seleccionados` : activeTrxs[0]?.id;
  const activeIds = activeTrxs.map(tx => tx.id);

  const handleClose = () => {
    setSelectedTrx(null);
    setSelectedTrxIds([]);
    setBillingMode('none');
    setBillingSuccessDoc(null);
    setInvoiceClientName('');
    setInvoiceClientRuc('');
    onClose();
  };

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
            onClick={handleClose}
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
                {pendingList.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedTrxIds(
                        selectedTrxIds.length === pendingList.length ? [] : pendingList.map(tx => tx.id)
                      );
                      setSelectedTrx(null);
                      setBillingMode('none');
                      setBillingSuccessDoc(null);
                    }}
                    className="text-[9px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-1 px-2.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>{selectedTrxIds.length === pendingList.length ? 'Limpiar' : 'Seleccionar Todo'}</span>
                  </button>
                )}

                <button
                  onClick={() => onGenerateMockDispatch(dispenserId, fuelType)}
                  className="text-[9px] bg-slate-805 hover:bg-slate-700 hover:text-amber-300 text-slate-300 font-bold py-1 px-2.5 rounded-lg border border-slate-705 flex items-center gap-1 transition-all cursor-pointer"
                  title="Simular nueva venta instantáneamente para evaluar tickets/facturas"
                >
                  <Plus className="w-3 h-3" />
                  <span>Simular Carga</span>
                </button>

                {pendingList.length > 0 && (
                  <button
                    onClick={() => {
                      onProcessAllNozzleTrxs(dispenserId, fuelType);
                      setSelectedTrx(null);
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
                  onClick={() => onGenerateMockDispatch(dispenserId, fuelType)}
                  className="bg-indigo-605 hover:bg-indigo-505 text-white font-sans font-bold text-[10px] uppercase py-1.5 px-3 rounded-lg cursor-pointer inline-flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cargar Despacho de Prueba</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {pendingList.map((tx) => {
                  const isChecked = selectedTrxIds.includes(tx.id);
                  const isSelected = selectedTrx?.id === tx.id || isChecked;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        if (selectedTrxIds.length > 0) {
                          setSelectedTrxIds(prev => prev.includes(tx.id) ? prev.filter(id => id !== tx.id) : [...prev, tx.id]);
                          setSelectedTrx(null);
                        } else {
                          setSelectedTrx(tx);
                        }
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
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTrxIds(prev => prev.includes(tx.id) ? prev.filter(id => id !== tx.id) : [...prev, tx.id]);
                              setSelectedTrx(null);
                              setBillingMode('none');
                              setBillingSuccessDoc(null);
                            }}
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-950 border-slate-600 text-transparent'
                            }`}
                            title="Seleccionar despacho"
                          >
                            <Check className="w-3 h-3" />
                          </button>
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
                          Volumen: <strong className="font-mono text-white">{tx.volume.toFixed(2)} {unitMeasure === 'Galones' ? 'Gls' : 'Lts'}</strong> | Combustible: <span className="text-indigo-300 font-medium">{fuelType === 'Regular Unleaded' ? 'Regular' : fuelType === 'Premium Unleaded' ? 'Súper' : 'Diesel'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-amber-400 font-mono">{currencySymbol}{tx.amount.toFixed(2)}</p>
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
                    {billingSuccessDoc.count && billingSuccessDoc.count > 1 ? `El lote de ${billingSuccessDoc.count} despachos` : `La transacción ${billingSuccessDoc.tx.id}`} fue procesado y registrado en el historial principal del turno en curso.
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
                    {billingSuccessDoc.count && billingSuccessDoc.count > 1 && (
                      <p><span className="font-bold">DESPACHOS:</span> {billingSuccessDoc.count}</p>
                    )}
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
                    <p className="text-[11px] font-black text-right pt-1 text-slate-900">COD. TOTAL: {currencySymbol}{billingSuccessDoc.tx.amount.toFixed(2)}</p>
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
                      setSelectedTrx(null);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] py-1.5 rounded-lg cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={async () => {
                      if (!billingSuccessDoc) return;
                      const unitPrice = prices.find(p => p.fuelType === fuelType)?.price || 4.19;
                      const receiptData = {
                        docType: (billingSuccessDoc.type === 'invoice' ? 'factura' : 'ticket') as 'ticket' | 'factura',
                        docNumber: billingSuccessDoc.docNumber,
                        shiftId: shiftDetails.shiftId,
                        pumpName: `Cara ${dispenserId ?? '?'}`,
                        fuelType: fuelType,
                        volumeGal: billingSuccessDoc.tx.volume,
                        unitPrice: unitPrice,
                        totalAmount: billingSuccessDoc.tx.amount,
                        paymentType: billingSuccessDoc.type === 'factura' ? 'Factura' : 'Efectivo',
                        cashierName: currentUser?.name,
                        clientName: billingSuccessDoc.clientName,
                        clientRuc: billingSuccessDoc.clientRuc,
                      };
                      const backendRes = await api.printReceipt({
                        doc_type: receiptData.docType,
                        doc_number: receiptData.docNumber,
                        shift_id: receiptData.shiftId,
                        pump_name: receiptData.pumpName,
                        fuel_type: receiptData.fuelType,
                        volume_gal: receiptData.volumeGal,
                        unit_price: receiptData.unitPrice,
                        total_amount: receiptData.totalAmount,
                        payment_type: receiptData.paymentType,
                        cashier_name: receiptData.cashierName,
                        client_name: receiptData.clientName,
                        client_ruc: receiptData.clientRuc,
                      });
                      if (!backendRes.ok) {
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
            ) : activeCombinedTx ? (
              <div className="space-y-4">
                {/* Active Dispatch Specs Card */}
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-indigo-400 font-bold font-mono">ID: {activeLabel}</p>
                    <span className="text-[9px] text-slate-400 font-mono">{activeCombinedTx.dateTime}</span>
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
                      <span className="font-bold text-amber-400 font-mono">{currencySymbol}{activeCombinedTx.amount.toFixed(2)}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-[9px] text-slate-500 block">Volumen</span>
                      <span className="font-semibold text-slate-300 font-mono">{activeCombinedTx.volume.toFixed(2)} {unitMeasure === 'Galones' ? 'Gls' : 'Lts'}</span>
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
                        onProcessSelectedNozzleTrxs(dispenserId, fuelType, activeIds, 'Bajada');
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
                    <p className="text-[9.5px] text-slate-400">Se procesará {activeTrxs.length === 1 ? `el despacho ${activeTrxs[0].id}` : `un lote de ${activeTrxs.length} despachos`} emitiendo un ticket rápido de estación.</p>
                    
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
                          const combinedTx = onProcessSelectedNozzleTrxs(dispenserId, fuelType, activeIds, 'Ticket', undefined, undefined, docNumber);
                          setBillingSuccessDoc({
                            type: 'ticket',
                            tx: combinedTx || activeCombinedTx,
                            docNumber,
                            count: activeTrxs.length
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
                          const combinedTx = onProcessSelectedNozzleTrxs(
                            dispenserId, 
                            fuelType, 
                            activeIds, 
                            'Factura',
                            invoiceClientName,
                            invoiceClientRuc,
                            docNumber
                          );
                          setBillingSuccessDoc({
                            type: 'invoice',
                            tx: combinedTx || activeCombinedTx,
                            docNumber,
                            clientName: invoiceClientName,
                            clientRuc: invoiceClientRuc,
                            count: activeTrxs.length
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
            onClick={handleClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-bold text-xs py-1.5 px-4 rounded-xl cursor-pointer transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};

export default NozzleTransactionsModal;
