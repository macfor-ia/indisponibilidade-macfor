import { NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth, requireAdminEditor } from '../../../../lib/auth';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await ctx.params;
  const userId = parseInt(id);
  const target = await queries.getUserById(userId);
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  if (target.status === 'approved') return NextResponse.json({ error: 'Usuário já está liberado.' }, { status: 400 });
  try {
    await queries.approveUser({ id: userId, approved_by: user!.id });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
