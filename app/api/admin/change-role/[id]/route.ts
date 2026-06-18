import { NextRequest, NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth, requireAdminEditor, isMasterAdmin } from '../../../../lib/auth';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await ctx.params;
  const { role } = await req.json();
  const userId = parseInt(id);
  const validRoles = ['admin_editor', 'admin_leitor', 'socio', 'colaborador', 'lider'];
  if (!validRoles.includes(role)) return NextResponse.json({ error: 'Role inválido.' }, { status: 400 });
  if (userId === user!.id) return NextResponse.json({ error: 'Você não pode alterar seu próprio role.' }, { status: 400 });
  const target = await queries.getUserById(userId);
  if (target && isMasterAdmin(target.role)) return NextResponse.json({ error: 'O role de Admin Master não pode ser alterado.' }, { status: 403 });
  try {
    await queries.changeUserRole({ id: userId, role });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
