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
  PrintStation,
  CreateUserParams,
  ScheduledPriceCreateParams,
  PendingTransactionProcessParams,
} from "./types";
import { getPrintStationId } from "../printStation";
import { getAuthToken, clearAuthSession, notifyUnauthorized } from "../auth";

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
    const token = getAuthToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      // 401 en cualquier endpoint (excepto el propio login, donde significa
      // "PIN incorrecto") = sesión expirada/inválida → volver al login.
      if (res.status === 401 && !path.includes("users/login")) {
        clearAuthSession();
        notifyUnauthorized();
      }
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

  async getLiveState(
    pumpCount: number = 8,
  ): Promise<{
    ok: boolean;
    pumps?: BackendPumpStatusItem[];
    tanks?: BackendTankMeasurement[];
    error?: string;
  }> {
    const res = await apiFetch<{
      pumps: BackendPumpStatusItem[];
      tanks: BackendTankMeasurement[];
    }>(`live/state?pump_count=${pumpCount}`);
    return {
      ok: res.ok,
      pumps: res.data?.pumps,
      tanks: res.data?.tanks,
      error: res.error,
    };
  },

  async authorizePump(
    pumpId: number,
    nozzle: number,
    type?: "Volume" | "Amount",
    dose?: number,
    shiftId?: string,
  ): Promise<BackendApiResponse> {
    const body: Record<string, unknown> = { nozzle };
    if (type && dose !== undefined) {
      body.type = type;
      body.dose = dose;
    }
    if (shiftId) body.shift_id = shiftId;
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
    // El backend devuelve la forma jsonPTS { Pump, NozzlePrices: number[] },
    // no un array de { Nozzle, Price } — se transforma aquí para el resto del app.
    const res = await apiFetch<{ Pump?: number; NozzlePrices?: number[] }>(
      `pumps/${pumpId}/prices`,
    );
    if (!res.ok || !res.data) {
      return { ok: res.ok, error: res.error };
    }
    const nozzlePrices = res.data.NozzlePrices ?? [];
    const prices: BackendPriceItem[] = nozzlePrices.map((price, idx) => ({
      Nozzle: idx + 1,
      Price: price,
    }));
    return { ok: true, prices };
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
    counterBreakdown?: unknown[],
  ): Promise<BackendApiResponse> {
    return apiFetch("shifts/close", {
      method: "POST",
      body: JSON.stringify({
        shift_id: shiftId,
        operator_name: operatorName,
        end_time: endTime,
        status: "Closed",
        counter_breakdown: counterBreakdown ?? [],
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
      body: JSON.stringify({ ...params, print_station_id: params.print_station_id ?? getPrintStationId() }),
    });
  },

  async printClosure(
    params: PrintClosureParams,
  ): Promise<BackendApiResponse> {
    return apiFetch("print/closure", {
      method: "POST",
      body: JSON.stringify({ ...params, print_station_id: params.print_station_id ?? getPrintStationId() }),
    });
  },

  async printNextShift(
    params: PrintNextShiftParams,
  ): Promise<BackendApiResponse> {
    return apiFetch("print/next-shift", {
      method: "POST",
      body: JSON.stringify({ ...params, print_station_id: params.print_station_id ?? getPrintStationId() }),
    });
  },

  async getPrinterStatus(): Promise<BackendApiResponse> {
    return apiFetch("print/status");
  },

  async getPrintStations(): Promise<BackendApiResponse<{ stations: PrintStation[] }>> {
    return apiFetch("print/stations");
  },

  async updatePrintStations(stations: PrintStation[]): Promise<BackendApiResponse<{ stations: PrintStation[] }>> {
    return apiFetch("print/stations", {
      method: "PUT",
      body: JSON.stringify(stations),
    });
  },

  async testPrintStation(stationId: string): Promise<BackendApiResponse> {
    return apiFetch(`print/stations/${encodeURIComponent(stationId)}/test`, {
      method: "POST",
    });
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

  async capturePendingTransaction(pumpId: number): Promise<BackendApiResponse<{
    trx_id: string;
    pts_transaction_id: string | null;
    pump_id: number;
    nozzle: number | null;
    volume: number;
    amount: number;
    fuel_type: string | null;
    created: boolean;
  }>> {
    return apiFetch(`pumps/${pumpId}/pending-transactions/capture`, { method: "POST" });
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

  // ── Configuration endpoints ──────────────────────────────────────────────

  async getFuelGradesConfiguration(): Promise<BackendApiResponse> {
    return apiFetch("configuration/fuel-grades");
  },

  async setFuelGradesPrices(
    prices: { fuelGradeId: number; price: number }[],
  ): Promise<BackendApiResponse> {
    return apiFetch("configuration/fuel-grades/prices", {
      method: "PUT",
      body: JSON.stringify({
        fuel_grades_prices: prices.map((p) => ({
          fuel_grade_id: p.fuelGradeId,
          price: p.price,
        })),
      }),
    });
  },

  async getPumpsConfigurationPts(): Promise<BackendApiResponse> {
    return apiFetch("configuration/pumps");
  },

  async getNozzlesConfiguration(): Promise<BackendApiResponse> {
    return apiFetch("configuration/nozzles");
  },

  async getPricesSchedulerConfiguration(): Promise<BackendApiResponse> {
    return apiFetch("configuration/prices-scheduler");
  },

  async setPricesSchedulerConfiguration(
    schedules: {
      id: number;
      enabled: boolean;
      fuelGradeId: number;
      price: number;
      dateTime: string;
      everyMonday?: boolean;
      everyTuesday?: boolean;
      everyWednesday?: boolean;
      everyThursday?: boolean;
      everyFriday?: boolean;
      everySaturday?: boolean;
      everySunday?: boolean;
    }[],
  ): Promise<BackendApiResponse> {
    return apiFetch("configuration/prices-scheduler", {
      method: "PUT",
      body: JSON.stringify({
        price_schedules: schedules.map((s) => ({
          id: s.id,
          enabled: s.enabled,
          fuel_grade_id: s.fuelGradeId,
          price: s.price,
          date_time: s.dateTime,
          every_monday: s.everyMonday ?? false,
          every_tuesday: s.everyTuesday ?? false,
          every_wednesday: s.everyWednesday ?? false,
          every_thursday: s.everyThursday ?? false,
          every_friday: s.everyFriday ?? false,
          every_saturday: s.everySaturday ?? false,
          every_sunday: s.everySunday ?? false,
        })),
      }),
    });
  },

  async setupPumpConfiguration(params: {
    pump: { id: number; port: number; address: number; protocol: number; baudRate: number };
    nozzles: { fuelGradeId: number; fuelGradeName: string; price: number }[];
    fuelGrades: { id: number; name: string; price: number }[];
  }): Promise<BackendApiResponse> {
    // Step 1 — fuel grades
    const fgRes = await apiFetch("configuration/fuel-grades", {
      method: "POST",
      body: JSON.stringify({
        fuel_grades: params.fuelGrades.map((fg) => ({
          id: fg.id,
          name: fg.name,
          price: fg.price,
          expansion_coefficient: 0.00110,
        })),
      }),
    });
    if (!fgRes.ok) return fgRes;

    // Step 2 — pump RS-485
    const pumpRes = await apiFetch("configuration/pumps", {
      method: "POST",
      body: JSON.stringify({
        ports: [
          {
            id: params.pump.port,
            protocol: params.pump.protocol,
            baud_rate: params.pump.baudRate,
          },
        ],
        pumps: [
          {
            id: params.pump.id,
            port: params.pump.port,
            address: params.pump.address,
          },
        ],
      }),
    });
    if (!pumpRes.ok) return pumpRes;

    // Step 3 — nozzle mapping
    const nozzleRes = await apiFetch("configuration/nozzles", {
      method: "POST",
      body: JSON.stringify({
        pump_nozzles: [
          {
            pump_id: params.pump.id,
            fuel_grade_ids: params.nozzles.map((n) => n.fuelGradeId),
          },
        ],
      }),
    });
    return nozzleRes;
  },

  async getPumpCounters(pumpId: number): Promise<BackendApiResponse<{
    pump_id: number;
    total_volume: number;
    total_amount: number;
  }>> {
    return apiFetch(`pumps/${pumpId}/counters`);
  },

  async saveLocalPumpConfig(params: {
    pumpId: number;
    name: string;
    nozzlesCount: number;
    nozzles?: {
      nozzle: number;
      fuelGradeId: number;
      fuelType: string;
      name?: string;
    }[];
  }): Promise<BackendApiResponse> {
    return apiFetch("pumps/local-configuration", {
      method: "POST",
      body: JSON.stringify({
        pumpId: params.pumpId,
        name: params.name,
        nozzlesCount: params.nozzlesCount,
        nozzles: params.nozzles?.map((n) => ({
          nozzle: n.nozzle,
          fuelGradeId: n.fuelGradeId,
          fuelType: n.fuelType,
          name: n.name ?? n.fuelType,
        })),
      }),
    });
  },

  async getSyncStatus(): Promise<BackendApiResponse<{
    sd_total?: number;
    sd_uploaded?: number;
    sd_gap?: number;
    local_db_count?: number;
    sync_needed?: boolean;
    pts_available?: boolean;
    error?: string;
  }>> {
    return apiFetch("sync/status");
  },

  async syncPumpTransactions(
    dateTimeStart?: string,
    dateTimeEnd?: string,
    pumpId?: number,
  ): Promise<BackendApiResponse<{
    retrieved_from_pts?: number;
    inserted?: number;
    pending_inserted?: number;
    skipped_duplicates?: number;
    skipped_zero?: number;
    sync_source?: string;
    error?: string;
    pts_available?: boolean;
  }>> {
    const params = new URLSearchParams();
    if (dateTimeStart) params.set("date_time_start", dateTimeStart);
    if (dateTimeEnd) params.set("date_time_end", dateTimeEnd);
    if (pumpId != null) params.set("pump_id", String(pumpId));
    const qs = params.toString();
    return apiFetch(`sync/pump-transactions${qs ? `?${qs}` : ""}`, {
      method: "POST",
    });
  },
};
