'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ClipboardList, ChevronLeft, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { withAuth } from '../../../components/withAuth';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { API } from '../../../lib/api-client';
import { isMasterAdminRole } from '../../../lib/client-config';
import { useToast, useSetores } from '../../../providers';

interface Member {
  id: number;
  name: string;
  email?: string | null;
  area?: string | null;
  squad?: string | null;
  funcao?: string | null;
  report_to?: string | null;
  operacoes?: boolean;
  day_offs_quota?: number;
}

function AdminMembersPage() {
  const router = useRouter();
  const toast = useToast();
  const { setores } = useSetores();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      API.clearCache();
      const m = await API.getMembers();
      setMembers(m as Member[]);
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const allAreas = useMemo(() => [...new Set(members.map((m) => m.area).filter(Boolean) as string[])].sort(), [members]);

  const filtered = useMemo(() => {
    let f = filterArea ? members.filter((m) => (m.area || '') === filterArea) : members;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.area?.toLowerCase().includes(q) ||
        String(m.id).includes(q),
      );
    }
    return f;
  }, [members, search, filterArea]);

  function reportToNames(report_to?: string | null) {
    if (!report_to) return '-';
    const emailToName: Record<string, string> = {};
    members.forEach((m) => { if (m.email) emailToName[m.email.toLowerCase()] = m.name; });
    const names = report_to.split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean)
      .map((e) => emailToName[e] || e);
    return names.join(', ') || '-';
  }

  function openEdit(m: Member | null) {
    setEditing(m || { id: 0, name: '', email: '', area: '', squad: '', funcao: '', report_to: '', operacoes: false, day_offs_quota: 20 });
    setEditOpen(true);
  }

  function deleteMember(m: Member) {
    confirmDialog({
      message: `Remover "${m.name}" permanentemente? Isso pode afetar solicitações vinculadas.`,
      header: 'Confirmar remoção',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try { await API.deleteMember(m.id); toast.show('Membro removido.'); load(); }
        catch (e: any) { toast.show(e.message, 'error'); }
      },
    });
  }

  if (loading) {
    return <div className="min-h-screen"><Navbar /><div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8"><Skeleton rows={4} /></div></div>;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <ConfirmDialog />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8">
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardList size={28} className="text-[var(--accent)]" /> Gerenciar Membros
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Cadastro de prestadores ({filtered.length}/{members.length})</p>
          </div>
          <div className="flex gap-2">
            <Button label="Voltar" icon={<ChevronLeft size={14} />} severity="secondary" outlined size="small" onClick={() => router.push('/unavailability')} />
            <Button label="Novo Membro" icon={<Plus size={14} />} size="small" onClick={() => openEdit(null)} />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center mb-4">
          <span className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
            <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, email, área..." className="pl-9 w-72" />
          </span>
          <Dropdown
            value={filterArea}
            options={[{ label: 'Todas as equipes', value: '' }, ...allAreas.map((a) => ({ label: a, value: a }))]}
            onChange={(e) => setFilterArea(e.value)}
            placeholder="Todas as equipes"
            className="min-w-[200px]"
          />
          {filterArea && <Button label="Limpar filtro" size="small" severity="secondary" outlined onClick={() => setFilterArea('')} />}
        </div>

        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  <th className="px-3 py-2.5 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">ID</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Nome</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Email</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Equipe/Squad</th>
                  <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Reporta para</th>
                  <th className="px-3 py-2.5 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Dias</th>
                  <th className="px-3 py-2.5 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2 text-center text-[11px] text-[var(--text-muted)] font-mono">#{m.id}</td>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{m.name}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)] text-xs">{m.email || '-'}</td>
                    <td className="px-3 py-2 text-xs">
                      {m.area || '-'}
                      {m.squad && <div className="text-[11px] text-[var(--text-muted)]">{m.squad}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--text-muted)]">{reportToNames(m.report_to)}</td>
                    <td className="px-3 py-2 text-center text-xs">{m.day_offs_quota ?? '-'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <Button icon={<Pencil size={12} />} size="small" severity="secondary" outlined onClick={() => openEdit(m)} />
                        <Button icon={<Trash2 size={12} />} size="small" severity="danger" outlined onClick={() => deleteMember(m)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <MemberDialog visible={editOpen} onHide={() => setEditOpen(false)} member={editing} members={members} setores={setores} onSaved={load} />
      </div>
    </div>
  );
}

function MemberDialog({ visible, onHide, member, members, setores, onSaved }: { visible: boolean; onHide: () => void; member: Member | null; members: Member[]; setores: string[]; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<Member>({ id: 0, name: '', email: '', area: '', squad: '', funcao: '', report_to: '', operacoes: false, day_offs_quota: 20 });
  const [approverFilter, setApproverFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && member) {
      setForm({ ...member });
      setApproverFilter('');
    }
  }, [visible, member]);

  function toggleApprover(email: string) {
    const cur = (form.report_to || '').split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    const idx = cur.indexOf(email.toLowerCase());
    if (idx >= 0) cur.splice(idx, 1); else cur.push(email.toLowerCase());
    setForm({ ...form, report_to: cur.join(', ') });
  }

  const selectedApprovers = new Set((form.report_to || '').split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean));
  const eligibleApprovers = members
    .filter((m) => m.id !== form.id && m.email)
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((m) => {
      if (!approverFilter) return true;
      const q = approverFilter.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || (m.funcao || '').toLowerCase().includes(q);
    });

  async function save() {
    if (!form.name || !form.area || !form.funcao) {
      toast.show('Nome, área e função são obrigatórios.', 'error');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        email: form.email || null,
        area: form.area,
        funcao: form.funcao,
        squad: form.squad || null,
        report_to: form.report_to || null,
        day_offs_quota: form.day_offs_quota,
        operacoes: !!form.operacoes,
      };
      if (form.id && form.id > 0) {
        await API.updateMember(form.id, data);
        toast.show('Membro atualizado!');
      } else {
        await API.createMember(data);
        toast.show('Membro criado!');
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
    <Dialog header={form.id ? `Editar Membro #${form.id}` : 'Novo Membro'} visible={visible} onHide={onHide} style={{ width: 560 }} modal>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Nome *</label>
            <InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Email</label>
            <InputText value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Equipe/Área *</label>
            <Dropdown value={form.area} options={setores.map((s) => ({ label: s, value: s }))} onChange={(e) => setForm({ ...form, area: e.value })} editable className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Squad</label>
            <InputText value={form.squad || ''} onChange={(e) => setForm({ ...form, squad: e.target.value })} className="w-full" />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Função *</label>
          <InputText value={form.funcao || ''} onChange={(e) => setForm({ ...form, funcao: e.target.value })} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Quota de dias</label>
          <InputNumber value={form.day_offs_quota || 20} onValueChange={(e) => setForm({ ...form, day_offs_quota: e.value || 20 })} min={0} className="w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox inputId="mf_operacoes" checked={!!form.operacoes} onChange={(e) => setForm({ ...form, operacoes: e.checked || false })} />
          <label htmlFor="mf_operacoes" className="text-sm cursor-pointer">Operações</label>
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Reporta para (verificação das solicitações)</label>
          <InputText value={approverFilter} onChange={(e) => setApproverFilter(e.target.value)} placeholder="Buscar responsável..." className="w-full mb-2" />
          <div className="max-h-52 overflow-y-auto border border-[var(--border)] rounded">
            {eligibleApprovers.map((m) => (
              <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--surface)] cursor-pointer">
                <Checkbox checked={selectedApprovers.has((m.email || '').toLowerCase())} onChange={() => toggleApprover(m.email || '')} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs">{m.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{m.email}</div>
                </div>
                {m.funcao && <span className="text-[10px] text-[var(--text-muted)]">{m.funcao}</span>}
              </label>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Selecione um ou mais responsáveis</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" outlined onClick={onHide} />
          <Button label="Salvar" onClick={save} loading={saving} />
        </div>
      </div>
    </Dialog>
  );
}

export default withAuth(AdminMembersPage, isMasterAdminRole);
