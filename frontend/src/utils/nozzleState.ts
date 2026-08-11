import type { FuelType, NozzleState, PumpStatus } from '../types';

/** Estados que no deben ser pisados por Ready del PTS. */
const READY_PROTECTED: PumpStatus[] = [
  'Blocked',
  'Prepaid',
  'Authorized',
  'Unpaid',
  'EndOfTransaction',
  'Dispensing',
];

export function isReadyProtected(status: PumpStatus): boolean {
  return READY_PROTECTED.includes(status);
}

export function isCapturingPtsId(ptsTransactionId?: string): boolean {
  return ptsTransactionId === '__capturing__';
}

/** Localiza la manguera por número PTS (1-based = orden en el mapeo de la cara). */
export function findNozzleByPtsNumber(
  nozzles: NozzleState[] | undefined,
  ptsNozzleNumber: number,
): NozzleState | undefined {
  if (!nozzles?.length || ptsNozzleNumber < 1) return undefined;
  return nozzles[ptsNozzleNumber - 1];
}

export function findNozzleIndexByPtsNumber(
  nozzles: NozzleState[] | undefined,
  ptsNozzleNumber: number,
): number {
  if (!nozzles?.length || ptsNozzleNumber < 1) return -1;
  return ptsNozzleNumber - 1 < nozzles.length ? ptsNozzleNumber - 1 : -1;
}

/** Despacho real: monto y volumen deben ser > 0 (nunca ventas en $0.00 / 0 L). */
export function hadRealDispense(volume: number, amount: number): boolean {
  return Number(volume) > 0 && Number(amount) > 0;
}

export function nozzleMatchesFuel(
  nozzle: NozzleState | undefined,
  fuelType: FuelType,
): boolean {
  return !!nozzle && nozzle.fuelType === fuelType;
}
