import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queries } from '../../../lib/database';
import { cleanText } from '../../../lib/auth';
import { loadSetores } from '../../../lib/setores';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, full_name, department } = body;

  console.log('[register] dados recebidos:', { email, full_name, department, password: password ? '***' : undefined });

  if (!email || !password || !full_name || !department) {
    console.warn('[register] campos faltando:', { email: !!email, password: !!password, full_name: !!full_name, department: !!department });
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
  }
  const emailLower = email.toLowerCase().trim();
  if (!emailLower.endsWith('@macfor.com.br')) {
    return NextResponse.json({ error: 'Apenas emails @macfor.com.br podem se registrar.' }, { status: 400 });
  }
  const validDepts = loadSetores();
  console.log('[register] setores válidos:', validDepts);
  if (!validDepts.includes(department)) {
    return NextResponse.json({ error: 'Setor inválido.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
  }

  console.log('[register] verificando se email já existe no banco...');
  const existing = await queries.getUserByEmail(emailLower);
  if (existing) {
    return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 400 });
  }

  try {
    console.log('[register] criando hash da senha...');
    const hash = bcrypt.hashSync(password, 10);

    console.log('[register] buscando membro no banco:', emailLower);
    let member = await queries.getMemberByEmail(emailLower);
    if (!member) {
      console.log('[register] membro não encontrado, criando novo...');
      member = await queries.createMember({
        name: cleanText(full_name),
        email: emailLower,
        area: department,
        squad: null,
        funcao: null,
        report_to: null,
        operacoes: true,
        day_offs_quota: 20,
      });
      console.log('[register] membro criado, id:', (member as any).id);
    } else {
      console.log('[register] membro existente encontrado, id:', (member as any).id);
    }

    console.log('[register] criando usuário no banco...');
    await queries.createUser({
      email: emailLower,
      password: hash,
      full_name: cleanText(full_name),
      department,
      member_id: (member as any).id,
      role: 'colaborador',
    });

    console.log('[register] usuário criado com sucesso:', emailLower);
    return NextResponse.json({ success: true, message: 'Cadastro realizado! Aguarde verificação de um administrador.' });
  } catch (e: any) {
    console.error('[register] erro ao salvar no banco:', e.message, e);
    return NextResponse.json({ error: 'Erro ao criar conta: ' + e.message }, { status: 500 });
  }
}
