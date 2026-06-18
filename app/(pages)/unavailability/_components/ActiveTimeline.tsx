'use client';

import { Calendar } from 'lucide-react';
import { Card } from '../../../components/Card';
import { DEPT_COLORS, formatDateShort } from '../../../lib/client-config';

interface Item {
  id: number;
  user_name?: string;
  full_name?: string;
  department: string;
  start_date: string;
  end_date: string;
}

export function ActiveTimeline({ items }: { items: Item[] }) {
  if (!items.length) return null;

  return (
    <Card className="mb-6">
      <h3 className="text-sm text-[var(--text-muted)] mb-4 flex items-center gap-2">
        <Calendar size={14} /> Indisponíveis Agora
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => {
          const deptColor = DEPT_COLORS[item.department] || 'var(--accent)';
          const daysLeft = Math.ceil((new Date(item.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + 1;
          return (
            <div
              key={item.id}
              className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
              style={{ borderLeftWidth: 3, borderLeftColor: deptColor }}
            >
              <div className="text-sm font-semibold">{item.user_name || item.full_name}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{item.department}</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {formatDateShort(item.start_date)} → {formatDateShort(item.end_date)}
                <span className="ml-1.5 font-semibold" style={{ color: deptColor }}>{daysLeft}d restantes</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
