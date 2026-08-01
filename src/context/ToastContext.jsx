import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type, durationMs) => {
      const text = String(message || '').trim() || (type === 'error' ? 'Something went wrong' : 'Done');
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message: text, type }]);
      const ms = durationMs ?? (type === 'error' ? 5500 : 3500);
      setTimeout(() => remove(id), ms);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
