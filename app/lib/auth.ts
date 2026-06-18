import { NextResponse } from 'next/server';
import { getSession } from './session';
import { queries } from './database';

export const MASTER_ADMIN_EMAIL = 'gustavo.romao@macfor.com.br';

export function isMasterAdmin(role: string) {
  return role === 'admin_master';
}
export function isAdmin(role: string) {
  return role === 'admin_master' || role === 'admin_editor' || role === 'admin_leitor';
}
export function isAdminEditor(role: string) {
  return role === 'admin_master' || role === 'admin_editor';
}
export function isLider(role: string) {
  return role === 'lider';
}
export function canViewAll(role: string) {
  return isAdmin(role) || role === 'socio';
}

export function cleanText(str: unknown, maxLen = 500): string {
  if (str === null || str === undefined) return '';
  const s = String(str).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function countBusinessDays(startMs: number, endMs: number) {
  let count = 0;
  let cur = startMs;
  while (cur <= endMs) {
    const dow = new Date(cur).getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
    cur += 86400000;
  }
  return count;
}

export function countCalendarDays(startMs: number, endMs: number) {
  return Math.round((endMs - startMs) / 86400000) + 1;
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  nome?: string;
  role: string;
  status: string;
  department?: string | null;
  member_id?: number | null;
}

export interface AuthResult {
  user: AuthUser | null;
  response: NextResponse | null;
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session.userId) {
    return { user: null, response: NextResponse.json({ error: 'Não autenticado. Faça login.' }, { status: 401 }) };
  }
  const user = await queries.getUserById(session.userId);
  if (!user || user.status !== 'approved') {
    session.destroy();
    return { user: null, response: NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 }) };
  }
  return { user: user as AuthUser, response: null };
}

export function requireAdmin(user: AuthUser): NextResponse | null {
  if (!canViewAll(user.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }
  return null;
}

export function requireAdminOnly(user: AuthUser): NextResponse | null {
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }
  return null;
}

export function requireAdminEditor(user: AuthUser): NextResponse | null {
  if (!isAdminEditor(user.role)) {
    return NextResponse.json({ error: 'Apenas Admin Editor pode realizar esta ação.' }, { status: 403 });
  }
  return null;
}

export function requireMasterAdmin(user: AuthUser): NextResponse | null {
  if (!isMasterAdmin(user.role)) {
    return NextResponse.json({ error: 'Acesso exclusivo do Admin Master.' }, { status: 403 });
  }
  return null;
}


const _loginAttempts = new Map<string, { count: number; reset: number }>();

export function checkLoginRate(ip: string): { allowed: boolean; minutes?: number } {
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000;
  const MAX_ATTEMPTS = 10;
  const entry = _loginAttempts.get(ip) || { count: 0, reset: now + WINDOW_MS };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + WINDOW_MS; }
  entry.count++;
  _loginAttempts.set(ip, entry);
  if (entry.count > MAX_ATTEMPTS) {
    const wait = Math.ceil((entry.reset - now) / 1000 / 60);
    return { allowed: false, minutes: wait };
  }
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  _loginAttempts.forEach((v, k) => { if (now > v.reset) _loginAttempts.delete(k); });
}, 60 * 1000);
