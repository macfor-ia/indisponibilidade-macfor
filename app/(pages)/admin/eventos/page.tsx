'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { ChevronLeft, Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { withAuth } from '../../../components/withAuth';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { API } from '../../../lib/api-client';
import { isAdminRole, formatDate } from '../../../lib/client-config';
import { useToast } from '../../../providers';

interface Cliente { id: number; nome: string; descricao: string | null; ativo: boolean; }
interface Evento { id: number; nome: string; descricao: string | null; data_inicio: string; data_fim: string; cliente_ids?: number[]; clientes?: { id: number; nome: string }[]; }

function EventosPage() {
  const router = useRouter();
  const toast = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [eventosRes, clientesRes]: any = await Promise.all([API.getEventos(), API.getClientes()]);
      setEventos(eventosRes?.eventos || []);
      setClientes(clientesRes?.clientes || []);
    } catch {
      setEventos([]);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function del(e: Evento) {
    if (!confirm(`Remover evento "${e.nome}"?`)) return;
    try { await API.deleteEvento(e.id); toast.show('Evento removido.'); await load(); }
    catch (err: any) { toast.show(err.message, 'error'); }
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(e: Evento) {
    setEditing(e);
    setDialogOpen(true);
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
            <Button label="Novo Evento" icon={<Plus size={14} />} size="small" onClick={openNew} />
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
                    <Button icon={<Pencil size={12} />} size="small" severity="secondary" outlined onClick={() => openEdit(ev)} />
                    <Button icon={<Trash2 size={12} />} size="small" severity="danger" outlined onClick={() => del(ev)} />
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            {!eventos.length && (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Nenhum evento cadastrado.</div>
            )}
          </Card>
        )}

        <EventoDialog visible={dialogOpen} onHide={() => setDialogOpen(false)} evento={editing} clientes={clientes} onSaved={load} />
      </div>
    </div>
  );
}

function EventoDialog({ visible, onHide, evento, clientes, onSaved }: { visible: boolean; onHide: () => void; evento: Evento | null; clientes: Cliente[]; onSaved: () => void }) {
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [clienteIds, setClienteIds] = useState<number[]>([]);
  const [clienteFilter, setClienteFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (evento) {
      setNome(evento.nome);
      setDescricao(evento.descricao || '');
      setDataInicio(evento.data_inicio ? new Date(evento.data_inicio + 'T00:00:00') : null);
      setDataFim(evento.data_fim ? new Date(evento.data_fim + 'T00:00:00') : null);
      setClienteIds(evento.cliente_ids || evento.clientes?.map(c => c.id) || []);
    } else {
      setNome('');
      setDescricao('');
      setDataInicio(null);
      setDataFim(null);
      setClienteIds([]);
    }
    setClienteFilter('');
  }, [visible, evento]);

  function toIsoDate(d: Date | null): string {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function toggleCliente(id: number) {
    setClienteIds((cur) => cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]);
  }

  const filteredClientes = useMemo(() => {
    const q = clienteFilter.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => c.nome.toLowerCase().includes(q));
  }, [clientes, clienteFilter]);

  async function save() {
    if (!nome.trim()) { toast.show('Nome do evento é obrigatório.', 'error'); return; }
    if (!dataInicio || !dataFim) { toast.show('Datas de início e fim são obrigatórias.', 'error'); return; }
    if (toIsoDate(dataFim) < toIsoDate(dataInicio)) { toast.show('Data de fim deve ser posterior ou igual à data de início.', 'error'); return; }
    if (!clienteIds.length) { toast.show('Selecione ao menos um cliente.', 'error'); return; }

    setSaving(true);
    try {
      const data = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        data_inicio: toIsoDate(dataInicio),
        data_fim: toIsoDate(dataFim),
        cliente_ids: clienteIds,
      };
      if (evento) {
        await API.updateEvento(evento.id, data);
        toast.show('Evento atualizado!');
      } else {
        await API.createEvento(data);
        toast.show('Evento criado!');
      }
      onHide();
      onSaved();
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog header={evento ? `Editar Evento #${evento.id}` : 'Novo Evento'} visible={visible} onHide={onHide} style={{ width: 560 }} modal>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Nome *</label>
          <InputText value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Descrição</label>
          <InputTextarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Data de início *</label>
            <PrimeCalendar value={dataInicio} onChange={(e) => setDataInicio(e.value as Date)} dateFormat="dd/mm/yy" showIcon className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Data de fim *</label>
            <PrimeCalendar value={dataFim} onChange={(e) => setDataFim(e.value as Date)} minDate={dataInicio || undefined} dateFormat="dd/mm/yy" showIcon className="w-full" />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Clientes vinculados *</label>
          <InputText value={clienteFilter} onChange={(e) => setClienteFilter(e.target.value)} placeholder="Buscar cliente..." className="w-full mb-2" />
          <div className="max-h-52 overflow-y-auto border border-[var(--border)] rounded">
            {filteredClientes.map((c) => (
              <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--surface)] cursor-pointer">
                <Checkbox checked={clienteIds.includes(c.id)} onChange={() => toggleCliente(c.id)} />
                <div className="flex-1 min-w-0 text-xs">{c.nome}{!c.ativo && <span className="text-[10px] text-[var(--text-muted)]"> (inativo)</span>}</div>
              </label>
            ))}
            {!filteredClientes.length && (
              <div className="px-2 py-3 text-xs text-[var(--text-muted)] text-center">Nenhum cliente encontrado.</div>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Selecione um ou mais clientes — a indisponibilidade de prestadores vinculados a eles vai ser cruzada com este evento.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" outlined onClick={onHide} />
          <Button label="Salvar" onClick={save} loading={saving} />
        </div>
      </div>
    </Dialog>
  );
}

export default withAuth(EventosPage, isAdminRole);
