import { NextRequest, NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, requireMasterAdmin, cleanText } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { name, email, area, squad, funcao, report_to, operacoes, day_offs_quota } = await req.json();
  if (!name || !area || !funcao) return NextResponse.json({ error: 'Nome, área e função são obrigatórios.' }, { status: 400 });
  if (email) {
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.endsWith('@macfor.com.br')) return NextResponse.json({ error: 'Email deve ser @macfor.com.br.' }, { status: 400 });
    const existing = await queries.getMemberByEmail(emailLower);
    if (existing) return NextResponse.json({ error: 'Já existe um membro com este email.' }, { status: 400 });
  }
  try {
    const member = await queries.createMember({
      name: cleanText(name),
      email: email ? email.toLowerCase().trim() : null,
      area: cleanText(area),
      squad: squad ? cleanText(squad) : null,
      funcao: cleanText(funcao),
      report_to: report_to ? cleanText(report_to) : null,
      operacoes: !!operacoes,
      day_offs_quota: parseInt(day_offs_quota) || 20,
    });
    return NextResponse.json({ success: true, member });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
