import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queries, supabase } from '../../../lib/database';

const INVALID_LINK = 'Link inválido ou expirado. Solicite uma nova redefinição de senha.';

// Recebe o access_token que o Supabase Auth coloca na URL do link do email
// (#access_token=...&type=recovery), confirma com o Supabase de quem é e
// grava a nova senha na tabela de usuários do sistema.
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.getUser(String(token));
    const email = data?.user?.email?.toLowerCase();
    if (error || !email) return NextResponse.json({ error: INVALID_LINK }, { status: 400 });

    const user = await queries.getUserByEmail(email);
    if (!user || user.status !== 'approved') return NextResponse.json({ error: INVALID_LINK }, { status: 400 });

    await queries.updateUserPassword(user.id, bcrypt.hashSync(String(password), 10));

    // Invalida o token pra que o mesmo link não possa ser usado de novo.
    await supabase.auth.admin.signOut(String(token)).catch(() => {});

    return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso! Faça login com a nova senha.' });
  } catch (err: any) {
    console.error('[reset-password] ERRO:', err?.message);
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
}
