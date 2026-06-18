import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdminEditor } from '../../../../../lib/auth';
import { ClienteModel } from '../../../../models';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await params;
  const cid = parseInt(id);
  if (isNaN(cid)) return NextResponse.json({ error: 'ID do cliente inválido.' }, { status: 400 });

  try {
    const { user_id, ativo } = await req.json();
    const uid = parseInt(user_id);
    if (isNaN(uid)) return NextResponse.json({ error: 'user_id inválido.' }, { status: 400 });

    if (ativo === false || ativo === 0 || ativo === '0') {
      await ClienteModel.unassignUser(uid, cid);
    } else {
      await ClienteModel.assignUser(uid, cid);
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminEditor(user!);
  if (aErr) return aErr;

  const { id } = await params;
  const cid = parseInt(id);
  if (isNaN(cid)) return NextResponse.json({ error: 'ID do cliente inválido.' }, { status: 400 });

  try {
    const { user_id } = await req.json();
    const uid = parseInt(user_id);
    if (isNaN(uid)) return NextResponse.json({ error: 'user_id inválido.' }, { status: 400 });
    await ClienteModel.unassignUser(uid, cid);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
