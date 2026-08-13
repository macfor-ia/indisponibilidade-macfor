'use client';

import { useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from './providers';

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // Navegação "por dentro" (client-side) direto da raiz trava contra o CDN
    // da Hostinger (fica em "This page couldn't load" até dar reload) —
    // então aqui força um carregamento de página completo, que funciona.
    window.location.replace(user ? '/unavailability' : '/login');
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <ProgressSpinner strokeWidth="3" />
    </div>
  );
}
