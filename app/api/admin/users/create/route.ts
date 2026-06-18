import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queries } from '../../../../lib/database';
import { requireAuth, requireMasterAdmin, cleanText } from '../../../../lib/auth';
import { loadSetores } from '../../../../lib/setores';

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireMasterAdmin(user!);
  if (aErr) return aErr;

  const { email, password, full_name, department, role } = await req.json();
  if (!email || !password || !full_name || !department || !role) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
  }
  const emailLower = email.toLowerCase().trim();
  if (!emailLower.endsWith('@macfor.com.br')) {
    return NextResponse.json({ error: 'Apenas emails @macfor.com.br são permitidos.' }, { status: 400 });
  }
  const validDepts = loadSetores();
  if (!validDepts.includes(department)) {
    return NextResponse.json({ error: 'Setor inválido.' }, { status: 400 });
  }
  const validRoles = ['admin_editor', 'admin_leitor', 'socio', 'colaborador', 'lider'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Role inválido.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
  }
  const existing = await queries.getUserByEmail(emailLower);
  if (existing) {
    return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 400 });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const member = await queries.getMemberByEmail(emailLower);
    const created = await queries.createUser({
      email: emailLower,
      password: hash,
      full_name: cleanText(full_name),
      department,
      member_id: member ? (member as any).id : null,
      role,
    });
    await queries.approveUser({ id: (created as any).id, approved_by: user!.id });
    return NextResponse.json({ success: true, message: 'Usuário criado e liberado com sucesso.' });
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao criar usuário: ' + e.message }, { status: 500 });
  }
}
