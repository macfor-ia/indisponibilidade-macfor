'use client';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { LogOut, Settings, Users, ClipboardList, CalendarDays } from 'lucide-react';
import { useAuth } from '../providers';
import { API } from '../lib/api-client';
import { canViewAllRole, isMasterAdminRole } from '../lib/client-config';

export function Navbar() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await API.logout().catch(() => {});
    await refresh();
    // Navegação "por dentro" (client-side) pro /login trava contra o CDN da
    // Hostinger (fica em "This page couldn't load" até dar reload) — então
    // aqui força um carregamento de página completo, que funciona.
    window.location.href = '/login';
  }

  const isAdmin = user ? canViewAllRole(user.role) : false;
  const isMaster = user ? isMasterAdminRole(user.role) : false;

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push('/unavailability')}
          >
            <Image src="/macLogo.png" alt="Macfor" width={28} height={28} className="rounded" />
            <span className="font-semibold text-sm tracking-tight hidden sm:block">Indisponibilidade</span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1">
              {isMaster && (
                <Button
                  size="small"
                  severity="secondary"
                  outlined={!pathname?.includes('/admin/members')}
                  icon={<ClipboardList size={13} />}
                  label="Membros"
                  className="!text-xs !py-1"
                  onClick={() => router.push('/admin/members')}
                />
              )}
              {isMaster && (
                <Button
                  size="small"
                  severity="secondary"
                  outlined={!pathname?.includes('/admin/users')}
                  icon={<Users size={13} />}
                  label="Usuários"
                  className="!text-xs !py-1"
                  onClick={() => router.push('/admin/users')}
                />
              )}
              {isMaster && (
                <Button
                  size="small"
                  severity="secondary"
                  outlined={!pathname?.includes('/admin/eventos')}
                  icon={<CalendarDays size={13} />}
                  label="Eventos"
                  className="!text-xs !py-1"
                  onClick={() => router.push('/admin/eventos')}
                />
              )}
              {isMaster && (
                <Button
                  size="small"
                  severity="secondary"
                  outlined={!pathname?.includes('/admin/setores')}
                  icon={<Settings size={13} />}
                  label="Setores"
                  className="!text-xs !py-1"
                  onClick={() => router.push('/admin/setores')}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="text-xs text-[var(--text-muted)] hidden md:block max-w-[160px] truncate">
              {user.full_name}
            </span>
          )}
          <Button
            size="small"
            severity="secondary"
            outlined
            icon={<LogOut size={13} />}
            onClick={logout}
            className="!text-xs !py-1"
            label="Sair"
          />
        </div>
      </div>
    </nav>
  );
}
