import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdminEditor, cleanText } from '../../../lib/auth';
import { EventoModel } from '../../models';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const eventos = await EventoModel.list();
  return NextResponse.json({ eventos });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  try {
    const body = await req.json();
    const cliente_ids = Array.isArray(body.cliente_ids)
      ? body.cliente_ids.map((x: any) => parseInt(x)).filter((n: number) => !isNaN(n))
      : [];
    const evento = await EventoModel.create({
      nome: cleanText(body.nome || ''),
      descricao: body.descricao ? cleanText(body.descricao) : null,
      data_inicio: String(body.data_inicio || ''),
      data_fim: String(body.data_fim || ''),
      cliente_ids,
    });
    return NextResponse.json({ success: true, evento });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
