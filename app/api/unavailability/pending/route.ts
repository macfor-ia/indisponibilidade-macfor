import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, isAdmin, isLider } from '../../../lib/auth';
import { filterUnavailabilityForLider } from '../../../lib/unavailability-helpers';

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

  // Líder não vê o próprio pedido nesta fila de aprovação (ele acompanha o
  // status dele em "Minhas Solicitações").
  const othersPending = allPending.filter((r: any) => r.user_id !== user!.id);
  const filtered = await filterUnavailabilityForLider(othersPending, user!);
  return NextResponse.json(await attachConflicts(filtered));
}
