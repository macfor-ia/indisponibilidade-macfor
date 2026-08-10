import { NextRequest, NextResponse } from 'next/server';
import { queries } from '../../../../lib/database';
import { requireAuth, requireMasterAdmin, cleanText } from '../../../../lib/auth';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { id } = await ctx.params;
  const memberId = parseInt(id);
  const existing = await queries.getMemberById(memberId);
  if (!existing) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });

  const body = await req.json();
  const { name, email, area, squad, funcao, report_to, operacoes, day_offs_quota, mes_ano_entrada } = body;
  if (!name || !area || !funcao) return NextResponse.json({ error: 'Nome, área e função são obrigatórios.' }, { status: 400 });
  if (email) {
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.endsWith('@macfor.com.br')) return NextResponse.json({ error: 'Email deve ser @macfor.com.br.' }, { status: 400 });
    const dup = await queries.getMemberByEmail(emailLower);
    if (dup && (dup as any).id !== memberId) return NextResponse.json({ error: 'Já existe outro membro com este email.' }, { status: 400 });
  }
  const mesAnoEntrada = mes_ano_entrada ? String(mes_ano_entrada).trim() : null;
  if (mesAnoEntrada && !/^(0?[1-9]|1[0-2])\/\d{4}$/.test(mesAnoEntrada)) {
    return NextResponse.json({ error: 'Mês/Ano de Entrada deve estar no formato MM/AAAA.' }, { status: 400 });
  }
  try {
    const updateData: any = {
      name: cleanText(name),
      area: cleanText(area),
      squad: squad ? cleanText(squad) : null,
      funcao: cleanText(funcao),
      report_to: report_to ? cleanText(report_to) : null,
      operacoes: !!operacoes,
      day_offs_quota: parseInt(day_offs_quota) || 20,
      mes_ano_entrada: mesAnoEntrada,
    };
    if (email !== undefined) {
      updateData.email = email ? email.toLowerCase().trim() : null;
    }
    // Se a data de entrada mudou, reseta o controle de último crédito aplicado
    // pra recalcular do zero com a data nova (evita ficar com contagem presa
    // à data antiga/errada).
    if (mesAnoEntrada !== ((existing as any).mes_ano_entrada || null)) {
      updateData.ultimo_credito_em = null;
    }
    const updated = await queries.updateMember(memberId, updateData);
    return NextResponse.json({ success: true, member: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { id } = await ctx.params;
  const memberId = parseInt(id);
  const existing = await queries.getMemberById(memberId);
  if (!existing) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });
  try {
    await queries.deleteMember(memberId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
