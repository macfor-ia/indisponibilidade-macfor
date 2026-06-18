import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queries } from '../../../lib/database';
import { getSession } from '../../../lib/session';
import { checkLoginRate } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const rate = checkLoginRate(ip);
    if (!rate.allowed) {
      return NextResponse.json({ error: `Muitas tentativas de login. Tente novamente em ${rate.minutes} minuto(s).` }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email e senha obrigatórios.' }, { status: 400 });

    const user = await queries.getUserByEmail(email.toLowerCase().trim());
    if (!user) return NextResponse.json({ error: 'Email ou senha incorretos.' }, { status: 401 });

    if (!bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Email ou senha incorretos.' }, { status: 401 });
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'Seu cadastro está aguardando verificação de um administrador.' }, { status: 403 });
    }
    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Seu acesso foi recusado. Entre em contato com um administrador.' }, { status: 403 });
    }

    const session = await getSession();
    session.userId = user.id;
    await session.save();

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[login] ERRO:', err?.message, err?.stack);
    }
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
}
