import { useMemo } from 'react';
import { can, type Permission } from '../permissions';
import type { UserProfile } from '../types';

export function usePermissions(currentUser: UserProfile | null) {
  return useMemo(() => ({
    can: (permission: Permission) => can(currentUser?.role, permission),
  }), [currentUser?.role]);
}
