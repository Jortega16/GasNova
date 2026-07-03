import type { UserRole } from './types';

export type Permission =
  | 'dashboard.view'
  | 'pump.preauth'
  | 'pump.block'
  | 'pump.emergency_stop'
  | 'shift.close'
  | 'shift.report'
  | 'prices.view'
  | 'prices.edit'
  | 'prices.sync_pts2'
  | 'prices.schedule'
  | 'inventory.view'
  | 'inventory.refill'
  | 'inventory.add_tank'
  | 'reports.daily'
  | 'reports.monthly'
  | 'cards.manage'
  | 'users.view'
  | 'users.manage'
  | 'settings.view'
  | 'settings.edit'
  | 'simulator.access';

export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard.view':       'Ver dashboard de dispensadores',
  'pump.preauth':         'Pre-autorizar despacho',
  'pump.block':           'Bloquear/desbloquear cara',
  'pump.emergency_stop':  'Parada de emergencia',
  'shift.close':          'Cerrar turno',
  'shift.report':         'Ver reporte de turno',
  'prices.view':          'Ver precios de combustible',
  'prices.edit':          'Editar precios',
  'prices.sync_pts2':     'Sincronizar precios con PTS-2',
  'prices.schedule':      'Programar cambios de precio',
  'inventory.view':       'Ver inventario de tanques',
  'inventory.refill':     'Registrar abastecimiento',
  'inventory.add_tank':   'Agregar nuevo tanque',
  'reports.daily':        'Ver ventas diarias',
  'reports.monthly':      'Ver resumen mensual',
  'cards.manage':         'Gestión de tarjetas de flota',
  'users.view':           'Ver usuarios',
  'users.manage':         'Crear / editar / eliminar usuarios',
  'settings.view':        'Ver ajustes del sistema',
  'settings.edit':        'Editar ajustes del sistema',
  'simulator.access':     'Acceder al simulador PTS-2',
};

export const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  {
    label: 'Dispensadores',
    perms: ['dashboard.view', 'pump.preauth', 'pump.block', 'pump.emergency_stop'],
  },
  {
    label: 'Turno',
    perms: ['shift.close', 'shift.report'],
  },
  {
    label: 'Precios',
    perms: ['prices.view', 'prices.edit', 'prices.sync_pts2', 'prices.schedule'],
  },
  {
    label: 'Inventario',
    perms: ['inventory.view', 'inventory.refill', 'inventory.add_tank'],
  },
  {
    label: 'Reportes',
    perms: ['reports.daily', 'reports.monthly', 'cards.manage'],
  },
  {
    label: 'Administración',
    perms: ['users.view', 'users.manage', 'settings.view', 'settings.edit', 'simulator.access'],
  },
];

// Permissions matrix per role
const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  Admin: new Set<Permission>([
    'dashboard.view',
    'pump.preauth', 'pump.block', 'pump.emergency_stop',
    'shift.close', 'shift.report',
    'prices.view', 'prices.edit', 'prices.sync_pts2', 'prices.schedule',
    'inventory.view', 'inventory.refill', 'inventory.add_tank',
    'reports.daily', 'reports.monthly', 'cards.manage',
    'users.view', 'users.manage',
    'settings.view', 'settings.edit',
    'simulator.access',
  ]),

  Manager: new Set<Permission>([
    'dashboard.view',
    'pump.preauth', 'pump.block', 'pump.emergency_stop',
    'shift.close', 'shift.report',
    'prices.view', 'prices.edit', 'prices.sync_pts2', 'prices.schedule',
    'inventory.view', 'inventory.refill',
    'reports.daily', 'reports.monthly', 'cards.manage',
    'users.view',
    'settings.view',
    'simulator.access',
  ]),

  Supervisor: new Set<Permission>([
    'dashboard.view',
    'pump.preauth', 'pump.block', 'pump.emergency_stop',
    'shift.close', 'shift.report',
    'prices.view',
    'inventory.view',
    'reports.daily',
    'simulator.access',
  ]),

  Operator: new Set<Permission>([
    'dashboard.view',
    'pump.preauth', 'pump.emergency_stop',
    'simulator.access',
  ]),
};

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function getRolePermissions(role: UserRole): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? []);
}

export const ALL_ROLES: UserRole[] = ['Admin', 'Manager', 'Supervisor', 'Operator'];
