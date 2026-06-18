'use client';

import { Card } from '../../../components/Card';
import { DEPT_COLORS } from '../../../lib/client-config';

export interface Kpis {
  total: number;
  active: number;
  pending: number;
  upcoming: number;
  totalDays: number;
  topDept?: [string, number];
}

export function KpiStrip({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 animate-fade-up">
      <Card className="text-center">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Ativos Agora</div>
        <div className="text-3xl font-bold text-emerald-400 font-mono">{kpis.active}</div>
      </Card>
      <Card className="text-center">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Pendentes</div>
        <div className="text-3xl font-bold text-yellow-400 font-mono">{kpis.pending}</div>
      </Card>
      <Card className="text-center">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Próximas</div>
        <div className="text-3xl font-bold text-[var(--accent)] font-mono">{kpis.upcoming}</div>
      </Card>
      <Card className="text-center">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Registros</div>
        <div className="text-3xl font-bold font-mono">{kpis.total}</div>
      </Card>
      <Card className="text-center">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Dias Confirmados</div>
        <div className="text-3xl font-bold text-orange-400 font-mono">{kpis.totalDays}</div>
      </Card>
      {kpis.topDept && (
        <Card className="text-center">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Dept + Ausente</div>
          <div className="text-sm font-bold" style={{ color: DEPT_COLORS[kpis.topDept[0]] || 'var(--foreground)' }}>
            {kpis.topDept[0]}
          </div>
          <div className="text-xs text-[var(--text-muted)]">{kpis.topDept[1]} pessoa(s)</div>
        </Card>
      )}
    </div>
  );
}
