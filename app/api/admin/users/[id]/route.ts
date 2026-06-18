import { NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth, requireAdminEditor, isMasterAdmin } from '../../../../lib/auth';

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await ctx.params;
  const userId = parseInt(id);
  if (userId === user!.id) {
    return NextResponse.json({ error: 'Você não pode remover a si mesmo.' }, { status: 400 });
  }
  const target = await queries.getUserById(userId);
  if (target && isMasterAdmin(target.role)) {
    return NextResponse.json({ error: 'O Admin Master não pode ser removido.' }, { status: 403 });
  }
  const activeRecords = await queries.getUserActiveUnavailability(userId);
  if (activeRecords.length > 0) {
    const labels = activeRecords.map((r: any) => `${r.start_date} (${r.status})`).join(', ');
    return NextResponse.json({ error: `Usuário possui solicitações ativas: ${labels}. Cancele-as antes de remover o usuário.` }, { status: 400 });
  }
  try {
    await queries.deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
