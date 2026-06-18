'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Download, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/Card';
import { UnavailList } from '../../../components/UnavailList';
import { useAuth } from '../../../providers';

interface Props {
  all: any[];
  truncated?: boolean;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
}

const STATUS_FILTERS = [
  { v: '', label: 'Todos' },
  { v: 'pending', label: 'Pendente' },
  { v: 'approved', label: 'Confirmado' },
  { v: 'rejected', label: 'Em reavaliação' },
];

export function AllHistoryContent({ all, truncated, onEdit, onDelete }: Props) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const depts = [...new Set(all.map((i) => i.department).filter(Boolean))].sort();
  let filtered = all;
  if (statusFilter) filtered = filtered.filter((i) => i.status === statusFilter);
  if (deptFilter) filtered = filtered.filter((i) => i.department === deptFilter);

  function exportCSV() {
    const headers = ['ID', 'Prestador', 'Email', 'Setor', 'Tipo', 'Início', 'Fim', 'Dias Úteis', 'Status', 'Criado em'];
    const rows = filtered.map((i) => [
      i.id, i.user_name || '', i.user_email || '', i.department || '', i.unavailability_type || '',
      i.start_date || '', i.end_date || '', i.total_days || '', i.status || '', (i.created_at || '').slice(0, 10),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indisponibilidades.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {truncated && (
        <Card className="mb-3 border-yellow-500/30 text-yellow-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          Exibindo os 500 registros mais recentes. Use filtros ou exporte o CSV para acesso completo.
        </Card>
      )}
      <div className="flex gap-3 flex-wrap items-center mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s.v}
              label={s.label}
              size="small"
              severity="secondary"
              outlined={statusFilter !== s.v}
              onClick={() => setStatusFilter(s.v)}
            />
          ))}
        </div>
        <Dropdown
          value={deptFilter}
          options={[{ label: 'Todos os setores', value: '' }, ...depts.map((d) => ({ label: d, value: d }))]}
          onChange={(e) => setDeptFilter(e.value)}
          placeholder="Todos os setores"
          className="min-w-[200px]"
        />
        <Button label="Exportar CSV" icon={<Download size={14} />} iconPos="left" size="small" severity="secondary" outlined onClick={exportCSV} className='ml-auto' />
      </div>
      {!filtered.length ? (
        <Card className="text-center text-[var(--text-muted)] py-8">Nenhum resultado.</Card>
      ) : (
        <UnavailList items={filtered} showUser currentUser={user!} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
}
