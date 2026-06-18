import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireMasterAdmin, cleanText } from '../../../../lib/auth';
import { loadSetores, saveSetores } from '../../../../lib/setores';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ index: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { index } = await ctx.params;
  const idx = parseInt(index);
  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 });
  const list = loadSetores();
  if (idx < 0 || idx >= list.length) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 });
  const cleanTextd = cleanText(name.trim());
  if (list.some((s, i) => s.toLowerCase() === cleanTextd.toLowerCase() && i !== idx)) {
    return NextResponse.json({ error: 'Nome já existe.' }, { status: 400 });
  }
  list[idx] = cleanTextd;
  saveSetores(list);
  return NextResponse.json({ success: true, setores: list });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ index: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { index } = await ctx.params;
  const idx = parseInt(index);
  const list = loadSetores();
  if (idx < 0 || idx >= list.length) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 });
  list.splice(idx, 1);
  saveSetores(list);
  return NextResponse.json({ success: true, setores: list });
}
