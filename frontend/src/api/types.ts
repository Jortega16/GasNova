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
  ProductVolume?: number;
  product_volume?: number;
  Probe?: number;
  probe?: number;
}

export interface BackendPumpStatusItem {
  pump: number;
  status_type: string;
  nozzle?: number;
  fuel_grade_id?: number;
  fuel_grade_name?: string;
  volume?: number;
  amount?: number;
  price?: number;
  transaction?: number;
  nozzle_prices?: number[];
  last_volume?: number;
  last_amount?: number;
  last_transaction?: number;
  error?: string;
}

export interface BackendPumpsStatusAll {
  pumps: BackendPumpStatusItem[];
}

export interface BackendApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface HealthData {
  ok: boolean;
  pts2?: { ok: boolean };
}

export interface PrintReceiptParams {
  doc_type: string;
  doc_number: string;
  station_name?: string;
  station_ruc?: string;
  shift_id?: string;
  pump_name: string;
  fuel_type: string;
  volume_gal: number;
  unit_price: number;
  total_amount: number;
  payment_type: string;
  cashier_name?: string;
  client_name?: string;
  client_ruc?: string;
  date_time?: string;
}

export interface PrintClosureParams {
  shift_id: string;
  shift_name?: string;
  operator_name: string;
  start_time: string;
  end_time: string;
  total_sales: number;
  total_volume: number;
  transaction_count: number;
  fuel_breakdown?: unknown[];
  payment_breakdown?: unknown[];
  counter_breakdown?: unknown[];
}

export interface PrintNextShiftParams {
  shift_id: string;
  shift_name?: string;
  previous_shift_id?: string;
  previous_shift_name?: string;
  operator_name: string;
  start_time: string;
}

export interface CreateUserParams {
  username: string;
  name: string;
  role: string;
  avatar?: string;
  pin: string;
}

export interface ScheduledPriceCreateParams {
  id: string;
  date_time: string;
  fuel_type: string;
  new_price: number;
}

export interface PendingTransactionProcessParams {
  payment_type?: string;
  status?: string;
  document_type?: string;
  document_number?: string;
  payment_reference?: string;
  cashier_name?: string;
}
