import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdminEditor, cleanText } from '../../../lib/auth';
import { ClienteModel } from '../../models';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const [clientes, links] = await Promise.all([
    ClienteModel.list(true),
    ClienteModel.getAllLinks(),
  ]);
  return NextResponse.json({ clientes, links });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  try {
    const body = await req.json();
    const nome = cleanText(body.nome || '');
    const descricao = body.descricao ? cleanText(body.descricao) : null;
    const ativo = body.ativo !== undefined ? !!body.ativo : true;
    const cliente = await ClienteModel.create({ nome, descricao, ativo });
    return NextResponse.json({ success: true, cliente });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
