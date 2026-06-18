'use client';

import { useEffect, useState } from 'react';
import { API } from '../../../lib/api-client';
import type { Kpis } from './KpiStrip';

export function useKpis(enabled: boolean, reloadKey: number) {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [active, setActive] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled) return;
    Promise.all([
      API.getUnavailability(),
      API.getPendingUnavailability(),
      API.getActiveUnavailability(),
    ]).then(([all, pending, act]: any[]) => {
      const approved = all.data.filter((i: any) => i.status === 'approved');
      const totalDays = approved.reduce((s: number, i: any) => s + (i.total_days || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const upcoming = approved.filter((i: any) => i.start_date > today);
      const deptCount: Record<string, number> = {};
      act.forEach((i: any) => { deptCount[i.department] = (deptCount[i.department] || 0) + 1; });
      const topDept = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0];
      setKpis({
        total: all.data.length,
        active: act.length,
        pending: pending.length,
        upcoming: upcoming.length,
        totalDays,
        topDept: topDept as [string, number] | undefined,
      });
      setActive(act);
    }).catch(() => {});
  }, [enabled, reloadKey]);

  return { kpis, active };
}
