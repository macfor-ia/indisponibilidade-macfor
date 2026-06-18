import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, isAdmin, isLider } from '../../../lib/auth';
import { reportToMatchesLider } from '../../../lib/unavailability-helpers';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  if (!isAdmin(user!.role) && !isLider(user!.role) && user!.role !== 'socio') {
    return NextResponse.json({ error: 'Acesso restrito a líderes e administradores.' }, { status: 403 });
  }
  const allPending = await queries.getPendingUnavailability();

  async function attachConflicts(list: any[]) {
    if (!list.length) return list;
    const conflicts = await queries.getEventConflictsForRequests(
      list.map((r: any) => ({ id: r.id, user_id: r.user_id, start_date: r.start_date, end_date: r.end_date })),
    );
    return list.map((r: any) => ({ ...r, event_conflicts: conflicts[r.id] || [] }));
  }

  if (isAdmin(user!.role) || user!.role === 'socio') {
    return NextResponse.json(await attachConflicts(allPending));
  }
  if (!allPending.length) return NextResponse.json([]);

  const userIds = [...new Set(allPending.map((r: any) => r.user_id))] as number[];
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

  const liderEmail = user!.email || '';
  const liderMember: any = liderEmail ? await queries.getMemberByEmail(liderEmail.toLowerCase()) : null;
  const liderName = liderMember?.name || null;

  const filtered = allPending.filter((r: any) => {
    if (r.user_id === user!.id) return false;
    const u = userById[r.user_id];
    if (!u) return false;
    if (user!.department && u.department === user!.department) return true;
    const member = (u.member_id ? memberByMemberId[u.member_id] : null)
      ?? (u.email ? memberByEmail[u.email.toLowerCase()] : null);
    return member ? reportToMatchesLider(member.report_to, liderEmail, liderName) : false;
  });
  return NextResponse.json(await attachConflicts(filtered));
}
