'use client';

import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../providers';

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  roleCheck?: (role: string) => boolean,
) {
  function ProtectedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      if (roleCheck && !roleCheck(user.role)) {
        router.replace('/unavailability');
      }
    }, [user, loading, router]);

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
