// ═══ GLOBAL CONFIG ═══

const DEPARTMENTS = [
  'Atendimento', 'Conteudo', 'Criacao', 'Social',
  'Performance: CRM/Midia/SEO', 'Planejamento', 'Projetos/Operacoes', 'Tecnologia'
];

const DEPT_COLORS = {
  'Atendimento': '#34D399',
  'Conteudo': '#A78BFA',
  'Criacao': '#F472B6',
  'Social': '#38BDF8',
  'Performance: CRM/Midia/SEO': '#FB923C',
  'Planejamento': '#FBBF24',
  'Projetos/Operacoes': '#5B8DEF',
  'Tecnologia': '#6EE7B7',
};

const UNAVAIL_TYPES = [
  { value: 'prolongado', label: 'Periodo prolongado de indisponibilidade' },
  { value: 'pontual', label: 'Dia(s) pontual(is) de agenda bloqueada' },
];

const STATUS_MAP = {
  pending: { label: 'Pendente', cls: 'fb-yellow', icon: '\u23F3', color: 'var(--yellow)' },
  approved: { label: 'Aprovado', cls: 'fb-green', icon: '\u2705', color: 'var(--green)' },
  rejected: { label: 'Rejeitado', cls: 'fb-red', icon: '\u274C', color: 'var(--red)' },
};

// Role labels for UI
const ROLE_LABELS = {
  admin_master: 'Admin Master',
  admin_editor: 'Admin Editor',
  admin_leitor: 'Admin Leitor',
  lider: 'Lider de Setor',
  socio: 'Socio',
  colaborador: 'Colaborador',
};

// Setores carregados dinamicamente (preenchido pelo app após /api/setores)
let SETORES_DINAMICOS = [...DEPARTMENTS];

// ═══ XSS PROTECTION ═══
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
