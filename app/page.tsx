'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from './providers';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/unavailability' : '/login');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <ProgressSpinner strokeWidth="3" />
    </div>
  );
}
