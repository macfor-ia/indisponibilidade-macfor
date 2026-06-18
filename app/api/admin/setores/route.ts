import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireMasterAdmin, cleanText } from '../../../lib/auth';
import { loadSetores, saveSetores } from '../../../lib/setores';

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: 'Nome do setor obrigatório.' }, { status: 400 });
  const list = loadSetores();
  const cleanTextd = cleanText(name.trim());
  if (list.map((s) => s.toLowerCase()).includes(cleanTextd.toLowerCase())) {
    return NextResponse.json({ error: 'Setor já existe.' }, { status: 400 });
  }
  list.push(cleanTextd);
  saveSetores(list);
  return NextResponse.json({ success: true, setores: list });
}
