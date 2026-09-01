// ═══ CRÉDITO ANUAL DE DAY OFFS POR TEMPO DE CASA ═══
//
// Regra: o membro já entra com 20 dias de saldo no dia da contratação
// (referentes ao 1º ano). Ele só ganha +20 dias quando completa CADA ano
// adicional de casa — ou seja, a partir do 2º aniversário de empresa, depois
// no 3º, no 4º, e assim por diante. O 1º aniversário (completar 1 ano) NÃO
// gera crédito, pois esse ano já foi coberto pelo saldo inicial.
//
// Exemplo: entrada em Jan/2026 → 20 dias já no início. Em Jan/2027 (1 ano
// completo) nada é somado. Em Jan/2028 (2 anos completos) soma +20. Em
// Jan/2029 (3 anos completos) soma mais +20, e assim sucessivamente.
//
// É automático: acionado a cada login do membro (ver app/api/auth/login/route.ts).
// O cálculo é baseado no tempo total decorrido desde a entrada, não na data
// em que o login acontece — ou seja, não é preciso logar exatamente no mês de
// aniversário. Se o membro passar um ou mais aniversários sem logar, os
// créditos pendentes se acumulam e são aplicados de uma vez no próximo login
// (nenhum aniversário fica perdido).
//
// A coluna `ultimo_credito_em` guarda a data REAL (de hoje) em que o último
// crédito foi de fato concedido — fica null enquanto nenhum crédito nunca foi
// dado, e só muda quando um crédito é realmente aplicado. Pra saber "quantos
// créditos já foram concedidos até aqui" sem precisar de uma coluna à parte,
// comparamos essa data com a data de entrada usando a mesma conta de "anos
// completos" — ou seja, ela funciona tanto como registro/auditoria quanto
// como a fonte da conta.

const ENTRY_DATE_RE = /^(\d{1,2})\/(\d{4})$/;

/** Converte "MM/YYYY" (formato salvo em mes_ano_entrada) em uma data. Retorna null se vazio/inválido. */
export function parseEntryDate(value?: string | null): Date | null {
  if (!value) return null;
  const m = String(value).trim().match(ENTRY_DATE_RE);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const year = parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function todayIso(asOf: Date): string {
  return `${asOf.getUTCFullYear()}-${String(asOf.getUTCMonth() + 1).padStart(2, '0')}-${String(asOf.getUTCDate()).padStart(2, '0')}`;
}

/** Quantos anos completos se passaram entre `entryDate` e `asOf` (aniversário-based, não ano-calendário). */
function fullYearsCompleted(entryDate: Date, asOf: Date): number {
  let years = asOf.getUTCFullYear() - entryDate.getUTCFullYear();
  if (asOf.getUTCMonth() < entryDate.getUTCMonth()) years -= 1;
  return Math.max(0, years);
}

export interface CreditableMember {
  id: number;
  mes_ano_entrada?: string | null;
  ultimo_credito_em?: string | null; // data real (YYYY-MM-DD) do último crédito concedido, ou null se nunca
  day_offs_quota?: number | null;
}

/**
 * Verifica se o membro tem crédito(s) anual(is) pendente(s) até a data `asOf`
 * (podendo acumular mais de um ano se o membro não checou há tempo) e
 * retorna o que deveria ser atualizado no banco, ou null se não há nada a
 * creditar agora.
 */
export function computeCreditUpdate(member: CreditableMember, asOf: Date = new Date()) {
  if (!member || !member.mes_ano_entrada) return null;
  const entryDate = parseEntryDate(member.mes_ano_entrada);
  if (!entryDate) return null;

  const yearsNow = fullYearsCompleted(entryDate, asOf);
  const creditsDueNow = Math.max(0, yearsNow - 1); // pula o 1º ano (já coberto pelo saldo inicial)

  // Quantos créditos já foram concedidos até aqui: calculado com a mesma
  // conta de "anos completos", só que usando a data do último crédito no
  // lugar de hoje. Se nunca houve crédito, considera o 1º ano já resolvido
  // pelo saldo inicial (equivale a "1 ano completo, 0 créditos concedidos").
  const lastCreditDate = member.ultimo_credito_em ? new Date(`${member.ultimo_credito_em}T00:00:00Z`) : null;
  const yearsAtLastCredit = lastCreditDate ? fullYearsCompleted(entryDate, lastCreditDate) : 1;
  const creditsGranted = Math.max(0, yearsAtLastCredit - 1);

  const delta = creditsDueNow - creditsGranted;
  if (delta <= 0) return null;

  return {
    ultimo_credito_em: todayIso(asOf),
    day_offs_quota: (member.day_offs_quota || 0) + delta * 20,
  };
}
