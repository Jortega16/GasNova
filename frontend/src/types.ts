/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FuelType = 'Regular Unleaded' | 'Premium Unleaded' | 'Diesel' | 'Kerosene';

export type PumpStatus = 'Dispensing' | 'Blocked' | 'Ready' | 'Prepaid' | 'Fueling' | 'Idle' | 'Unpaid';

export interface NozzleTransaction {
  id: string;
  dateTime: string;
  dispenserId: number;
  volume: number;
  amount: number;
  fuelType: FuelType;
  status: 'Pending' | 'Processed';
  billingType?: 'Ticket' | 'Factura';
  createdAt?: number;
}

export interface NozzleState {
  fuelType: FuelType;
  status: PumpStatus;
  currentAmount: number;
  currentVolume: number;
  limitAmount?: number; // for limits or prepaid
  progressPercent: number; // 0 to 100
  isPostpaid?: boolean;
  pendingTransactions?: NozzleTransaction[];
}

export interface DispenserState {
  id: number;
  name: string;
  nozzles: NozzleState[];
  isBlocked?: boolean;
}

export interface PumpState {
  id: number;
  name: string;
  nozzle: string;
  status: PumpStatus;
  fuelType: FuelType;
  currentAmount: number;
  currentVolume: number;
  limitAmount?: number;
  preauthorizedAmount?: number;
  progressPercent: number;
}

export interface TankState {
  id: string;
  name: string;
  fuelType: FuelType;
  currentLevel: number; // in Gallons
  maxCapacity: number; // in Gallons
  recentDelivery: string; // e.g., "2024-05-25 (2000 Gal)"
  estDaysRemaining: number;
  status: 'OK' | 'Low Level Alert';
}

export interface PriceConfig {
  fuelType: FuelType;
  price: number;
  lastUpdated: string;
}

export interface ScheduledPrice {
  id: string;
  dateTime: string;
  fuelType: FuelType;
  newPrice: number;
  status: 'Pending' | 'Applied' | 'Cancelled';
}

export interface PaymentMethod {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind bg color class or hex, e.g. "bg-emerald-50 text-emerald-700"
  enabled: boolean;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  dateTime: string;
  pumpId: number;
  pumpName: string;
  volume: number; // in Gal
  amount: number; // in USD
  fuelType: FuelType;
  paymentType: string;
}

export interface ShiftAlert {
  id: string;
  dateTime: string;
  pumpName: string;
  volume: string;
  amount: string;
  paymentType: string;
  message?: string;
  isCustomNote?: boolean;
}

export interface ShiftDetails {
  shiftId: string;
  operatorName: string;
  startTime: string;
  endTime: string;
  status: 'Active' | 'Closed';
}

export type UserRole = 'Admin' | 'Manager' | 'Supervisor' | 'Operator';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar: string; // emoji or high contrast color or initials
  pin: string; // 4 digit passcode
  status: 'Active' | 'Inactive';
}

