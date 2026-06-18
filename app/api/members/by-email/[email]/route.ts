import { NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth } from '../../../../lib/auth';

export async function GET(_req: Request, ctx: { params: Promise<{ email: string }> }) {
  const { response } = await requireAuth();
  if (response) return response;

  const { email } = await ctx.params;
  const member = await queries.getMemberByEmail(decodeURIComponent(email));
  if (!member) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });
  const user = await queries.getUserByEmail((member as any).email);
  let usedDays = 0;
  if (user) {
    usedDays = await queries.getUsedDaysByUser(user.id);
  }
  const m: any = member;
  return NextResponse.json({ ...m, used_days: usedDays, remaining_days: (m.day_offs_quota || 0) - usedDays });
}
