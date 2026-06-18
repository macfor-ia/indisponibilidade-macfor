import { cookies } from 'next/headers';
import { getIronSession, SessionOptions } from 'iron-session';

export interface SessionData {
  userId?: number;
}

const isProduction = process.env.NODE_ENV === 'production' ||
  !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RENDER || !!process.env.FLY_APP_NAME;

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'macfor-indisponibilidade-secret-2024-mais-32-bytes-aaa',
  cookieName: 'macfor-indisp-session',
  cookieOptions: {
    maxAge: 7 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: !!isProduction,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
