/**
 * API client to connect GasNova Frontend to GasNova Backend.
 * Automatically falls back to mock logic if the backend is unreachable.
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface BackendPumpStatus {
  pump?: number;
  status?: string;
  nozzle?: number;
  transaction?: number | string;
  volume?: number;
  amount?: number;
  price?: number;
}

export interface BackendPriceItem {
  Nozzle: number;
  Price: number;
}

export interface BackendTankMeasurement {
  id?: number;
  tank_id?: number;
  probe_id?: number;
  height?: number;
  volume?: number;
  temperature?: number;
  product_code?: string;
  measurement_time?: string;
}

// Helper to handle fetch and network exceptions gracefully
async function apiFetch<T>(path: string, options?: RequestInit): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `API error (${res.status}): ${errText || res.statusText}` };
    }

    const json = await res.json();
    return { ok: true, data: json.data as T };
  } catch (error: any) {
    console.warn(`[GasNova API] Connection to ${path} failed:`, error.message || error);
    return { ok: false, error: error.message || 'Network error' };
  }
}

export const api = {
  /**
   * Check connection health with the backend.
   */
  async checkHealth(): Promise<boolean> {
    const res = await apiFetch<{ ok: boolean }>('health');
    return !!(res.ok && res.data?.ok);
  },

  /**
   * Get status of a specific pump.
   */
  async getPumpStatus(pumpId: number): Promise<{ ok: boolean; status?: BackendPumpStatus; error?: string }> {
    const res = await apiFetch<BackendPumpStatus>(`pumps/${pumpId}/status`);
    return { ok: res.ok, status: res.data, error: res.error };
  },

  /**
   * Send pre-authorization to a pump nozzle.
   */
  async authorizePump(
    pumpId: number,
    nozzle: number,
    type?: 'Volume' | 'Amount',
    dose?: number
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    const body: any = { nozzle };
    if (type && dose !== undefined) {
      body.type = type;
      body.dose = dose;
    }
    return apiFetch<any>(`pumps/${pumpId}/authorize`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Stop dispensing on a specific pump.
   */
  async stopPump(pumpId: number): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/stop`, {
      method: 'POST',
    });
  },

  /**
   * Emergency stop a pump.
   */
  async emergencyStopPump(pumpId: number): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/emergency-stop`, {
      method: 'POST',
    });
  },

  /**
   * Emergency stop all pumps.
   */
  async emergencyStopAll(): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('pumps/emergency-stop-all', {
      method: 'POST',
    });
  },

  /**
   * Lock a dispenser to prevent all nozzles from dispensing.
   */
  async lockPump(pumpId: number): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/lock`, {
      method: 'POST',
    });
  },

  /**
   * Unlock a dispenser.
   */
  async unlockPump(pumpId: number): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/unlock`, {
      method: 'POST',
    });
  },

  /**
   * Fetch current prices on a specific pump.
   */
  async getPumpPrices(pumpId: number): Promise<{ ok: boolean; prices?: BackendPriceItem[]; error?: string }> {
    const res = await apiFetch<BackendPriceItem[]>(`pumps/${pumpId}/prices`);
    return { ok: res.ok, prices: res.data, error: res.error };
  },

  /**
   * Update prices on a specific pump for specified nozzles.
   */
  async setPumpPrices(pumpId: number, prices: { nozzle: number; price: number }[]): Promise<{ ok: boolean; data?: any; error?: string }> {
    const payload = {
      prices: prices.map(p => ({
        Nozzle: p.nozzle,
        Price: p.price,
      })),
    };
    return apiFetch<any>(`pumps/${pumpId}/prices`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Close a finished transaction on a pump.
   */
  async closeTransaction(pumpId: number): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/close-transaction`, {
      method: 'POST',
    });
  },

  /**
   * Authorize a pump in postpaid (free load) mode.
   */
  async postpayAuthorizePump(pumpId: number, nozzle: number): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/postpay-authorize`, {
      method: 'POST',
      body: JSON.stringify({ nozzle }),
    });
  },

  /**
   * Simulate physical nozzle lift / begin dispensing.
   */
  async startDispensing(pumpId: number): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/start-dispensing`, {
      method: 'POST',
    });
  },

  /**
   * Get all probe measurements (tank levels).
   */
  async getProbeMeasurements(): Promise<{ ok: boolean; measurements?: BackendTankMeasurement[]; error?: string }> {
    const res = await apiFetch<BackendTankMeasurement[]>('probes/measurements');
    return { ok: res.ok, measurements: res.data, error: res.error };
  },

  /**
   * Save a processed pump transaction to the local database.
   */
  async saveTransaction(
    pumpId: number,
    transactionId: number,
    nozzle: number,
    volume: number,
    amount: number,
    paymentType: string
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`pumps/${pumpId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: transactionId,
        nozzle,
        volume,
        amount,
        payment_type: paymentType,
        status: 'Completed',
      }),
    });
  },

  /**
   * Save a tank delivery (cisterna load) to the database.
   */
  async saveTankDelivery(
    tankId: number,
    volume: number,
    productCode?: string,
    driverName?: string,
    truckNumber?: string,
    notes?: string
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`tanks/${tankId}/deliveries`, {
      method: 'POST',
      body: JSON.stringify({
        volume,
        product_code: productCode,
        driver_name: driverName,
        truck_number: truckNumber,
        notes,
      }),
    });
  },

  /**
   * Get all registered operators.
   */
  async getUsers(): Promise<{ ok: boolean; data?: any[]; error?: string }> {
    const res = await apiFetch<any[]>('users');
    return { ok: res.ok, data: res.data, error: res.error };
  },

  /**
   * Create a new operator.
   */
  async createUser(user: {
    username: string;
    name: string;
    role: string;
    avatar?: string;
    pin: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  /**
   * Delete an operator by ID.
   */
  async deleteUser(userId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Authenticate an operator using their username and PIN.
   */
  async verifyUserPin(username: string, pin: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('users/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    });
  },

  /**
   * Close the active shift and create the next one.
   */
  async closeShift(shiftId: string, operatorName: string, endTime: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('shifts/close', {
      method: 'POST',
      body: JSON.stringify({
        shift_id: shiftId,
        operator_name: operatorName,
        end_time: endTime,
        status: 'Closed',
      }),
    });
  },

  /**
   * Get all shift logs.
   */
  async getShifts(): Promise<{ ok: boolean; data?: any[]; error?: string }> {
    const res = await apiFetch<any[]>('shifts');
    return { ok: res.ok, data: res.data, error: res.error };
  },

  /**
   * Get all system settings.
   */
  async getSystemSettings(): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('settings');
  },

  /**
   * Update a specific system setting by key.
   */
  async updateSystemSetting(key: string, value: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  /**
   * Get all scheduled prices.
   */
  async getScheduledPrices(): Promise<{ ok: boolean; data?: any[]; error?: string }> {
    const res = await apiFetch<any[]>('scheduled-prices');
    return { ok: res.ok, data: res.data, error: res.error };
  },

  /**
   * Create a new scheduled price.
   */
  async createScheduledPrice(price: {
    id: string;
    date_time: string;
    fuel_type: string;
    new_price: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('scheduled-prices', {
      method: 'POST',
      body: JSON.stringify(price),
    });
  },

  /**
   * Cancel a scheduled price.
   */
  async cancelScheduledPrice(priceId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>(`scheduled-prices/${priceId}/cancel`, {
      method: 'PUT',
    });
  },

  /**
   * Get all transactions associated with a shift.
   */
  async getShiftTransactions(shiftId: string): Promise<{ ok: boolean; data?: any[]; error?: string }> {
    return apiFetch<any[]>(`shifts/${shiftId}/transactions`);
  },

  /**
   * Print a thermal receipt on the connected POS-80 printer via ESC/POS backend.
   */
  async printReceipt(params: {
    doc_type:     string;
    doc_number:   string;
    station_name?: string;
    station_ruc?:  string;
    shift_id?:     string;
    pump_name:    string;
    fuel_type:    string;
    volume_gal:   number;
    unit_price:   number;
    total_amount: number;
    payment_type: string;
    cashier_name?: string;
    client_name?:  string;
    client_ruc?:   string;
    date_time?:    string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('print/receipt', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Print shift closure receipt via physical ESC/POS printer.
   */
  async printClosure(params: {
    shift_id:          string;
    shift_name?:       string;
    operator_name:     string;
    start_time:        string;
    end_time:          string;
    total_sales:       number;
    total_volume:      number;
    transaction_count: number;
    fuel_breakdown?:   any[];
    payment_breakdown?: any[];
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('print/closure', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Print start of next shift ticket via physical ESC/POS printer.
   */
  async printNextShift(params: {
    shift_id:            string;
    shift_name?:         string;
    previous_shift_id?:  string;
    previous_shift_name?: string;
    operator_name:       string;
    start_time:          string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('print/next-shift', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Check the printer connection status.
   */
  async getPrinterStatus(): Promise<{ ok: boolean; data?: any; error?: string }> {
    return apiFetch<any>('print/status');
  },
};

// ─── Browser print fallback (window.print) ────────────────────────────────────
// Used when the ESC/POS backend is unreachable or as an additional copy.

export interface ReceiptData {
  docType:     'ticket' | 'factura';
  docNumber:   string;
  stationName?: string;
  stationRuc?:  string;
  shiftId?:     string;
  pumpName:    string;
  fuelType:    string;
  volumeGal:   number;
  unitPrice:   number;
  totalAmount: number;
  paymentType: string;
  cashierName?: string;
  clientName?:  string;
  clientRuc?:   string;
  dateTime?:    string;
}

const FUEL_LABELS: Record<string, string> = {
  'Regular Unleaded': 'Gasolina Regular 87',
  'Premium Unleaded': 'Gasolina Super Premium 93',
  'Diesel':           'Diesel B5',
  'Kerosene':         'Queroseno',
};

export function printReceiptWindow(r: ReceiptData): void {
  const now = r.dateTime || new Date().toLocaleString('es-GT', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const fuelLabel = FUEL_LABELS[r.fuelType] || r.fuelType;
  const docLabel  = r.docType === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA';
  const stName    = r.stationName || 'GASNOVA OUTLET';
  const stRuc     = r.stationRuc  || '20459871402';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${docLabel} ${r.docNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 2mm 3mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      width: 76mm;
      color: #000;
    }
    .center  { text-align: center; }
    .right   { text-align: right; }
    .bold    { font-weight: bold; }
    .xl      { font-size: 13pt; font-weight: 900; }
    .divider { border-top: 1px dashed #000; margin: 3px 0; }
    .divider-solid { border-top: 1px solid #000; margin: 3px 0; }
    .row     { display: flex; justify-content: space-between; }
    .mt      { margin-top: 4px; }
    .mb      { margin-bottom: 4px; }
    .block   { display: block; }
    .total-row { font-size: 12pt; font-weight: 900; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="center bold mt mb">⛽ ${stName}</div>
  <div class="center" style="font-size:8pt">R.U.C. ${stRuc} · ESTACIÓN DE SERVICIO</div>
  <div class="divider-solid mt"></div>

  <!-- Doc type -->
  <div class="center bold mb">${docLabel}</div>
  <div class="center mb">N° ${r.docNumber}</div>
  <div class="divider"></div>

  <!-- Metadata -->
  <div class="row"><span>FECHA:</span><span>${now}</span></div>
  <div class="row"><span>SURTIDOR:</span><span>${r.pumpName}</span></div>
  ${r.shiftId    ? `<div class="row"><span>TURNO:</span><span>${r.shiftId}</span></div>` : ''}
  ${r.cashierName ? `<div class="row"><span>CAJERO:</span><span>${r.cashierName}</span></div>` : ''}
  <div class="divider"></div>

  <!-- Cliente (factura only) -->
  ${r.docType === 'factura' && r.clientName ? `
  <div class="block bold">CLIENTE:</div>
  <div class="block">${r.clientName}</div>
  ${r.clientRuc ? `<div class="row"><span>RUC:</span><span>${r.clientRuc}</span></div>` : ''}
  <div class="divider"></div>
  ` : ''}

  <!-- Product -->
  <div class="block bold mb">PRODUCTO:</div>
  <div class="block mb">${fuelLabel}</div>
  <div class="divider"></div>
  <div class="row"><span>GALONES:</span><span>${r.volumeGal.toFixed(3)} Gal</span></div>
  <div class="row"><span>PRECIO/GAL:</span><span>$${r.unitPrice.toFixed(3)}</span></div>
  <div class="divider"></div>

  <!-- Total -->
  <div class="row total-row mt mb"><span>TOTAL:</span><span>$${r.totalAmount.toFixed(2)}</span></div>
  <div class="row"><span>FORMA PAGO:</span><span>${r.paymentType}</span></div>
  <div class="divider-solid mt mb"></div>

  <!-- Footer -->
  <div class="center mb">¡Gracias por su preferencia!</div>
  <div class="center" style="font-size:8pt">Conserve este comprobante</div>
  <div class="center" style="font-size:7pt; margin-top:3px; color:#555">Representación impresa de comprobante electrónico</div>
  <br><br>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=320,height=600,scrollbars=no,toolbar=no,menubar=no');
  if (!w) { alert('Permita las ventanas emergentes para imprimir el comprobante.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Auto-print after load
  w.onload = () => { w.focus(); w.print(); };
}


