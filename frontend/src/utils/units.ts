/** Factor de conversión exacto: 1 galón US = 3.78541 litros */
const GAL_TO_L = 3.78541;

export type UnitMeasure = 'Litros' | 'Galones';

/**
 * Convierte un volumen almacenado en litros a la unidad de la estación.
 * La DB siempre guarda litros; el frontend muestra según configuración.
 */
export function litersToDisplay(liters: number, unit: UnitMeasure): number {
  return unit === 'Galones' ? liters / GAL_TO_L : liters;
}

/**
 * Convierte un volumen en la unidad de la estación a litros para guardar en DB.
 */
export function displayToLiters(value: number, unit: UnitMeasure): number {
  return unit === 'Galones' ? value * GAL_TO_L : value;
}

/** Etiqueta corta de la unidad actual. */
export function unitLabel(unit: UnitMeasure): string {
  return unit === 'Galones' ? 'Gal' : 'L';
}

/** Formatea un volumen con 2 decimales y la unidad correcta. */
export function formatVolume(liters: number, unit: UnitMeasure): string {
  return `${litersToDisplay(liters, unit).toFixed(2)} ${unitLabel(unit)}`;
}
