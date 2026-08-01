import { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext(null);

function toKey(menuOrKey, action) {
  if (!menuOrKey) return '';
  if (action) return `${menuOrKey}.${action}`;
  return String(menuOrKey);
}

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const isSuperAdmin = Boolean(user?.isSuperAdmin || permissions.includes('*.*'));

  /**
   * Exact permission check only.
   * Usage: can('programs.edit') or can('programs', 'edit')
   * No inheritance: view does not grant edit/delete/create/upload.
   */
  const can = useCallback(
    (menuOrKey, action) => {
      const key = toKey(menuOrKey, action);
      if (!key) return false;
      if (isSuperAdmin) return true;
      return permissions.includes(key);
    },
    [permissions, isSuperAdmin]
  );

  const canAny = useCallback((keys = []) => keys.some((k) => can(k)), [can]);
  const canAll = useCallback((keys = []) => keys.every((k) => can(k)), [can]);

  /** True if user has any permission under a module (for sidebar visibility). */
  const canModule = useCallback(
    (menu) => {
      if (!menu) return false;
      if (isSuperAdmin) return true;
      const prefix = `${menu}.`;
      return permissions.some((p) => p === menu || p.startsWith(prefix));
    },
    [permissions, isSuperAdmin]
  );

  const value = useMemo(
    () => ({
      permissions,
      can,
      canAny,
      canAll,
      canModule,
      canAccessAdmin: Boolean(user?.canAccessAdmin || isSuperAdmin || user?.role === 'admin'),
      isSuperAdmin,
    }),
    [permissions, can, canAny, canAll, canModule, user, isSuperAdmin]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission(key) {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermission must be used within PermissionProvider');
  if (key) return ctx.can(key);
  return ctx;
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionProvider');
  return ctx;
}
