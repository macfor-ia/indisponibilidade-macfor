import { NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth } from '../../../../lib/auth';
import { canApproveUnavailability } from '../../../../lib/unavailability-helpers';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { id } = await ctx.params;
  try {
    const record: any = await queries.getUnavailabilityById(parseInt(id));
    if (!record) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
    if (record.status !== 'pending') return NextResponse.json({ error: 'Solicitação já foi revisada.' }, { status: 400 });
    const canApprove = await canApproveUnavailability(user!, record);
    if (!canApprove) return NextResponse.json({ error: 'Você não tem permissão para confirmar esta solicitação.' }, { status: 403 });
    await queries.approveUnavailability({ id: parseInt(id), reviewed_by: user!.id });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
