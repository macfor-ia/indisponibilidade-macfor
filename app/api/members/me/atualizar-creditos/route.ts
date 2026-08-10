import { NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth } from '../../../../lib/auth';

// Botão "Atualizar créditos" (aba Solicitar): checagem manual, sob demanda,
// de crédito anual de +20 dias por tempo de casa (ver app/lib/day-off-credits.ts).
export async function POST() {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { updated, member } = await queries.checkAndApplyDayOffCredit(user!.email);
  if (!member) {
    return NextResponse.json({ error: 'Nenhum cadastro de membro vinculado a este usuário.' }, { status: 404 });
  }

  const m: any = member;
  // day_offs_quota é o saldo atual — descontado na confirmação, devolvido se
  // uma solicitação aprovada for removida (ver app/lib/database.ts).
  return NextResponse.json({
    updated,
    member,
    remaining_days: m.day_offs_quota || 0,
  });
}
