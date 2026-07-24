/** Unidad de visualización de la estación (solo etiqueta). */
export type UnitMeasure = 'Litros' | 'Galones';

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

/** Formatea un volumen con 2 decimales y la unidad correcta (sin convertir). */
export function formatVolume(value: number, unit: UnitMeasure): string {
  return `${Number(value).toFixed(2)} ${unitLabel(unit)}`;
}
