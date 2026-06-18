import { NextRequest, NextResponse } from 'next/server';
import { queries } from '../../../../../lib/database';
import { requireAuth, requireMasterAdmin, isMasterAdmin } from '../../../../../lib/auth';
import { loadSetores } from '../../../../../lib/setores';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { id } = await ctx.params;
  const userId = parseInt(id);
  const { setor, is_lider } = await req.json();
  if (setor !== null && setor !== undefined && setor !== '') {
    const list = loadSetores();
    if (!list.includes(setor)) return NextResponse.json({ error: 'Setor inválido.' }, { status: 400 });
  }
  const target = await queries.getUserById(userId);
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  if (isMasterAdmin(target.role)) return NextResponse.json({ error: 'Não é possível alterar o Admin Master.' }, { status: 403 });
  try {
    const ROLES_ABOVE_LIDER = ['admin_master', 'admin_editor', 'admin_leitor', 'socio'];
    const newRole = is_lider
      ? (ROLES_ABOVE_LIDER.includes(target.role) ? target.role : 'lider')
      : (target.role === 'lider' ? 'colaborador' : target.role);
    await queries.assignUserSetor({ id: userId, department: setor || null, role: newRole });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
