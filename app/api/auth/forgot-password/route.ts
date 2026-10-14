import { NextRequest, NextResponse } from 'next/server';
import { queries, supabase } from '../../../lib/database';
import { checkLoginRate } from '../../../lib/auth';

// Resposta sempre igual, exista ou não o email — pra não revelar quem tem conta.
const GENERIC_MESSAGE = 'Se este email estiver cadastrado, você receberá um link para redefinir sua senha em instantes.';

function getAppUrl(req: NextRequest) {
  // Em produção o link precisa vir de APP_URL (e não do header Host da
  // requisição, que pode ser forjado pra mandar o link pra outro domínio).
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') throw new Error('APP_URL não está definida.');
  return req.nextUrl.origin;
}

// O login do sistema usa a tabela própria de usuários, mas o email de
// redefinição é enviado pelo Supabase Auth (igual à plataforma de agentes).
// Pra isso o email precisa existir em auth.users — cria lá se ainda não existir.
async function ensureAuthUser(email: string) {
  const { error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
  if (error && !/already.*registered|already exists/i.test(error.message)) throw error;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const rate = checkLoginRate(`forgot:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json({ error: `Muitas tentativas. Tente novamente em ${rate.minutes} minuto(s).` }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Informe seu email.' }, { status: 400 });

    const user = await queries.getUserByEmail(String(email).toLowerCase().trim());
    if (!user || user.status !== 'approved') {
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    }

    await ensureAuthUser(user.email);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${getAppUrl(req)}/reset-password`,
    });
    if (error) throw error;

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (err: any) {
    console.error('[forgot-password] ERRO:', err?.message);
    return NextResponse.json({ error: 'Não foi possível enviar o email agora. Tente novamente mais tarde.' }, { status: 500 });
  }
}
