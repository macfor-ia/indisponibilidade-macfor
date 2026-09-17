import { queries } from './database';
import { isAdminEditor, isMasterAdmin, AuthUser } from './auth';

export function parseReportTo(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Compara separadamente por e-mail (report_to_email) e por nome
 * (report_to_name) — cada coluna guarda sua própria lista de aprovadores
 * (separados por vírgula/ponto e vírgula), e basta bater em uma das duas
 * (OU) pra considerar aprovador. Comparação continua exata (trim+lowercase);
 * por isso o e-mail é a via confiável, o nome é um complemento pra quem
 * ainda não tem e-mail cadastrado como aprovador.
 */
export function reportToMatchesLider(
  reportToEmail: string | null | undefined,
  reportToName: string | null | undefined,
  liderEmail: string | null | undefined,
  liderName: string | null | undefined,
): boolean {
  const emailLower = liderEmail ? liderEmail.toLowerCase() : null;
  const nameLower = liderName ? liderName.toLowerCase() : null;
  if (emailLower && parseReportTo(reportToEmail).includes(emailLower)) return true;
  if (nameLower && parseReportTo(reportToName).includes(nameLower)) return true;
  return false;
}

/**
 * Squad (tabela members) pode ter mais de um valor na mesma linha, separados
 * por vírgula (ex.: "SME, Syngenta, Enterprise") — cada um tratado como um
 * squad independente.
 */
export function parseSquads(squad: string | null | undefined): string[] {
  if (!squad) return [];
  return squad
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Basta ter pelo menos um squad em comum entre os dois lados. */
export function squadsOverlap(
  squadA: string | null | undefined,
  squadB: string | null | undefined,
): boolean {
  const a = parseSquads(squadA);
  if (!a.length) return false;
  const b = new Set(parseSquads(squadB));
  return a.some((s) => b.has(s));
}

/**
 * Carrega em lote os usuários (users5) e members correspondentes de uma
 * lista de solicitações, pra evitar N+1 queries nos filtros abaixo.
 */
async function batchLoadUsersAndMembers(list: { user_id: number }[]) {
  const userIds = [...new Set(list.map((r) => r.user_id))];
  const batchUsers = await queries.getUsersByIds(userIds);
  const userById: Record<number, any> = Object.fromEntries(batchUsers.map((u: any) => [u.id, u]));

  const memberIds = batchUsers.filter((u: any) => u.member_id).map((u: any) => u.member_id);
  const emailsWithoutMemberId = batchUsers.filter((u: any) => !u.member_id && u.email).map((u: any) => u.email);
  const [membersByIds, membersByEmails] = await Promise.all([
    memberIds.length ? queries.getMembersByIds(memberIds) : Promise.resolve([]),
    emailsWithoutMemberId.length ? queries.getMembersByEmails(emailsWithoutMemberId) : Promise.resolve([]),
  ]);
  const memberByMemberId: Record<number, any> = Object.fromEntries(membersByIds.map((m: any) => [m.id, m]));
  const memberByEmail: Record<string, any> = Object.fromEntries(
    [...membersByIds, ...membersByEmails].filter((m: any) => m.email).map((m: any) => [m.email.toLowerCase(), m])
  );

  function getMember(u: any) {
    return (u.member_id ? memberByMemberId[u.member_id] : null) ?? (u.email ? memberByEmail[u.email.toLowerCase()] : null);
  }

  return { userById, getMember };
}

/**
 * Filtra uma lista de solicitações de indisponibilidade (ex.: aba "Indisponíveis
 * Agora") para o que um líder pode VER: pessoas que estão no mesmo department
 * (tabela users5) E que têm pelo menos um squad em comum (tabela members,
 * coluna squad pode ter vários valores separados por vírgula) com o próprio
 * líder, e/ou pessoas cujo report_to_email/report_to_name (tabela members)
 * aponta pra ele — é OU, não E. Isso é só visualização geral — não confundir
 * com a fila de aprovação (filterUnavailabilityByReportTo) nem com quem ele
 * pode aprovar (canApproveUnavailability), que usam só report_to_email/name.
 */
export async function filterUnavailabilityForLider<T extends { user_id: number }>(
  list: T[],
  liderUser: AuthUser,
): Promise<T[]> {
  if (!list.length) return list;

  const liderEmailLower = liderUser.email ? liderUser.email.toLowerCase() : null;
  const liderMember: any = liderEmailLower ? await queries.getMemberByEmail(liderEmailLower) : null;
  const liderSquad = liderMember?.squad || null;
  const liderName = liderMember?.name || null;

  const { userById, getMember } = await batchLoadUsersAndMembers(list);

  return list.filter((r) => {
    const u = userById[r.user_id];
    if (!u) return false;
    const member = getMember(u);

    const sameDeptAndSquad = !!liderUser.department && u.department === liderUser.department
      && !!member && squadsOverlap(liderSquad, member.squad);
    const reportsToLider = !!member && reportToMatchesLider(member.report_to_email, member.report_to_name, liderUser.email, liderName);

    return sameDeptAndSquad || reportsToLider;
  });
}

/**
 * Filtra uma lista de solicitações de indisponibilidade pra quem só enxerga um cliente
 * inteiro (roles "operacao_sme"/"operacao_syngenta"/"operacao_enterprise"): todo mundo cuja
 * coluna squad (tabela members) inclui esse cliente, de qualquer área — sem olhar
 * department/report_to. Isso é só visualização; nunca dá poder de aprovar.
 */
export async function filterUnavailabilityBySquad<T extends { user_id: number }>(
  list: T[],
  squadName: string,
): Promise<T[]> {
  if (!list.length) return list;

  const { userById, getMember } = await batchLoadUsersAndMembers(list);

  return list.filter((r) => {
    const u = userById[r.user_id];
    if (!u) return false;
    const member = getMember(u);
    return squadsOverlap(squadName, member?.squad);
  });
}

/**
 * Filtra uma lista de solicitações de indisponibilidade pra quem só enxerga um conjunto de
 * ÁREAS (ex.: role "midias_seo" → ["Media Guild", "SEO"]): todo mundo cuja coluna area
 * (tabela members) inclui alguma dessas áreas, de qualquer cliente. Isso é só visualização;
 * nunca dá poder de aprovar.
 */
export async function filterUnavailabilityByAreas<T extends { user_id: number }>(
  list: T[],
  areas: string[],
): Promise<T[]> {
  if (!list.length) return list;

  const wanted = new Set(areas.map((a) => a.toLowerCase()));
  const { userById, getMember } = await batchLoadUsersAndMembers(list);

  return list.filter((r) => {
    const u = userById[r.user_id];
    if (!u) return false;
    const member = getMember(u);
    const memberAreas = String(member?.area || '').split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean);
    return memberAreas.some((a: string) => wanted.has(a));
  });
}

/**
 * Filtra uma lista de solicitações para o que approverUser (líder ou sócio)
 * pode efetivamente APROVAR: nome/email dele presente no report_to_name/
 * report_to_email do member do solicitante. Mesmo critério usado em canApproveUnavailability — usada
 * pra fila de aprovação do sócio, onde "o que aparece na aba" precisa bater
 * com "o que dá pra confirmar/reavaliar".
 */
export async function filterUnavailabilityByReportTo<T extends { user_id: number }>(
  list: T[],
  approverUser: AuthUser,
): Promise<T[]> {
  if (!list.length || !approverUser.email) return [];

  const approverMember: any = await queries.getMemberByEmail(approverUser.email.toLowerCase());
  const approverName = approverMember?.name || null;

  const { userById, getMember } = await batchLoadUsersAndMembers(list);

  return list.filter((r) => {
    const u = userById[r.user_id];
    if (!u) return false;
    const member = getMember(u);
    return member ? reportToMatchesLider(member.report_to_email, member.report_to_name, approverUser.email, approverName) : false;
  });
}

/**
 * Decide quem pode aprovar/rejeitar uma solicitação. A regra do report_to vale
 * pra qualquer role (mesmo "colaborador"/prestador) — o que importa é o nome
 * (ou email) da pessoa estar no report_to_name (ou report_to_email) do member
 * do solicitante, não a role da conta. Não basta estar no mesmo setor/squad
 * (isso só vale pra visualização do líder, ver filterUnavailabilityForLider).
 */
export async function canApproveUnavailability(approverUser: AuthUser, record: any): Promise<boolean> {
  if (isMasterAdmin(approverUser.role)) return true;
  if (approverUser.id === record.user_id) return false;
  if (isAdminEditor(approverUser.role)) return true;
  if (approverUser.email) {
    const requester = await queries.getUserById(record.user_id);
    if (!requester) return false;
    let requesterMember: any = null;
    if (requester.member_id) {
      requesterMember = await queries.getMemberById(requester.member_id);
    }
    if (!requesterMember && requester.email) {
      requesterMember = await queries.getMemberByEmail(requester.email.toLowerCase());
    }
    if (requesterMember?.report_to_email || requesterMember?.report_to_name) {
      const approverMember: any = await queries.getMemberByEmail(approverUser.email.toLowerCase());
      return reportToMatchesLider(requesterMember.report_to_email, requesterMember.report_to_name, approverUser.email, approverMember?.name);
    }
  }
  return false;
}
