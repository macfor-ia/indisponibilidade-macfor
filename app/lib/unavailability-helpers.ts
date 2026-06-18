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

export async function canApproveUnavailability(approverUser: AuthUser, record: any): Promise<boolean> {
  if (isMasterAdmin(approverUser.role)) return true;
  if (approverUser.id === record.user_id) return false;
  if (isAdminEditor(approverUser.role)) return true;
  if (isLider(approverUser.role)) {
    const requester = await queries.getUserById(record.user_id);
    if (!requester) return false;
    if (approverUser.department && requester.department === approverUser.department) return true;
    if (approverUser.email) {
      let requesterMember: any = null;
      if (requester.member_id) {
        requesterMember = await queries.getMemberById(requester.member_id);
      }
      if (!requesterMember && requester.email) {
        requesterMember = await queries.getMemberByEmail(requester.email.toLowerCase());
      }
      if (requesterMember?.report_to) {
        const liderMember: any = await queries.getMemberByEmail(approverUser.email.toLowerCase());
        if (reportToMatchesLider(requesterMember.report_to, approverUser.email, liderMember?.name)) {
          return true;
        }
      }
    }
  }
  return false;
}
