import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  const member = await queries.getMemberByEmail(user!.email);
  if (!member) return NextResponse.json({ member: null, approver: null, remaining_days: 0 });
  const approverResult = await queries.getApproverForMember(user!.email);
  let approver: any = null;
  if (Array.isArray(approverResult)) {
    approver = approverResult.map((a: any) => ({ name: a.name, email: a.email }));
  } else if (approverResult) {
    approver = { name: (approverResult as any).name, email: (approverResult as any).email };
  }
  const m: any = member;
  // day_offs_quota é o saldo atual — descontado na confirmação, devolvido se
  // uma solicitação aprovada for removida (ver app/lib/database.ts).
  return NextResponse.json({
    member,
    approver,
    remaining_days: m.day_offs_quota || 0,
  });
}
