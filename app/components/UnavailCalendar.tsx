'use client';

import { useState, useMemo } from 'react';
import { Button } from 'primereact/button';
import { ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, CalendarRange, User2 } from 'lucide-react';
import { Card } from './Card';

interface Item {
  start_date: string;
  end_date: string;
  status: string;
  user_name?: string;
  full_name?: string;
  department: string;
}

interface Evento {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  clientes?: { id: number; nome: string }[];
}

interface DayPerson { name: string; status: string; department: string }
interface DayEvento { id: number; nome: string; clientes: string[] }

function buildDateMap(items: Item[]) {
  const map: Record<string, DayPerson[]> = {};
  items.forEach((item) => {
    const start = new Date(item.start_date + 'T00:00:00');
    const end = new Date(item.end_date + 'T00:00:00');
    const name = item.user_name || item.full_name || '';
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push({ name, status: item.status, department: item.department });
    }
  });
  return map;
}

function buildEventoMap(eventos: Evento[]) {
  const map: Record<string, DayEvento[]> = {};
  eventos.forEach((ev) => {
    const start = new Date(ev.data_inicio + 'T00:00:00');
    const end = new Date(ev.data_fim + 'T00:00:00');
    const clientes = (ev.clientes || []).map((c) => c.nome);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push({ id: ev.id, nome: ev.nome, clientes });
    }
  });
  return map;
}

interface Props {
  items: Item[];
  eventos?: Evento[];
}

export function UnavailCalendar({ items, eventos = [] }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const dateMap = useMemo(() => buildDateMap(items), [items]);
  const eventoMap = useMemo(() => buildEventoMap(eventos), [eventos]);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const today = new Date().toISOString().split('T')[0];

  function nav(dir: number) {
    let nm = month + dir;
    let ny = year;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setMonth(nm);
    setYear(ny);
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <CalendarDays size={18} className="text-[var(--accent)]" />
          Calendário de Indisponibilidade
        </h3>
        <div className="flex gap-2 items-center justify-between sm:justify-end">
          <Button icon={<ChevronLeft size={14} />} onClick={() => nav(-1)} size="small" severity="secondary" outlined />
          <span className="text-sm font-semibold min-w-[120px] sm:min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button icon={<ChevronRight size={14} />} onClick={() => nav(1)} size="small" severity="secondary" outlined />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((dn) => (
          <div key={dn} className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] py-2">
            {dn}
          </div>
        ))}
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: totalDays }).map((_, idx) => {
          const d = idx + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const people = dateMap[dateStr] || [];
          const dayEventos = eventoMap[dateStr] || [];
          const isToday = dateStr === today;
          const hasApproved = people.some((p) => p.status === 'approved');
          const hasPending = people.some((p) => p.status === 'pending');
          const hasEvento = dayEventos.length > 0;
          const isConflict = hasEvento && (hasApproved || hasPending);

          let cls = 'relative flex flex-col items-center justify-start min-h-[58px] rounded-md border-2 transition-all text-center p-1.5 ';
          if (isConflict) cls += 'bg-red-500/15 border-red-500 ring-1 ring-red-500/50 ';
          else if (isToday) cls += 'bg-[var(--accent)]/10 border-[var(--accent)]/40 ';
          else if (hasApproved) cls += 'bg-red-500/12 border-red-500/25 ';
          else if (hasPending) cls += 'bg-yellow-500/10 border-yellow-500/20 ';
          else if (hasEvento) cls += 'bg-blue-500/10 border-blue-500/30 ';
          else cls += 'bg-[var(--surface)] border-transparent ';

          const tooltipParts: string[] = [];
          if (isConflict) tooltipParts.push('CONFLITO: indisponibilidade em dia de evento', '');
          if (dayEventos.length) {
            tooltipParts.push('EVENTO(S):');
            dayEventos.forEach((ev) => {
              tooltipParts.push(`  - ${ev.nome}${ev.clientes.length ? ` [${ev.clientes.join(', ')}]` : ''}`);
            });
          }
          if (people.length) {
            if (tooltipParts.length) tooltipParts.push('');
            tooltipParts.push('INDISPONIBILIDADE(S):');
            people.forEach((p) => {
              tooltipParts.push(`  [${p.status === 'approved' ? 'confirmado' : 'pendente'}] ${p.name} (${p.department})`);
            });
          }
          const tooltip = tooltipParts.join('\n');

          return (
            <div key={d} className={cls} title={tooltip || undefined}>
              {isConflict && (
                <AlertTriangle size={10} className="absolute top-0.5 right-0.5 text-red-500" />
              )}
              <span className={`text-sm font-mono ${
                isConflict ? 'text-red-500 font-bold' :
                isToday ? 'text-[var(--accent)] font-bold' :
                hasApproved ? 'text-red-400 font-semibold' :
                hasPending ? 'text-yellow-400 font-semibold' :
                hasEvento ? 'text-blue-400 font-semibold' : ''
              }`}>
                {d}
              </span>
              <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                {hasEvento && (
                  <span className="text-[8px] font-bold px-1 rounded bg-blue-500/20 text-blue-400 flex items-center gap-0.5">
                    <CalendarRange size={7} /> {dayEventos.length}
                  </span>
                )}
                {people.length > 0 && (
                  <span className={`text-[8px] font-bold px-1 rounded ${hasApproved ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                    <User2 size={7} /> {people.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 text-[11px] text-[var(--text-muted)] flex-wrap items-center">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-500/12 border border-red-500/25" /> Indisponível</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-yellow-500/10 border border-yellow-500/20" /> Pendente</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-500/10 border border-blue-500/30" /> Evento</span>
        <span className="flex items-center gap-1 text-red-400 font-semibold"><AlertTriangle size={11} /> Conflito (evento × indisponibilidade)</span>
        <span className="opacity-70">Passe o mouse sobre um dia marcado para ver detalhes</span>
      </div>
    </Card>
  );
}
