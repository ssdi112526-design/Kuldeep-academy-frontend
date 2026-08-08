import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

function normalizeUser(payload) {
  if (!payload) return null;
  const user = payload.user || payload;
  const permissions = payload.permissions || user.permissions || [];
  return { ...user, permissions };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kra_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .me()
      .then((res) => setUser(normalizeUser(res.data.data)))
      .catch(() => {
        localStorage.removeItem('kra_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { token } = res.data.data;
    localStorage.setItem('kra_token', token);
    const loggedInUser = normalizeUser(res.data.data);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('kra_token');
    setUser(null);
  };

  const isStudent = Boolean(user?.isStudent || user?.role === 'student' || user?.accountType === 'student');
  const isCoach = Boolean(user?.isCoach || user?.role === 'coach' || user?.accountType === 'coach' || user?.coachId);

  const canAccessAdmin = Boolean(
    user &&
      !isStudent &&
      !isCoach &&
      (user?.canAccessAdmin ||
        user?.isSuperAdmin ||
        user?.role === 'admin' ||
        user?.roleSlug === 'super_admin' ||
        (user?.permissions || []).length > 0)
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAdmin: canAccessAdmin,
      canAccessAdmin,
      isSuperAdmin: Boolean(user?.isSuperAdmin && !isStudent && !isCoach),
      isStudent,
      isCoach,
    }),
    [user, loading, canAccessAdmin, isStudent, isCoach]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
