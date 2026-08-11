import type { DispenserState, FuelType, NozzleState, PumpStatus } from '../types';

const KNOWN_FUEL_ALIASES: [string, FuelType][] = [
  ['premium', 'Premium Unleaded'],
  ['super', 'Premium Unleaded'],
  ['regular', 'Regular Unleaded'],
  ['diesel', 'Diesel'],
  ['kerosene', 'Kerosene'],
  ['queroseno', 'Kerosene'],
  ['glp', 'LPG'],
  ['lpg', 'LPG'],
  ['gasolina', 'Regular Unleaded'],
];

const FUEL_BY_GRADE_ID: Record<number, FuelType> = {
  1: 'Regular Unleaded',
  2: 'Premium Unleaded',
  3: 'Diesel',
  4: 'Kerosene',
  5: 'LPG',
};

const GRADE_ID_BY_FUEL: Record<FuelType, number> = {
  'Regular Unleaded': 1,
  'Premium Unleaded': 2,
  'Diesel': 3,
  'Kerosene': 4,
  'LPG': 5,
};

export const EDITABLE_FUEL_OPTIONS: { type: FuelType; name: string; color: string }[] = [
  { type: 'Regular Unleaded', name: 'Regular', color: 'bg-blue-500' },
  { type: 'Premium Unleaded', name: 'Súper/Premium', color: 'bg-amber-500' },
  { type: 'Diesel', name: 'Diesel', color: 'bg-emerald-500' },
  { type: 'Kerosene', name: 'Queroseno', color: 'bg-purple-500' },
  { type: 'LPG', name: 'GLP/LPG', color: 'bg-cyan-500' },
];

export function mapNameToFuelType(name: string, gradeId?: number): FuelType {
  const lower = (name || '').toLowerCase().trim();
  for (const [alias, fuel] of KNOWN_FUEL_ALIASES) {
    if (lower.includes(alias)) return fuel;
  }
  if (gradeId && FUEL_BY_GRADE_ID[gradeId]) return FUEL_BY_GRADE_ID[gradeId];
  return 'Regular Unleaded';
}

export function defaultGradeIdForFuel(fuelType: FuelType, fallback = 1): number {
  return GRADE_ID_BY_FUEL[fuelType] ?? fallback;
}

export interface PumpNozzleMapping {
  nozzle: number;
  fuelGradeId: number;
  fuelType: FuelType;
  name?: string;
}

export function idleNozzle(
  fuelType: FuelType,
  opts?: { fuelGradeId?: number; fuelName?: string },
): NozzleState {
  return {
    fuelType,
    status: 'Idle' as PumpStatus,
    currentAmount: 0,
    currentVolume: 0,
    progressPercent: 0,
    fuelGradeId: opts?.fuelGradeId ?? defaultGradeIdForFuel(fuelType),
    fuelName: opts?.fuelName ?? fuelType,
  };
}

/** Convierte filas de BD / API local a DispenserState. */
export function mapPumpConfigToDispenser(p: {
  id?: number;
  pump_id?: number;
  name?: string;
  nozzles_count?: number;
  nozzles?: Array<{
    nozzle?: number;
    fuel_grade_id?: number;
    fuelGradeId?: number;
    fuel_type?: string;
    fuelType?: string;
    name?: string;
  }>;
}): DispenserState {
  const id = Number(p.id ?? p.pump_id ?? 0);
  const nozzlesRaw = Array.isArray(p.nozzles) ? p.nozzles : [];
  const nozzles: NozzleState[] =
    nozzlesRaw.length > 0
      ? nozzlesRaw.map((n, i) => {
          const gradeId = Number(n.fuel_grade_id ?? n.fuelGradeId ?? 0) || (i + 1);
          const rawType = String(n.fuel_type ?? n.fuelType ?? n.name ?? '');
          const fuelType = mapNameToFuelType(rawType, gradeId || undefined);
          const fuelName = String((n.name ?? rawType) || fuelType);
          return idleNozzle(fuelType, { fuelGradeId: gradeId, fuelName });
        })
      : Array.from({ length: p.nozzles_count ?? 1 }, (_, i) =>
          idleNozzle(FUEL_BY_GRADE_ID[i + 1] ?? 'Regular Unleaded', {
            fuelGradeId: i + 1,
          }),
        );

  return {
    id,
    name: p.name || `Cara ${id}`,
    nozzles,
  };
}

export function dispenserToNozzleMappings(d: DispenserState): PumpNozzleMapping[] {
  return d.nozzles.map((n, i) => ({
    nozzle: i + 1,
    fuelGradeId: n.fuelGradeId ?? defaultGradeIdForFuel(n.fuelType, i + 1),
    fuelType: n.fuelType,
    name: n.fuelName ?? n.fuelType,
  }));
}

/** Número de manguera PTS (1-based) según el mapeo de la cara, no el índice global de combustible. */
export function resolveNozzleNumber(
  nozzles: Array<{ fuelType: FuelType }> | undefined | null,
  fuelType: FuelType,
): number {
  if (Array.isArray(nozzles) && nozzles.length > 0) {
    const idx = nozzles.findIndex((n) => n.fuelType === fuelType);
    if (idx >= 0) return idx + 1;
  }
  return defaultGradeIdForFuel(fuelType);
}
