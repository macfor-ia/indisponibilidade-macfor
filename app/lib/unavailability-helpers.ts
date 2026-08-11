import { queries } from './database';
import { isAdminEditor, isLider, isMasterAdmin, AuthUser } from './auth';

export function parseReportTo(report_to: string | null | undefined): string[] {
  if (!report_to) return [];
  return report_to
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function reportToMatchesLider(
  report_to: string | null | undefined,
  liderEmail: string | null | undefined,
  liderName: string | null | undefined,
): boolean {
  const parts = parseReportTo(report_to);
  if (!parts.length) return false;
  const emailLower = liderEmail ? liderEmail.toLowerCase() : null;
  const nameLower = liderName ? liderName.toLowerCase() : null;
  return parts.some((p) => {
    if (emailLower && p === emailLower) return true;
    if (nameLower && p === nameLower) return true;
    return false;
  });
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
 * líder, e/ou pessoas cujo report_to (tabela members) aponta pra ele — é OU,
 * não E. Isso é só visualização geral — não confundir com a fila de aprovação
 * (filterUnavailabilityByReportTo) nem com quem ele pode aprovar
 * (canApproveUnavailability), que usam só report_to.
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
    const reportsToLider = !!member && reportToMatchesLider(member.report_to, liderUser.email, liderName);

    return sameDeptAndSquad || reportsToLider;
  });
}

/**
 * Filtra uma lista de solicitações para o que approverUser (líder ou sócio)
 * pode efetivamente APROVAR: nome/email dele presente no report_to do member
 * do solicitante. Mesmo critério usado em canApproveUnavailability — usada
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
    return member ? reportToMatchesLider(member.report_to, approverUser.email, approverName) : false;
  });
}

/**
 * Decide quem pode aprovar/rejeitar uma solicitação. Para líder e sócio, a
 * regra é a mesma: o nome (ou email) dele precisa estar no report_to do
 * member do solicitante — não basta estar no mesmo setor/squad (isso só
 * vale pra visualização do líder, ver filterUnavailabilityForLider).
 */
export async function canApproveUnavailability(approverUser: AuthUser, record: any): Promise<boolean> {
  if (isMasterAdmin(approverUser.role)) return true;
  if (approverUser.id === record.user_id) return false;
  if (isAdminEditor(approverUser.role)) return true;
  if ((isLider(approverUser.role) || approverUser.role === 'socio') && approverUser.email) {
    const requester = await queries.getUserById(record.user_id);
    if (!requester) return false;
    let requesterMember: any = null;
    if (requester.member_id) {
      requesterMember = await queries.getMemberById(requester.member_id);
    }
    if (!requesterMember && requester.email) {
      requesterMember = await queries.getMemberByEmail(requester.email.toLowerCase());
    }
    if (requesterMember?.report_to) {
      const approverMember: any = await queries.getMemberByEmail(approverUser.email.toLowerCase());
      return reportToMatchesLider(requesterMember.report_to, approverUser.email, approverMember?.name);
    }
  }
  return false;
}
