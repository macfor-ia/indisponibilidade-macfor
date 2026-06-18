import { NextResponse } from 'next/server';
import { requireAuth } from '../../lib/auth';
import { EventoModel } from '../models';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;
  void user;

  const eventos = await EventoModel.list();
  return NextResponse.json({ eventos });
}
