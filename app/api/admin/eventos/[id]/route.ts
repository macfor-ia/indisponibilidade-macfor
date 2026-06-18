import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdminEditor, cleanText } from '../../../../lib/auth';
import { EventoModel } from '../../../models';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await params;
  const eid = parseInt(id);
  if (isNaN(eid)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  try {
    const body = await req.json();
    const payload: any = {};
    if (body.nome !== undefined) payload.nome = cleanText(body.nome);
    if (body.descricao !== undefined) payload.descricao = body.descricao ? cleanText(body.descricao) : null;
    if (body.data_inicio !== undefined) payload.data_inicio = String(body.data_inicio);
    if (body.data_fim !== undefined) payload.data_fim = String(body.data_fim);
    if (body.cliente_ids !== undefined) {
      payload.cliente_ids = Array.isArray(body.cliente_ids)
        ? body.cliente_ids.map((x: any) => parseInt(x)).filter((n: number) => !isNaN(n))
        : [];
    }
    const evento = await EventoModel.update(eid, payload);
    return NextResponse.json({ success: true, evento });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await params;
  const eid = parseInt(id);
  if (isNaN(eid)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  try {
    await EventoModel.delete(eid);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
