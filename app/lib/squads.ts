/**
 * Um "squad" aqui é o time de uma área (Criação, Mídia, SEO...) que atende um cliente
 * específico (Enterprise, SME, Syngenta). A coluna `squad` do banco guarda só o cliente;
 * o squad "de verdade" (o time) é a combinação área + cliente.
 */

/**
 * `area` e `squad` podem guardar mais de um valor separado por vírgula (ex:
 * area="Criação, Criação" pareado posição-a-posição com squad="SME, Enterprise", para gente
 * que atende mais de um cliente). Isso devolve os pares individuais {area, squad}. Quando as
 * duas listas não têm o mesmo tamanho, repete o único valor disponível de um lado para cada
 * posição do outro.
 */
export function expandAreaSquadPairs(area?: string | null, squad?: string | null): { area: string; squad: string }[] {
  const areas = (area || '').split(',').map((s) => s.trim()).filter(Boolean);
  const squads = (squad || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (areas.length === 0) return [];
  if (squads.length === 0) return areas.map((a) => ({ area: a, squad: 'Geral' }));
  if (areas.length === squads.length) return areas.map((a, i) => ({ area: a, squad: squads[i] }));
  if (areas.length === 1) return squads.map((s) => ({ area: areas[0], squad: s }));
  if (squads.length === 1) return areas.map((a) => ({ area: a, squad: squads[0] }));
  const n = Math.max(areas.length, squads.length);
  const out: { area: string; squad: string }[] = [];
  for (let i = 0; i < n; i++) out.push({ area: areas[i] ?? areas[areas.length - 1], squad: squads[i] ?? squads[squads.length - 1] });
  return out;
}

/** "Nenhum" (sem cliente específico) fica mais legível como "Geral". */
export function squadLabel(squad: string) {
  return squad === 'Nenhum' ? 'Geral' : squad;
}

export function squadKey(area: string, squad: string) {
  return `${area} - ${squadLabel(squad)}`;
}

/** Inverso de squadKey: separa "Criação - Enterprise" de volta em {area, squad}. */
export function parseSquadKey(key: string): { area: string; squad: string } {
  const idx = key.indexOf(' - ');
  if (idx === -1) return { area: key.trim(), squad: 'Nenhum' };
  const area = key.slice(0, idx).trim();
  const squadPart = key.slice(idx + 3).trim();
  return { area, squad: squadPart === 'Geral' ? 'Nenhum' : squadPart };
}

/** Lista, em ordem alfabética, os rótulos "Área - Cliente" distintos entre os membros dados. */
export function listDistinctSquads(members: { area?: string | null; squad?: string | null }[]): string[] {
  const set = new Set<string>();
  for (const m of members) {
    for (const { area, squad } of expandAreaSquadPairs(m.area, m.squad)) {
      set.add(squadKey(area, squad));
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

/** Lista, em ordem alfabética, os valores distintos de `members.area` (sem juntar com squad). */
export function listDistinctAreas(members: { area?: string | null }[]): string[] {
  const set = new Set<string>();
  for (const m of members) {
    (m.area || '').split(',').map((a) => a.trim()).filter(Boolean).forEach((a) => set.add(a));
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

/**
 * Roles especiais de "operação" — um por cliente. Só enxergam (não aprovam) todo mundo
 * daquele cliente, independente da área. Usado tanto no front (gate de aba) quanto no
 * backend (filtro dos dados).
 */
export const OPERACAO_ROLE_SQUAD: Record<string, string> = {
  operacao_sme: 'SME',
  operacao_syngenta: 'Syngenta',
  operacao_enterprise: 'Enterprise',
};

export function isOperacaoRole(role: string): boolean {
  return role in OPERACAO_ROLE_SQUAD;
}

/** Cliente (squad) que essa role de operação enxerga, ou null se não for uma role de operação. */
export function operacaoRoleSquad(role: string): string | null {
  return OPERACAO_ROLE_SQUAD[role] || null;
}

/**
 * Roles especiais por ÁREA (em vez de cliente) — enxergam (não aprovam) todo mundo daquelas
 * áreas, de qualquer cliente. Os valores aqui têm que bater exatamente com o que está hoje na
 * coluna `members.area` no banco real (confira direto na tabela antes de mudar — não usar uma
 * cópia local, que pode estar desatualizada).
 */
export const AREA_ROLE_AREAS: Record<string, string[]> = {
  midias_seo: ['Mídia', 'SEO'],
};

export function isAreaRole(role: string): boolean {
  return role in AREA_ROLE_AREAS;
}

/** Áreas que essa role enxerga, ou null se não for uma role de área. */
export function areaRoleAreas(role: string): string[] | null {
  return AREA_ROLE_AREAS[role] || null;
}
