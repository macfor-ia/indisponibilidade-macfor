import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, isAdmin } from '../../../lib/auth';
import { filterUnavailabilityByReportTo } from '../../../lib/unavailability-helpers';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  // Sem gate por role aqui: qualquer pessoa pode chamar, mas só vê (mais
  // abaixo) as solicitações de quem de fato reporta pra ela — pra quem não
  // é aprovador de ninguém, o filtro abaixo já devolve lista vazia.
  const allPending = await queries.getPendingUnavailability();

  async function attachConflicts(list: any[]) {
    if (!list.length) return list;
    const conflicts = await queries.getEventConflictsForRequests(
      list.map((r: any) => ({ id: r.id, user_id: r.user_id, start_date: r.start_date, end_date: r.end_date })),
    );
    return list.map((r: any) => ({ ...r, event_conflicts: conflicts[r.id] || [] }));
  }

  if (isAdmin(user!.role)) {
    return NextResponse.json(await attachConflicts(allPending));
  }
  if (!allPending.length) return NextResponse.json([]);

  // Nem líder nem sócio veem o próprio pedido nesta fila de aprovação (cada
  // um acompanha o status do seu em "Minhas Solicitações").
  const othersPending = allPending.filter((r: any) => r.user_id !== user!.id);

  // Solicitação só aparece pra quem está no report_to do solicitante — vale
  // igual pra líder e sócio, mesmo critério de canApproveUnavailability, pra
  // aba bater com o que cada um consegue de fato confirmar/reavaliar.
  const filtered = await filterUnavailabilityByReportTo(othersPending, user!);
  return NextResponse.json(await attachConflicts(filtered));
}
