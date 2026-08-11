/** Unidad de visualización de la estación (solo etiqueta). */
export type UnitMeasure = 'Litros' | 'Galones';

/** Decimales fijos para litraje / volumen en toda la UI. */
export const VOLUME_DECIMALS = 3;

/**
 * El volumen se muestra tal cual (sin conversión Gal↔L).
 * La etiqueta `unit_measure` solo cambia el texto (L / Gal).
 * Cualquier conversión real debe hacerse en el backend/PTS, no en el UI.
 */
export function litersToDisplay(value: number, _unit: UnitMeasure): number {
  return value;
}

/** Identidad: el valor de UI se envía tal cual al backend. */
export function displayToLiters(value: number, _unit: UnitMeasure): number {
  return value;
}

/** Etiqueta corta de la unidad actual. */
export function unitLabel(unit: UnitMeasure): string {
  return unit === 'Galones' ? 'Gal' : 'L';
}

/** Número de volumen con exactamente 3 decimales. */
export function formatVolumeValue(value: number): string {
  return Number(value || 0).toFixed(VOLUME_DECIMALS);
}

/** Formatea un volumen con 3 decimales y la unidad correcta (sin convertir). */
export function formatVolume(value: number, unit: UnitMeasure): string {
  return `${formatVolumeValue(value)} ${unitLabel(unit)}`;
}
