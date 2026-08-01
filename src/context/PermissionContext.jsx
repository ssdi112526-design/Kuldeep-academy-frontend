import { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const can = useCallback(
    (key) => {
      if (!key) return false;
      if (user?.isSuperAdmin || permissions.includes('*.*')) return true;
      if (permissions.includes(key)) return true;
      // wildcard menu.* support
      const [menu] = String(key).split('.');
      if (permissions.includes(`${menu}.*`)) return true;
      return false;
    },
    [permissions, user?.isSuperAdmin]
  );

  const canAny = useCallback((keys = []) => keys.some((k) => can(k)), [can]);
  const canAll = useCallback((keys = []) => keys.every((k) => can(k)), [can]);

  const value = useMemo(
    () => ({
      permissions,
      can,
      canAny,
      canAll,
      canAccessAdmin: Boolean(user?.canAccessAdmin || user?.isSuperAdmin || user?.role === 'admin'),
      isSuperAdmin: Boolean(user?.isSuperAdmin),
    }),
    [permissions, can, canAny, canAll, user]
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
