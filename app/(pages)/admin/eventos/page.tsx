'use client';

import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { ChevronLeft, Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { withAuth } from '../../../components/withAuth';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { API } from '../../../lib/api-client';
import { isAdminRole, formatDate } from '../../../lib/client-config';
import { useToast } from '../../../providers';

interface Evento { id: number; nome: string; descricao: string | null; data_inicio: string; data_fim: string; clientes?: { id: number; nome: string }[]; }

function EventosPage() {
  const router = useRouter();
  const toast = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setEventos((await API.getEventos() as any) || []); } catch { setEventos([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function del(e: Evento) {
    if (!confirm(`Remover evento "${e.nome}"?`)) return;
    try { await API.deleteEvento(e.id); toast.show('Evento removido.'); await load(); }
    catch (err: any) { toast.show(err.message, 'error'); }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8">
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays size={28} className="text-[var(--accent)]" /> Eventos</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">{eventos.length} eventos</p>
          </div>
          <div className="flex gap-2">
            <Button label="Voltar" icon={<ChevronLeft size={14} />} severity="secondary" outlined size="small" onClick={() => router.push('/unavailability')} />
          </div>
        </div>
        {loading ? <Skeleton rows={4} /> : (
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Nome</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Período</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Clientes</th>
                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Ações</th>
              </tr></thead>
              <tbody>{eventos.map(ev => (
                <tr key={ev.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-medium">{ev.nome}</td>
                  <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{formatDate(ev.data_inicio)} — {formatDate(ev.data_fim)}</td>
                  <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{ev.clientes?.map(c => c.nome).join(', ') || '-'}</td>
                  <td className="px-4 py-2 text-center"><div className="flex gap-1.5 justify-center">
                    <Button icon={<Trash2 size={12} />} size="small" severity="danger" outlined onClick={() => del(ev)} />
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

export default withAuth(EventosPage, isAdminRole);
