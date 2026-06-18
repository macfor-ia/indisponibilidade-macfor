import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdminEditor, cleanText } from '../../../../lib/auth';
import { ClienteModel } from '../../../models';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await params;
  const cid = parseInt(id);
  if (isNaN(cid)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  try {
    const body = await req.json();
    const payload: any = {};
    if (body.nome !== undefined) payload.nome = cleanText(body.nome);
    if (body.descricao !== undefined) payload.descricao = body.descricao ? cleanText(body.descricao) : null;
    if (body.ativo !== undefined) payload.ativo = !!body.ativo;
    const cliente = await ClienteModel.update(cid, payload);
    return NextResponse.json({ success: true, cliente });
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
  const cid = parseInt(id);
  if (isNaN(cid)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  try {
    await ClienteModel.delete(cid);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
