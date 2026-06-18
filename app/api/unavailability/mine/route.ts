import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;
  return NextResponse.json(await queries.getUserUnavailability(user!.id));
}
