import { NextResponse } from 'next/server';
import { queries } from '../../../lib/database';
import { requireAuth, requireAdmin } from '../../../lib/auth';

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;
  const aErr = requireAdmin(user!);
  if (aErr) return aErr;

  try {
    const activeUnavail = await queries.getActiveUnavailability();
    if (!activeUnavail.length) {
      return NextResponse.json({ users_on_leave: [], department_impact: [] });
    }

    const usersOnLeave = activeUnavail.map((u: any) => ({
      user_id: u.user_id,
      user_name: u.user_name || u.full_name,
      department: u.department,
      start_date: u.start_date,
      end_date: u.end_date,
      total_days: u.total_days,
    }));

    const deptImpact: Record<string, { on_leave: number; on_leave_names: string[] }> = {};
    activeUnavail.forEach((u: any) => {
      if (!deptImpact[u.department]) deptImpact[u.department] = { on_leave: 0, on_leave_names: [] };
      deptImpact[u.department].on_leave++;
      deptImpact[u.department].on_leave_names.push(u.user_name || u.full_name);
    });

    const departmentImpact = Object.entries(deptImpact).map(([dept, data]) => ({
      department: dept,
      on_leave: data.on_leave,
      on_leave_names: data.on_leave_names,
    })).sort((a, b) => b.on_leave - a.on_leave);

    return NextResponse.json({ users_on_leave: usersOnLeave, department_impact: departmentImpact });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
