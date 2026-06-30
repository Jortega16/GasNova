import type {
  BackendPumpStatus,
  BackendPriceItem,
  BackendTankMeasurement,
  BackendPumpStatusItem,
  BackendApiResponse,
  HealthData,
  PrintReceiptParams,
  PrintClosureParams,
  PrintNextShiftParams,
  CreateUserParams,
  ScheduledPriceCreateParams,
  PendingTransactionProcessParams,
} from "./types";

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL;
  if (envUrl) {
    if (typeof window !== "undefined" && envUrl.includes("localhost")) {
      return envUrl.replace("localhost", window.location.hostname);
    }
    return envUrl;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8002`;
  }
  return "http://localhost:8002";
};

const API_BASE_URL = getApiBaseUrl();

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<BackendApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        error: `API error (${res.status}): ${errText || res.statusText}`,
      };
    }

    const json = await res.json();
    const data = (json && typeof json === "object" && "data" in json)
      ? json.data
      : json;
    return { ok: true, data: data as T };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network error";
    console.warn(`[GasNova API] Connection to ${path} failed:`, message);
    return { ok: false, error: message };
  }
}

export const api = {
  async checkHealth(): Promise<boolean> {
    const res = await apiFetch<{ ok: boolean }>("health");
    return !!(res.ok && res.data?.ok);
  },

  async checkPts2Health(): Promise<{
    apiConnected: boolean;
    pts2Connected: boolean;
  }> {
    const res = await apiFetch<HealthData>("health");
    if (res.ok && res.data) {
      return {
        apiConnected: !!res.data.ok,
        pts2Connected: !!(res.data.pts2 && res.data.pts2.ok),
      };
    }
    return { apiConnected: false, pts2Connected: false };
  },

  async getPumpStatus(
    pumpId: number,
  ): Promise<{ ok: boolean; status?: BackendPumpStatus; error?: string }> {
    const res = await apiFetch<BackendPumpStatus>(`pumps/${pumpId}/status`);
    return { ok: res.ok, status: res.data, error: res.error };
  },

  async getAllPumpsStatus(
    pumpCount: number = 8,
  ): Promise<{
    ok: boolean;
    pumps?: BackendPumpStatusItem[];
    error?: string;
  }> {
    const res = await apiFetch<{ pumps: BackendPumpStatusItem[] }>(
      `pumps/status-all?pump_count=${pumpCount}`,
    );
    return { ok: res.ok, pumps: res.data?.pumps, error: res.error };
  },

  async authorizePump(
    pumpId: number,
    nozzle: number,
    type?: "Volume" | "Amount",
    dose?: number,
  ): Promise<BackendApiResponse> {
    const body: Record<string, unknown> = { nozzle };
    if (type && dose !== undefined) {
      body.type = type;
      body.dose = dose;
    }
    return apiFetch(`pumps/${pumpId}/authorize`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async stopPump(pumpId: number): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/stop`, { method: "POST" });
  },

  async emergencyStopPump(pumpId: number): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/emergency-stop`, { method: "POST" });
  },

  async emergencyStopAll(): Promise<BackendApiResponse> {
    return apiFetch("pumps/emergency-stop-all", { method: "POST" });
  },

  async lockPump(pumpId: number): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/lock`, { method: "POST" });
  },

  async unlockPump(pumpId: number): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/unlock`, { method: "POST" });
  },

  async getPumpPrices(
    pumpId: number,
  ): Promise<{
    ok: boolean;
    prices?: BackendPriceItem[];
    error?: string;
  }> {
    const res = await apiFetch<BackendPriceItem[]>(`pumps/${pumpId}/prices`);
    return { ok: res.ok, prices: res.data, error: res.error };
  },

  async setPumpPrices(
    pumpId: number,
    prices: { nozzle: number; price: number }[],
  ): Promise<BackendApiResponse> {
    const payload = {
      prices: prices.map((p) => ({ Nozzle: p.nozzle, Price: p.price })),
    };
    return apiFetch(`pumps/${pumpId}/prices`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async closeTransaction(pumpId: number): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/close-transaction`, { method: "POST" });
  },

  async postpayAuthorizePump(
    pumpId: number,
    nozzle: number,
  ): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/postpay-authorize`, {
      method: "POST",
      body: JSON.stringify({ nozzle }),
    });
  },

  async startDispensing(pumpId: number): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/start-dispensing`, { method: "POST" });
  },

  async getProbeMeasurements(): Promise<{
    ok: boolean;
    measurements?: BackendTankMeasurement[];
    error?: string;
  }> {
    const res = await apiFetch<BackendTankMeasurement[]>(
      "probes/measurements",
    );
    return { ok: res.ok, measurements: res.data, error: res.error };
  },

  async saveTransaction(
    pumpId: number,
    transactionId: number,
    nozzle: number,
    volume: number,
    amount: number,
    paymentType: string,
  ): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/transactions`, {
      method: "POST",
      body: JSON.stringify({
        transaction_id: transactionId,
        nozzle,
        volume,
        amount,
        payment_type: paymentType,
        status: "Completed",
      }),
    });
  },

  async saveTankDelivery(
    tankId: number,
    volume: number,
    productCode?: string,
    driverName?: string,
    truckNumber?: string,
    notes?: string,
  ): Promise<BackendApiResponse> {
    return apiFetch(`tanks/${tankId}/deliveries`, {
      method: "POST",
      body: JSON.stringify({
        volume,
        product_code: productCode,
        driver_name: driverName,
        truck_number: truckNumber,
        notes,
      }),
    });
  },

  async getPumpsConfiguration(): Promise<BackendApiResponse<unknown[]>> {
    return apiFetch<unknown[]>("pumps/configuration");
  },

  async getTanksConfiguration(): Promise<BackendApiResponse<unknown[]>> {
    return apiFetch<unknown[]>("tanks/db-configuration");
  },

  async getUsers(): Promise<BackendApiResponse<unknown[]>> {
    return apiFetch<unknown[]>("users");
  },

  async createUser(
    user: CreateUserParams,
  ): Promise<BackendApiResponse> {
    return apiFetch("users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  async deleteUser(userId: string): Promise<BackendApiResponse> {
    return apiFetch(`users/${userId}`, { method: "DELETE" });
  },

  async verifyUserPin(
    username: string,
    pin: string,
  ): Promise<BackendApiResponse> {
    return apiFetch("users/login", {
      method: "POST",
      body: JSON.stringify({ username, pin }),
    });
  },

  async closeShift(
    shiftId: string,
    operatorName: string,
    endTime: string,
  ): Promise<BackendApiResponse> {
    return apiFetch("shifts/close", {
      method: "POST",
      body: JSON.stringify({
        shift_id: shiftId,
        operator_name: operatorName,
        end_time: endTime,
        status: "Closed",
      }),
    });
  },

  async getShifts(): Promise<BackendApiResponse<unknown[]>> {
    return apiFetch<unknown[]>("shifts");
  },

  async getSystemSettings(): Promise<BackendApiResponse> {
    return apiFetch("settings");
  },

  async updateSystemSetting(
    key: string,
    value: string,
  ): Promise<BackendApiResponse> {
    return apiFetch(`settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },

  async getScheduledPrices(): Promise<BackendApiResponse<unknown[]>> {
    return apiFetch<unknown[]>("scheduled-prices");
  },

  async createScheduledPrice(
    price: ScheduledPriceCreateParams,
  ): Promise<BackendApiResponse> {
    return apiFetch("scheduled-prices", {
      method: "POST",
      body: JSON.stringify(price),
    });
  },

  async cancelScheduledPrice(
    priceId: string,
  ): Promise<BackendApiResponse> {
    return apiFetch(`scheduled-prices/${priceId}/cancel`, {
      method: "PUT",
    });
  },

  async getShiftTransactions(
    shiftId: string,
  ): Promise<BackendApiResponse<unknown[]>> {
    return apiFetch<unknown[]>(`shifts/${shiftId}/transactions`);
  },

  async printReceipt(
    params: PrintReceiptParams,
  ): Promise<BackendApiResponse> {
    return apiFetch("print/receipt", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async printClosure(
    params: PrintClosureParams,
  ): Promise<BackendApiResponse> {
    return apiFetch("print/closure", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async printNextShift(
    params: PrintNextShiftParams,
  ): Promise<BackendApiResponse> {
    return apiFetch("print/next-shift", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async getPrinterStatus(): Promise<BackendApiResponse> {
    return apiFetch("print/status");
  },

  async getPendingTransactions(): Promise<BackendApiResponse<unknown[]>> {
    return apiFetch<unknown[]>("pumps/pending-transactions");
  },

  async savePendingTransaction(
    pumpId: number,
    trxId: string,
    nozzle: number,
    volume: number,
    amount: number,
    fuelType: string,
  ): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/pending-transactions`, {
      method: "POST",
      body: JSON.stringify({
        trx_id: trxId,
        nozzle,
        volume,
        amount,
        fuel_type: fuelType,
      }),
    });
  },

  async deletePendingTransaction(
    pumpId: number,
    trxId: string,
  ): Promise<BackendApiResponse> {
    return apiFetch(`pumps/${pumpId}/pending-transactions/${trxId}`, {
      method: "DELETE",
    });
  },

  async processPendingTransaction(
    pumpId: number,
    trxId: string,
    params: PendingTransactionProcessParams = {},
  ): Promise<BackendApiResponse> {
    return apiFetch(
      `pumps/${pumpId}/pending-transactions/${trxId}/process`,
      {
        method: "POST",
        body: JSON.stringify({
          payment_type: params.payment_type || "Cash",
          status: params.status || "Completed",
          document_type: params.document_type,
          document_number: params.document_number,
          payment_reference: params.payment_reference,
          cashier_name: params.cashier_name,
        }),
      },
    );
  },
};
