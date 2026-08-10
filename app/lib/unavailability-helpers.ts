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
 * Filtra uma lista de solicitações de indisponibilidade (pending, active, etc.)
 * para o que um líder pode VER: apenas pessoas que estão no mesmo department
 * (tabela users5) E no mesmo squad (tabela members) que o próprio líder.
 * Sem department (users5) ou sem squad cadastrado (members), o líder não
 * enxerga ninguém. Isso é só visualização — não confundir com quem ele pode
 * aprovar (ver canApproveUnavailability, que usa report_to).
 */
export async function filterUnavailabilityForLider<T extends { user_id: number }>(
  list: T[],
  liderUser: AuthUser,
): Promise<T[]> {
  if (!list.length) return list;
  if (!liderUser.department) return [];

  const liderEmailLower = liderUser.email ? liderUser.email.toLowerCase() : null;
  const liderMember: any = liderEmailLower ? await queries.getMemberByEmail(liderEmailLower) : null;
  const liderSquad = liderMember?.squad || null;
  if (!liderSquad) return [];

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

  return list.filter((r) => {
    const u = userById[r.user_id];
    if (!u || u.department !== liderUser.department) return false;
    const member = (u.member_id ? memberByMemberId[u.member_id] : null)
      ?? (u.email ? memberByEmail[u.email.toLowerCase()] : null);
    return !!member && member.squad === liderSquad;
  });
}

/**
 * Decide quem pode aprovar/rejeitar uma solicitação. Para líder, a única
 * regra é: o nome (ou email) dele precisa estar no report_to do member do
 * solicitante — não basta estar no mesmo setor/squad (isso só vale pra
 * visualização, ver filterUnavailabilityForLider).
 */
export async function canApproveUnavailability(approverUser: AuthUser, record: any): Promise<boolean> {
  if (isMasterAdmin(approverUser.role)) return true;
  if (approverUser.id === record.user_id) return false;
  if (isAdminEditor(approverUser.role)) return true;
  if (isLider(approverUser.role) && approverUser.email) {
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
      const liderMember: any = await queries.getMemberByEmail(approverUser.email.toLowerCase());
      return reportToMatchesLider(requesterMember.report_to, approverUser.email, liderMember?.name);
    }
  }
  return false;
}
