import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, requireAdminOnly } from '../../../lib/auth';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdminOnly(user!);
  if (aErr) return aErr;
  const pending = await queries.getPendingUsers('pending');
  return NextResponse.json(pending);
}
