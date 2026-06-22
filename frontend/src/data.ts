/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PumpState, TankState, PriceConfig, ScheduledPrice, Transaction, ShiftAlert, DispenserState, UserProfile, NozzleTransaction } from './types';

export const INITIAL_DISPENSERS: DispenserState[] = [
  {
    id: 1,
    name: 'Cara 1',
    nozzles: [
      { 
        fuelType: 'Regular Unleaded', 
        status: 'Dispensing', 
        currentAmount: 25.60, 
        currentVolume: 6.10, 
        progressPercent: 65,
        pendingTransactions: [
          { id: 'TRX-HN1A', dateTime: 'Hace 3 min', dispenserId: 1, volume: 10.5, amount: 43.99, fuelType: 'Regular Unleaded', status: 'Pending', createdAt: Date.now() - 180 * 1000 },
          { id: 'TRX-HN1B', dateTime: 'Hace 12 min', dispenserId: 1, volume: 8.2, amount: 34.35, fuelType: 'Regular Unleaded', status: 'Pending', createdAt: Date.now() - 280 * 1000 }
        ]
      },
      { 
        fuelType: 'Premium Unleaded', 
        status: 'Idle', 
        currentAmount: 0.0, 
        currentVolume: 0.0, 
        progressPercent: 0,
        pendingTransactions: [
          { id: 'TRX-HN1C', dateTime: 'Hace 7 min', dispenserId: 1, volume: 12.0, amount: 56.40, fuelType: 'Premium Unleaded', status: 'Pending', createdAt: Date.now() - 170 * 1000 }
        ]
      },
      { fuelType: 'Diesel', status: 'Idle', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
    ]
  },
  {
    id: 2,
    name: 'Cara 2',
    nozzles: [
      { fuelType: 'Regular Unleaded', status: 'Blocked', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
      { fuelType: 'Premium Unleaded', status: 'Ready', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
      { fuelType: 'Diesel', status: 'Idle', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
    ]
  },
  {
    id: 3,
    name: 'Cara 3',
    nozzles: [
      { fuelType: 'Regular Unleaded', status: 'Ready', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
      { fuelType: 'Premium Unleaded', status: 'Idle', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
      { 
        fuelType: 'Diesel', 
        status: 'Dispensing', 
        currentAmount: 12.50, 
        currentVolume: 2.78, 
        progressPercent: 30,
        pendingTransactions: [
          { id: 'TRX-HN3A', dateTime: 'Hace 1 min', dispenserId: 3, volume: 22.4, amount: 89.60, fuelType: 'Diesel', status: 'Pending', createdAt: Date.now() - 60 * 1000 }
        ]
      },
    ]
  },
  {
    id: 4,
    name: 'Cara 4',
    nozzles: [
      { fuelType: 'Regular Unleaded', status: 'Prepaid', currentAmount: 20.00, currentVolume: 4.77, limitAmount: 20.00, progressPercent: 100 },
      { fuelType: 'Premium Unleaded', status: 'Idle', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
      { fuelType: 'Diesel', status: 'Idle', currentAmount: 0.0, currentVolume: 0.0, progressPercent: 0 },
    ]
  }
];

export const INITIAL_PUMPS: PumpState[] = [
  {
    id: 1,
    name: 'Pump 1',
    nozzle: 'Nozzle 1',
    status: 'Dispensing',
    fuelType: 'Regular Unleaded',
    currentAmount: 45.67,
    currentVolume: 12.34,
    progressPercent: 75,
  },
  {
    id: 2,
    name: 'Pump 2',
    nozzle: 'Nozzle 2',
    status: 'Blocked',
    fuelType: 'Regular Unleaded',
    currentAmount: 0.0,
    currentVolume: 0.0,
    progressPercent: 0,
  },
  {
    id: 3,
    name: 'Pump 3',
    nozzle: 'Nozzle 3',
    status: 'Ready',
    fuelType: 'Regular Unleaded',
    currentAmount: 0.0,
    currentVolume: 0.0,
    progressPercent: 0,
  },
  {
    id: 4,
    name: 'Pump 4',
    nozzle: 'Nozzle 1',
    status: 'Prepaid',
    fuelType: 'Regular Unleaded',
    currentAmount: 20.00,
    currentVolume: 5.40,
    limitAmount: 20.00,
    progressPercent: 100,
  },
  {
    id: 5,
    name: 'Pump 5',
    nozzle: 'Nozzle 3',
    status: 'Idle',
    fuelType: 'Regular Unleaded',
    currentAmount: 45.67,
    currentVolume: 12.34,
    progressPercent: 0,
  },
  {
    id: 6,
    name: 'Pump 6',
    nozzle: 'Nozzle 3',
    status: 'Idle',
    fuelType: 'Regular Unleaded',
    currentAmount: 45.67,
    currentVolume: 12.34,
    progressPercent: 0,
  },
];

export const INITIAL_TANKS: TankState[] = [
  {
    id: 'T-01',
    name: 'Tanque 1',
    fuelType: 'Regular Unleaded',
    currentLevel: 6525.0,
    maxCapacity: 26417.0,
    recentDelivery: '2024-05-25 (2000 Gal)',
    estDaysRemaining: 5,
    status: 'OK',
  },
  {
    id: 'T-02',
    name: 'Tanque 2',
    fuelType: 'Diesel',
    currentLevel: 6736.4,
    maxCapacity: 26417.0,
    recentDelivery: '2024-05-20 (1500 Gal)',
    estDaysRemaining: 8,
    status: 'OK',
  },
  {
    id: 'T-03',
    name: 'Tanque 3',
    fuelType: 'LPG',
    currentLevel: 412.1,
    maxCapacity: 26417.0,
    recentDelivery: '2024-05-26 (3000 Gal)',
    estDaysRemaining: 2,
    status: 'Low Level Alert',
  },
];

export const INITIAL_PRICES: PriceConfig[] = [
  {
    fuelType: 'Regular Unleaded',
    price: 4.19,
    lastUpdated: '2024-05-27 10:15 AM',
  },
  {
    fuelType: 'Premium Unleaded',
    price: 4.69,
    lastUpdated: '2024-05-26 09:00 AM',
  },
  {
    fuelType: 'Diesel',
    price: 4.49,
    lastUpdated: '2024-05-25 14:30 PM',
  },
  {
    fuelType: 'Kerosene',
    price: 3.89,
    lastUpdated: '2024-05-27 11:00 AM',
  },
  {
    fuelType: 'LPG',
    price: 3.50,
    lastUpdated: '2024-05-27 12:00 PM',
  },
];

export const INITIAL_SCHEDULED_PRICES: ScheduledPrice[] = [
  {
    id: 'SP-001',
    dateTime: '2024-05-28 06:00 AM',
    fuelType: 'Regular Unleaded',
    newPrice: 4.25,
    status: 'Pending',
  },
  {
    id: 'SP-002',
    dateTime: '2024-05-28 06:00 AM',
    fuelType: 'Regular Unleaded',
    newPrice: 4.25,
    status: 'Pending',
  },
  {
    id: 'SP-003',
    dateTime: '2024-05-29 06:00 AM',
    fuelType: 'Diesel',
    newPrice: 4.55,
    status: 'Pending',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-101',
    dateTime: '2024-05-27 10:30 AM',
    pumpId: 3,
    pumpName: 'Pump 3',
    volume: 10.50,
    amount: 38.90,
    fuelType: 'Regular Unleaded',
    paymentType: 'Credit Card',
  },
  {
    id: 'TRX-102',
    dateTime: '2024-05-27 10:28 AM',
    pumpId: 1,
    pumpName: 'Pump 1',
    volume: 15.20,
    amount: 63.69,
    fuelType: 'Regular Unleaded',
    paymentType: 'Credit Card',
  },
  {
    id: 'TRX-103',
    dateTime: '2024-05-27 10:25 AM',
    pumpId: 5,
    pumpName: 'Pump 5',
    volume: 24.10,
    amount: 113.03,
    fuelType: 'Premium Unleaded',
    paymentType: 'Cash',
  },
  {
    id: 'TRX-104',
    dateTime: '2024-05-27 10:20 AM',
    pumpId: 4,
    pumpName: 'Pump 4',
    volume: 8.00,
    amount: 35.92,
    fuelType: 'Diesel',
    paymentType: 'Fleet Card',
  },
  {
    id: 'TRX-105',
    dateTime: '2024-05-27 10:15 AM',
    pumpId: 6,
    pumpName: 'Pump 6',
    volume: 12.00,
    amount: 50.28,
    fuelType: 'Regular Unleaded',
    paymentType: 'Debit Card',
  },
  {
    id: 'TRX-106',
    dateTime: '2024-05-27 10:12 AM',
    pumpId: 2,
    pumpName: 'Pump 2',
    volume: 11.45,
    amount: 47.98,
    fuelType: 'Regular Unleaded',
    paymentType: 'Credit Card',
  },
  {
    id: 'TRX-107',
    dateTime: '2024-05-27 10:05 AM',
    pumpId: 3,
    pumpName: 'Pump 3',
    volume: 10.50,
    amount: 38.90,
    fuelType: 'Regular Unleaded',
    paymentType: 'Credit Card',
  },
  {
    id: 'TRX-108',
    dateTime: '2024-05-27 09:55 AM',
    pumpId: 1,
    pumpName: 'Pump 1',
    volume: 10.50,
    amount: 38.90,
    fuelType: 'Regular Unleaded',
    paymentType: 'Credit Card',
  },
];

export const INITIAL_SHIFTS: ShiftAlert[] = [
  {
    id: '1',
    dateTime: '2024-05-27 10:30 AM',
    pumpName: 'Pump 3',
    volume: '10.50 Gal',
    amount: '$38.90',
    paymentType: 'Credit Card',
  },
  {
    id: '2',
    dateTime: '2024-05-27 10:30 AM',
    pumpName: 'Pump 3',
    volume: '10.50 Gal',
    amount: '$38.90',
    paymentType: 'Credit Card',
  },
  {
    id: '3',
    dateTime: '2024-05-27 10:30 AM',
    pumpName: 'Pump 3',
    volume: '10.50 Gal',
    amount: '$38.90',
    paymentType: 'Credit Card',
  },
  {
    id: '4',
    dateTime: '2024-05-27 10:30 AM',
    pumpName: 'Pump 3',
    volume: '10.50 Gal',
    amount: '$38.90',
    paymentType: 'Credit Card',
  },
  {
    id: '5',
    dateTime: '2024-05-27 10:30 AM',
    pumpName: 'Pump 3',
    volume: '10.50 Gal',
    amount: '$38.90',
    paymentType: 'Credit Card',
  },
  {
    id: '6',
    dateTime: '2024-05-27 10:30 AM',
    pumpName: 'Pump 3',
    volume: '10.50 Gal',
    amount: '$38.90',
    paymentType: 'Credit Card',
  },
  {
    id: '7',
    dateTime: '2024-05-27 10:30 AM',
    pumpName: 'Pump 3',
    volume: '10.50 Gal',
    amount: '$38.90',
    paymentType: 'Credit Card',
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'U-01',
    name: 'Administrador GasNova',
    username: 'admin',
    role: 'Admin',
    avatar: '🛡️',
    pin: '1234',
    status: 'Active',
  },
  {
    id: 'U-02',
    name: 'John Doe',
    username: 'jdoe',
    role: 'Manager',
    avatar: '👨‍💼',
    pin: '0000',
    status: 'Active',
  },
  {
    id: 'U-03',
    name: 'Isabel Gómez',
    username: 'isabel',
    role: 'Supervisor',
    avatar: '👩‍🔬',
    pin: '5555',
    status: 'Active',
  },
  {
    id: 'U-04',
    name: 'Carlos Ruiz',
    username: 'carlos',
    role: 'Operator',
    avatar: '👨‍🔧',
    pin: '1111',
    status: 'Active',
  },
];

