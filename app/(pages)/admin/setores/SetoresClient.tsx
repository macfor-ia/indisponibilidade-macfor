'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ChevronLeft, ChevronDown, ChevronRight, Layers, Search, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { withAuth } from '../../../components/withAuth';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { API } from '../../../lib/api-client';
import { isMasterAdminRole } from '../../../lib/client-config';
import { expandAreaSquadPairs, squadLabel } from '../../../lib/squads';
import { useToast } from '../../../providers';

interface Member {
  id: number;
  name: string;
  email?: string | null;
  area?: string | null;
  squad?: string | null;
  report_to_email?: string | null;
}

interface AppUserRow {
  email: string;
  department?: string | null;
  role: string;
}

/** É "reporta para" de pelo menos uma outra pessoa no cadastro de membros. */
function reportedToEmailSet(members: Member[]): Set<string> {
  const set = new Set<string>();
  for (const m of members) {
    (m.report_to_email || '').split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean).forEach((e) => set.add(e));
  }
  return set;
}

/** email -> squad ("Área - Cliente") de quem tem a role "lider" atribuída em Usuários. */
function leaderSquadByEmail(users: AppUserRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const u of users) {
    if (u.role === 'lider' && u.department) map.set(u.email.toLowerCase(), u.department);
  }
  return map;
}

interface Group {
  area: string;
  squad: string;
  members: Member[];
}

function SetoresPage() {
  const router = useRouter();
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [users, setUsers] = useState<AppUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [m, u] = await Promise.all([API.getMembers(), API.getUsers().catch(() => [])]);
        setMembers(m as Member[]);
        setUsers(u as AppUserRow[]);
      } catch (e: any) {
        toast.show(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const reportedTo = useMemo(() => reportedToEmailSet(members), [members]);
  const leaderSquads = useMemo(() => leaderSquadByEmail(users), [users]);

  /** Líder de um card = reporta pra ele alguém no cadastro, OU tem a role "lider" atribuída
   *  especificamente a este squad em Usuários. */
  function isLeaderOf(member: Member, groupKey: string) {
    const email = (member.email || '').toLowerCase();
    if (!email) return false;
    return reportedTo.has(email) || leaderSquads.get(email) === groupKey;
  }

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const m of members) {
      for (const { area, squad } of expandAreaSquadPairs(m.area, m.squad)) {
        const label = squadLabel(squad);
        const key = `${area} - ${label}`;
        if (!map.has(key)) map.set(key, { area, squad: label, members: [] });
        map.get(key)!.members.push(m);
      }
    }
    return [...map.values()].sort((a, b) => {
      const areaCmp = a.area.localeCompare(b.area, 'pt-BR', { sensitivity: 'base' });
      return areaCmp !== 0 ? areaCmp : a.squad.localeCompare(b.squad, 'pt-BR', { sensitivity: 'base' });
    });
  }, [members]);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({ ...g, members: g.members.filter((m) => m.name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)) }))
      .filter((g) => g.members.length > 0 || `${g.area} ${g.squad}`.toLowerCase().includes(q));
  }, [groups, search]);

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  if (loading) {
    return <div className="min-h-screen"><Navbar /><div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8"><Skeleton rows={4} /></div></div>;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8">
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Layers size={28} className="text-[var(--accent)]" /> Setores
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {groups.length} setores (área + cliente), gerados a partir do cadastro de membros
            </p>
          </div>
          <Button label="Voltar" icon={<ChevronLeft size={14} />} severity="secondary" outlined size="small" onClick={() => router.push('/unavailability')} />
        </div>

        <div className="relative mb-4 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por pessoa, área ou setor..." className="w-full !pl-9" />
        </div>

        <div className="space-y-3">
          {filteredGroups.map((g) => {
            const key = `${g.area} - ${g.squad}`;
            const isOpen = !collapsed.has(key);
            return (
              <Card key={key}>
                <button type="button" className="w-full flex items-center justify-between text-left" onClick={() => toggle(key)}>
                  <span className="font-semibold text-sm flex items-center gap-2">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {g.area} - {g.squad}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{g.members.length} pessoa(s)</span>
                </button>
                {isOpen && (
                  <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {g.members
                      .slice()
                      .sort((a, b) => {
                        const aLeader = isLeaderOf(a, key);
                        const bLeader = isLeaderOf(b, key);
                        if (aLeader !== bLeader) return aLeader ? -1 : 1;
                        return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
                      })
                      .map((m) => {
                        const isLeader = isLeaderOf(m, key);
                        return (
                          <div
                            key={m.id}
                            className={`text-xs p-2 rounded-lg border ${
                              isLeader
                                ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                                : 'bg-[var(--surface)] border-[var(--border)]'
                            }`}
                          >
                            <div className="font-medium flex items-center gap-1.5">
                              {isLeader && <Crown size={12} className="text-[var(--accent)] shrink-0" />}
                              {m.name}
                            </div>
                            <div className="text-[var(--text-muted)]">{m.email}</div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>
            );
          })}
          {filteredGroups.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhum resultado encontrado.</p>}
        </div>
      </div>
    </div>
  );
}

export const SetoresClient = withAuth(SetoresPage, isMasterAdminRole);
