'use client';

import { Button } from 'primereact/button';
import { Clock } from 'lucide-react';
import { Card } from '../../../components/Card';
import { UnavailCalendar } from '../../../components/UnavailCalendar';
import { DEPT_COLORS, STATUS_MAP, isEditorRole, formatDate, formatDateShort } from '../../../lib/client-config';
import { useAuth, useSetores } from '../../../providers';

interface Props {
  all: any[];
  eventos?: any[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function OverviewContent({ all, eventos = [], onApprove, onReject }: Props) {
  const { user } = useAuth();
  const { setores } = useSetores();

  const approvedAll = all.filter((i) => i.status === 'approved' || i.status === 'pending');

  const deptStats: Record<string, { total: number; active: number; days: number }> = {};
  setores.forEach((d) => { deptStats[d] = { total: 0, active: 0, days: 0 }; });
  const today = new Date().toISOString().split('T')[0];
  all.filter((i) => i.status === 'approved').forEach((i) => {
    if (deptStats[i.department]) {
      deptStats[i.department].total++;
      deptStats[i.department].days += i.total_days || 0;
      if (i.start_date <= today && i.end_date >= today) deptStats[i.department].active++;
    }
  });
  const activeDepts = Object.entries(deptStats).filter(([, v]) => v.total > 0).sort((a, b) => b[1].active - a[1].active);

  const pending = all.filter((i) => i.status === 'pending').slice(0, 5);
  const upcoming = all
    .filter((i) => i.status === 'approved' && i.start_date > today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const recent = all.slice(0, 10);

  return (
    <div>
      {pending.length > 0 && (
        <Card className="mb-5 border-yellow-500/30">
          <h4 className="text-yellow-400 mb-3 font-semibold flex items-center gap-2">
            <Clock size={16} /> {pending.length} Solicitação(ões) Pendente(s)
          </h4>
          {pending.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0 gap-3">
              <div>
                <div className="text-sm font-medium">{item.user_name || item.full_name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {item.department} · {formatDate(item.start_date)} a {formatDate(item.end_date)} · {item.total_days} dias
                </div>
              </div>
              {isEditorRole(user!.role) && (
                <div className="flex gap-1.5">
                  <Button size="small" severity="success" outlined onClick={() => onApprove(item.id)} label="Confirmar" />
                  <Button size="small" severity="danger" outlined onClick={() => onReject(item.id)} label="Reavaliar" />
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <UnavailCalendar items={approvedAll} eventos={eventos} />

      {activeDepts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-4">Indisponibilidade por Departamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDepts.map(([dept, stats]) => {
              const color = DEPT_COLORS[dept] || 'var(--accent)';
              const pct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
              return (
                <Card key={dept} borderColor={color}>
                  <div className="font-semibold mb-2.5">{dept}</div>
                  <div className="flex gap-5 text-sm">
                    <div><span className="text-[var(--text-muted)]">Ativos: </span><strong style={{ color }} className="font-mono">{stats.active}</strong></div>
                    <div><span className="text-[var(--text-muted)]">Total: </span><strong className="font-mono">{stats.total}</strong></div>
                    <div><span className="text-[var(--text-muted)]">Dias: </span><strong className="font-mono">{stats.days}</strong></div>
                  </div>
                  <div className="h-1.5 bg-[var(--border)] rounded-full mt-3 overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-4">Próximas Indisponibilidades</h3>
          <div className="flex flex-col gap-2.5">
            {upcoming.slice(0, 8).map((item) => {
              const deptColor = DEPT_COLORS[item.department] || 'var(--accent)';
              const daysUntil = Math.ceil((new Date(item.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={item.id} borderColor={deptColor} className="!py-3.5">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="text-sm font-semibold">{item.user_name || item.full_name}</span>
                      <span className="text-xs text-[var(--text-muted)] ml-2">{item.department}</span>
                    </div>
                    <div className="flex gap-3 items-center text-sm">
                      <span>{formatDate(item.start_date)} → {formatDate(item.end_date)}</span>
                      <span className="font-mono font-semibold">{item.total_days}d</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25">
                        em {daysUntil} dia{daysUntil !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-4">Últimas Solicitações</h3>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Prestador</th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Departamento</th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Tipo</th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Período</th>
                    <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Dias</th>
                    <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => {
                    const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
                    return (
                      <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-4 py-2.5 font-medium">{item.user_name || item.full_name}</td>
                        <td className="px-4 py-2.5 text-[var(--text-muted)]">{item.department}</td>
                        <td className="px-4 py-2.5 text-[var(--text-muted)]">{item.unavailability_type === 'prolongado' ? 'Prolongado' : 'Pontual'}</td>
                        <td className="px-4 py-2.5">{formatDateShort(item.start_date)} → {formatDateShort(item.end_date)}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-semibold">{item.total_days}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.color} border ${st.border}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
