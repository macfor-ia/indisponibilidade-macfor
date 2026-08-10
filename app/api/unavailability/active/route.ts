import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, isAdmin, isLider } from '../../../lib/auth';
import { filterUnavailabilityForLider } from '../../../lib/unavailability-helpers';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  if (!isAdmin(user!.role) && !isLider(user!.role) && user!.role !== 'socio') {
    return NextResponse.json({ error: 'Acesso restrito a líderes e administradores.' }, { status: 403 });
  }

  const all = await queries.getActiveUnavailability();

  if (isAdmin(user!.role) || user!.role === 'socio') {
    return NextResponse.json(all);
  }
  return NextResponse.json(await filterUnavailabilityForLider(all, user!));
}
