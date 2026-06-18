import { NextRequest, NextResponse } from 'next/server';
import { queries } from '../../lib/database';
import { requireAuth, canViewAll, countCalendarDays } from '../../lib/auth';
import { loadSetores } from '../../lib/setores';

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { unavailability_type, department, start_date, end_date, total_days } = await req.json();
  if (!unavailability_type || !department || !start_date || !end_date || total_days == null) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
  }
  const validTypes = ['prolongado', 'pontual'];
  if (!validTypes.includes(unavailability_type)) {
    return NextResponse.json({ error: 'Tipo de indisponibilidade inválido.' }, { status: 400 });
  }
  const validDepts = loadSetores();
  if (!validDepts.includes(department)) {
    return NextResponse.json({ error: 'Setor inválido.' }, { status: 400 });
  }
  const [sy, sm, sd] = start_date.split('-').map(Number);
  const [ey, em, ed] = end_date.split('-').map(Number);
  if (!sy || !ey || isNaN(sy) || isNaN(ey)) {
    return NextResponse.json({ error: 'Datas inválidas.' }, { status: 400 });
  }
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  if (endMs < startMs) {
    return NextResponse.json({ error: 'Data de retorno deve ser posterior à data de início.' }, { status: 400 });
  }
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (startMs < todayMs + 15 * 86400000) {
    return NextResponse.json({ error: 'A data de início deve ser pelo menos 15 dias a partir de hoje.' }, { status: 400 });
  }
  const expectedDays = countCalendarDays(startMs, endMs);
  if (parseInt(total_days) !== expectedDays) {
    return NextResponse.json({ error: `Total de dias corridos inválido. Esperado: ${expectedDays}.` }, { status: 400 });
  }
  if (unavailability_type === 'prolongado' && expectedDays < 5) {
    return NextResponse.json({ error: 'A solicitação de indisponibilidade deve ter no mínimo 5 dias corridos.' }, { status: 400 });
  }
  const existing = await queries.getUserActiveUnavailability(user!.id);
  const overlap = existing.find((r: any) => start_date <= r.end_date && r.start_date <= end_date);
  if (overlap) {
    return NextResponse.json({
      error: `Período se sobrepõe a uma solicitação ${overlap.status === 'approved' ? 'aprovada' : 'pendente'} (${overlap.start_date} a ${overlap.end_date}). Cancele ou aguarde a conclusão antes de solicitar um novo período sobreposto.`,
    }, { status: 400 });
  }
  try {
    await queries.createUnavailability({
      user_id: user!.id,
      full_name: user!.full_name,
      unavailability_type,
      department,
      start_date,
      end_date,
      total_days: expectedDays,
      status: 'pending',
    });
    return NextResponse.json({ success: true, message: 'Solicitação de indisponibilidade enviada com sucesso.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  if (canViewAll(user!.role)) {
    const LIMIT = 500;
    const data = await queries.getAllUnavailability({ limit: LIMIT });
    return NextResponse.json({ data, truncated: data.length >= LIMIT });
  } else {
    return NextResponse.json({ data: await queries.getUserUnavailability(user!.id), truncated: false });
  }
}
