export const DEPARTMENTS = [
  'Atendimento', 'Conteúdo', 'Criação', 'Social',
  'Performance: CRM/Mídia/SEO', 'Planejamento', 'Projetos/Operações', 'Tecnologia',
];

export const DEPT_COLORS: Record<string, string> = {
  'Atendimento': '#34D399',
  'Conteúdo': '#A78BFA',
  'Criação': '#F472B6',
  'Social': '#38BDF8',
  'Performance: CRM/Mídia/SEO': '#FB923C',
  'Planejamento': '#FBBF24',
  'Projetos/Operações': '#5B8DEF',
  'Tecnologia': '#6EE7B7',
  'Conteudo': '#A78BFA',
  'Criacao': '#F472B6',
  'Performance: CRM/Midia/SEO': '#FB923C',
  'Projetos/Operacoes': '#5B8DEF',
};

export const UNAVAIL_TYPES = [
  { value: 'prolongado', label: 'Período prolongado de indisponibilidade' },
  { value: 'pontual', label: 'Dia(s) pontual(is) de agenda bloqueada' },
];

export const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  approved: { label: 'Confirmado', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  rejected: { label: 'Em reavaliação', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export const ROLE_LABELS: Record<string, string> = {
  admin_master: 'Admin Master',
  admin_editor: 'Admin Editor',
  admin_leitor: 'Admin Leitor',
  lider: 'Líder de Setor',
  socio: 'Sócio',
  colaborador: 'Prestador',
};

export interface AppUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department?: string | null;
}

export function isMasterAdminRole(role: string) {
  return role === 'admin_master';
}
export function isAdminRole(role: string) {
  return role === 'admin_master' || role === 'admin_editor' || role === 'admin_leitor';
}
export function isEditorRole(role: string) {
  return role === 'admin_master' || role === 'admin_editor';
}
export function isLiderRole(role: string) {
  return role === 'lider';
}
export function canViewAllRole(role: string) {
  return isAdminRole(role) || role === 'socio';
}

export function formatDate(d?: string | null) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

export function formatDateShort(d?: string | null) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return d;
}

export function countBusinessDays(startStr: string, endStr: string) {
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  let count = 0;
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function countCalendarDays(startStr: string, endStr: string) {
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  return Math.round((endMs - startMs) / 86400000) + 1;
}

export function getMinRequestDate() {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().split('T')[0];
}
