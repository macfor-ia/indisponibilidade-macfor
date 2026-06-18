'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Toast } from 'primereact/toast';

interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department?: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

interface ToastCtx {
  show: (message: string, severity?: 'success' | 'error' | 'warn' | 'info') => void;
}

interface SetoresCtx {
  setores: string[];
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {} });
const ToastContext = createContext<ToastCtx>({ show: () => {} });
const SetoresContext = createContext<SetoresCtx>({ setores: [] });

export function useAuth() { return useContext(AuthContext); }
export function useToast() { return useContext(ToastContext); }
export function useSetores() { return useContext(SetoresContext); }

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <AuthContext.Provider value={{ user, loading, refresh }}>{children}</AuthContext.Provider>;
}

function ToastProvider({ children }: { children: ReactNode }) {
  const toastRef = useRef<Toast>(null);

  const show = useCallback((message: string, severity: 'success' | 'error' | 'warn' | 'info' = 'success') => {
    toastRef.current?.show({ severity, summary: severity === 'error' ? 'Erro' : 'Aviso', detail: message, life: 4000 });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      <Toast ref={toastRef} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}

function SetoresProvider({ children }: { children: ReactNode }) {
  const [setores, setSetores] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/setores').then(r => r.json()).then(d => { if (Array.isArray(d)) setSetores(d); }).catch(() => {});
  }, []);

  return <SetoresContext.Provider value={{ setores }}>{children}</SetoresContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <SetoresProvider>
          {children}
        </SetoresProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
