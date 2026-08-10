import { NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth } from '../../../../lib/auth';

export async function GET(_req: Request, ctx: { params: Promise<{ email: string }> }) {
  const { response } = await requireAuth();
  if (response) return response;

  const { email } = await ctx.params;
  const member = await queries.getMemberByEmail(decodeURIComponent(email));
  if (!member) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });
  const m: any = member;
  // day_offs_quota é o saldo atual — descontado na confirmação, devolvido se
  // uma solicitação aprovada for removida (ver app/lib/database.ts).
  return NextResponse.json({ ...m, remaining_days: m.day_offs_quota || 0 });
}
