'use client';

import { Users, CircleCheck, CircleDot } from 'lucide-react';
import { Card } from '../../../components/Card';

interface TeamMember {
  id: number;
  name: string;
  email?: string | null;
  area?: string | null;
  squad?: string | null;
  unavailable_now: boolean;
  remaining_days: number;
}

function quotaColor(remaining: number) {
  if (remaining <= 0) return 'text-red-400';
  if (remaining <= 5) return 'text-orange-400';
  return 'text-emerald-400';
}

interface Props {
  team: TeamMember[];
}

export function TeamContent({ team }: Props) {
  if (!team.length) {
    return (
      <Card className="text-center text-[var(--text-muted)] py-10">
        Ninguém reporta pra você no cadastro de membros ainda.
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Users size={16} className="text-[var(--accent)]" /> Minha Equipe
        </h3>
        <p className="text-xs text-[var(--text-muted)]">{team.length} pessoa(s) reportam pra você</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {team.map((m) => (
          <Card key={m.id} borderColor={m.unavailable_now ? 'var(--red)' : 'var(--green)'}>
            <div className="font-semibold text-sm mb-1">{m.name}</div>
            <div className="text-xs text-[var(--text-muted)] mb-2.5">{m.email}</div>
            <div className="text-xs text-[var(--text-muted)] mb-3">
              {[m.area, m.squad].filter(Boolean).join(' · ') || 'Sem área/squad cadastrado'}
            </div>
            <div className="flex items-center justify-between gap-2">
              {m.unavailable_now ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  <CircleDot size={10} /> Indisponível agora
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CircleCheck size={10} /> Disponível
                </span>
              )}
              <span className={`text-xs font-mono font-semibold ${quotaColor(m.remaining_days)}`}>
                {m.remaining_days} <span className="text-[var(--text-muted)] font-sans font-normal">dias</span>
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
