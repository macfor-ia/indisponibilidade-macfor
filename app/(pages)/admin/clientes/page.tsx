'use client';

import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ChevronLeft, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { withAuth } from '../../../components/withAuth';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { API } from '../../../lib/api-client';
import { isAdminRole } from '../../../lib/client-config';
import { useToast } from '../../../providers';

interface Cliente { id: number; nome: string; descricao: string | null; ativo: boolean; }

function ClientesPage() {
  const router = useRouter();
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setClientes((await API.getClientes() as any) || []); } catch { setClientes([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

  function openEdit(c: Cliente | null) {
    setEditing(c);
    setForm({ nome: c?.nome || '', descricao: c?.descricao || '' });
    setEditOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editing?.id) { await API.updateCliente(editing.id, form); toast.show('Cliente atualizado!'); }
      else { await API.createCliente({ ...form, ativo: true }); toast.show('Cliente criado!'); }
      setEditOpen(false);
      await load();
    } catch (e: any) { toast.show(e.message, 'error'); } finally { setSaving(false); }
  }

  async function del(c: Cliente) {
    if (!confirm(`Remover "${c.nome}"?`)) return;
    try { await API.deleteCliente(c.id); toast.show('Cliente removido.'); await load(); }
    catch (e: any) { toast.show(e.message, 'error'); }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8">
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 size={28} className="text-[var(--accent)]" /> Clientes</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">{filtered.length}/{clientes.length} clientes</p>
          </div>
          <div className="flex gap-2">
            <Button label="Voltar" icon={<ChevronLeft size={14} />} severity="secondary" outlined size="small" onClick={() => router.push('/unavailability')} />
            <Button label="Novo Cliente" icon={<Plus size={14} />} size="small" onClick={() => openEdit(null)} />
          </div>
        </div>
        <InputText value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="mb-4 w-72" />
        {loading ? <Skeleton rows={4} /> : (
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Nome</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Descrição</th>
                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Ações</th>
              </tr></thead>
              <tbody>{filtered.map(c => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-medium">{c.nome}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{c.descricao || '-'}</td>
                  <td className="px-4 py-2 text-center"><div className="flex gap-1.5 justify-center">
                    <Button icon={<Pencil size={12} />} size="small" severity="secondary" outlined onClick={() => openEdit(c)} />
                    <Button icon={<Trash2 size={12} />} size="small" severity="danger" outlined onClick={() => del(c)} />
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
        {editOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md space-y-4">
              <h2 className="font-semibold text-lg">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <div><label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Nome *</label>
                <InputText value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full" autoFocus /></div>
              <div><label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Descrição</label>
                <InputText value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="w-full" /></div>
              <div className="flex justify-end gap-2">
                <Button label="Cancelar" severity="secondary" outlined onClick={() => setEditOpen(false)} />
                <Button label="Salvar" onClick={save} loading={saving} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(ClientesPage, isAdminRole);
