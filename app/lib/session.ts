import { cookies } from 'next/headers';
import { getIronSession, SessionOptions } from 'iron-session';

export interface SessionData {
  userId?: number;
}

const isProduction = process.env.NODE_ENV === 'production' ||
  !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RENDER || !!process.env.FLY_APP_NAME;

// Fallback usado só em desenvolvimento local. Em produção SESSION_SECRET é obrigatória.
const DEV_ONLY_SECRET = 'dev-only-secret-nao-usar-em-producao-32-bytes-min';

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    if (secret.length < 32) {
      throw new Error('SESSION_SECRET precisa ter pelo menos 32 caracteres.');
    }
    return secret;
  }
  if (isProduction) {
    throw new Error('SESSION_SECRET não está definida. Configure a variável de ambiente em produção.');
  }
  return DEV_ONLY_SECRET;
}

// Validação feita na primeira requisição (e não no import) para não quebrar o `next build`.
let sessionOptions: SessionOptions | null = null;

function getSessionOptions(): SessionOptions {
  if (!sessionOptions) {
    sessionOptions = {
      password: getSessionPassword(),
      cookieName: 'macfor-indisp-session',
      cookieOptions: {
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: !!isProduction,
      },
    };
  }
  return sessionOptions;
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
