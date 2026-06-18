import { NextResponse } from 'next/server';
import { queries } from '../../lib/database';
import { requireAuth, canViewAll, isAdminEditor } from '../../lib/auth';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  const role = user!.role;
  if (canViewAll(role)) {
    const pendingUsers = await queries.getPendingUsers('pending');
    const pendingUnavailability = await queries.getPendingUnavailability();
    const activeUnavailability = await queries.getActiveUnavailability();
    return NextResponse.json({
      role,
      pending_users: pendingUsers,
      pending_unavailability: pendingUnavailability,
      active_unavailability: activeUnavailability,
      is_editor: isAdminEditor(role),
    });
  } else {
    const myUnavailability = await queries.getUserUnavailability(user!.id);
    return NextResponse.json({
      role,
      my_unavailability: myUnavailability,
    });
  }
}
