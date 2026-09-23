import { NextResponse } from 'next/server';
import { queries } from '../../lib/database';
import { requireAuth } from '../../lib/auth';

/**
 * Equipe do usuário logado: membros cujo report_to_email/report_to_name aponta pra ele —
 * mesmo critério usado em canApproveUnavailability/is_approver. Aberto a qualquer conta
 * autenticada; quem não é aprovador de ninguém simplesmente recebe uma lista vazia.
 */
export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  const member: any = await queries.getMemberByEmail(user!.email.toLowerCase());
  const reports = await queries.getDirectReports(user!.email, member?.name);
  if (!reports.length) return NextResponse.json([]);

  const active = await queries.getActiveUnavailability();
  const activeEmails = new Set(active.map((a: any) => (a.user_email || '').toLowerCase()).filter(Boolean));

  const team = reports.map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    area: m.area,
    squad: m.squad,
    unavailable_now: m.email ? activeEmails.has(m.email.toLowerCase()) : false,
    remaining_days: m.day_offs_quota || 0,
  }));
  team.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));

  return NextResponse.json(team);
}
