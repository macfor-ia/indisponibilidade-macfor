import { NextRequest, NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, isAdminEditor, countCalendarDays, cleanText } from '../../../lib/auth';
import { loadSetores } from '../../../lib/setores';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { id } = await ctx.params;
  const record: any = await queries.getUnavailabilityById(parseInt(id));
  if (!record) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  if (record.status !== 'pending') return NextResponse.json({ error: 'Apenas solicitações pendentes podem ser editadas.' }, { status: 400 });
  if (record.user_id !== user!.id && !isAdminEditor(user!.role)) {
    return NextResponse.json({ error: 'Sem permissão para editar esta solicitação.' }, { status: 403 });
  }
  const { start_date, end_date, unavailability_type, department } = await req.json();
  if (!start_date || !end_date) return NextResponse.json({ error: 'Datas são obrigatórias.' }, { status: 400 });
  if (start_date > end_date) return NextResponse.json({ error: 'Data de início deve ser anterior ao retorno.' }, { status: 400 });
  const [psy, psm, psd] = start_date.split('-').map(Number);
  const [pey, pem, ped] = end_date.split('-').map(Number);
  const patchStartMs = Date.UTC(psy, psm - 1, psd);
  const patchEndMs = Date.UTC(pey, pem - 1, ped);
  const nowP = new Date();
  const todayMsP = Date.UTC(nowP.getUTCFullYear(), nowP.getUTCMonth(), nowP.getUTCDate());
  if (patchStartMs < todayMsP + 15 * 86400000) {
    return NextResponse.json({ error: 'A data de início deve ser pelo menos 15 dias a partir de hoje.' }, { status: 400 });
  }
  const total_days = countCalendarDays(patchStartMs, patchEndMs);
  const existing = await queries.getUserActiveUnavailability(record.user_id);
  const overlap = existing.find((r: any) => r.id !== record.id && start_date <= r.end_date && r.start_date <= end_date);
  if (overlap) return NextResponse.json({ error: `Período se sobrepõe a outra solicitação (${overlap.start_date} a ${overlap.end_date}).` }, { status: 400 });
  if (department && !loadSetores().includes(department)) {
    return NextResponse.json({ error: 'Setor inválido.' }, { status: 400 });
  }
  try {
    const updateData: any = { start_date, end_date, total_days };
    if (unavailability_type) updateData.unavailability_type = unavailability_type;
    if (department) updateData.department = cleanText(department);
    await queries.updateUnavailability(record.id, updateData);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { id } = await ctx.params;
  const record: any = await queries.getUnavailabilityById(parseInt(id));
  if (!record) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  if (!isAdminEditor(user!.role)) {
    if (record.status !== 'pending') {
      return NextResponse.json({ error: 'Apenas solicitações pendentes podem ser canceladas.' }, { status: 400 });
    }
    if (record.user_id !== user!.id) {
      return NextResponse.json({ error: 'Sem permissão para excluir esta solicitação.' }, { status: 403 });
    }
  }
  try {
    await queries.deleteUnavailability(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
