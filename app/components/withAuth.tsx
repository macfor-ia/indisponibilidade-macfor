'use client';

import { useEffect, ComponentType } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../providers';

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  roleCheck?: (role: string) => boolean,
) {
  function ProtectedComponent(props: P) {
    const { user, loading } = useAuth();

    useEffect(() => {
      if (loading) return;
      // Navegação "por dentro" (client-side) trava contra o CDN da Hostinger
      // (fica em "This page couldn't load" até dar reload) — então aqui
      // força um carregamento de página completo, que funciona. Ver
      // app/(pages)/login/page.tsx pro motivo completo.
      if (!user) {
        window.location.replace('/login');
        return;
      }
      if (roleCheck && !roleCheck(user.role)) {
        window.location.replace('/unavailability');
      }
    }, [user, loading]);

    if (loading || !user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <ProgressSpinner strokeWidth="3" />
        </div>
      );
    }

    if (roleCheck && !roleCheck(user.role)) {
      return null;
    }

    return <Component {...props} />;
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return ProtectedComponent;
}
