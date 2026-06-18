import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  const member = await queries.getMemberByEmail(user!.email);
  if (!member) return NextResponse.json({ member: null, approver: null, used_days: 0, remaining_days: 0 });
  const usedDays = await queries.getUsedDaysByUser(user!.id);
  const approverResult = await queries.getApproverForMember(user!.email);
  let approver: any = null;
  if (Array.isArray(approverResult)) {
    approver = approverResult.map((a: any) => ({ name: a.name, email: a.email }));
  } else if (approverResult) {
    approver = { name: (approverResult as any).name, email: (approverResult as any).email };
  }
  const m: any = member;
  return NextResponse.json({
    member,
    approver,
    used_days: usedDays,
    remaining_days: (m.day_offs_quota || 0) - usedDays,
    quota: m.day_offs_quota || 0,
  });
}
