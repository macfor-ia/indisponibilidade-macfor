'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Users, UserPlus, ChevronLeft, Trash2, Building2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { withAuth } from '../../../components/withAuth';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { API } from '../../../lib/api-client';
import { ROLE_LABELS, isAdminRole, isMasterAdminRole, isEditorRole } from '../../../lib/client-config';
import { useAuth, useToast, useSetores } from '../../../providers';

function AdminUsersPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { setores } = useSetores();
  const [users, setUsers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<number | null>(null);

  const isMaster = isMasterAdminRole(user!.role);
  const canEdit = isEditorRole(user!.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      API.clearCache();
      const [u, p] = await Promise.all([API.getUsers(), API.getPending()]);
      setUsers(u as any[]);
      setPending(p as any[]);
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: number) {
    try { await API.approveUser(id); toast.show('Usuário liberado!'); load(); } catch (e: any) { toast.show(e.message, 'error'); }
  }
  async function reject(id: number) {
    try { await API.rejectUser(id); toast.show('Usuário recusado.'); load(); } catch (e: any) { toast.show(e.message, 'error'); }
  }
  async function changeRole(id: number, role: string) {
    confirmDialog({
      message: `Alterar role para "${ROLE_LABELS[role]}"? Esta ação é imediata.`,
      header: 'Confirmar',
      accept: async () => {
        try { await API.changeUserRole(id, role); toast.show('Role atualizado!'); load(); }
        catch (e: any) { toast.show(e.message, 'error'); load(); }
      },
      reject: () => load(),
    });
  }
  function deleteUser(id: number) {
    confirmDialog({
      message: 'Remover este usuário permanentemente?',
      header: 'Confirmar remoção',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try { await API.deleteUser(id); toast.show('Usuário removido.'); load(); }
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
              <Users size={28} className="text-[var(--accent)]" /> Gerenciar Usuários
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Verificação e gerenciamento de contas</p>
          </div>
          <div className="flex gap-2">
            {isMaster && (
              <Button label="Criar Usuário" icon={<UserPlus size={14} />} onClick={() => setCreateOpen(true)} size="small" />
            )}
            <Button label="Voltar" icon={<ChevronLeft size={14} />} severity="secondary" outlined size="small" onClick={() => router.push('/unavailability')} />
          </div>
        </div>

        {pending.length > 0 && (
          <Card className="mb-5 border-yellow-500/30">
            <h4 className="text-yellow-400 mb-3 font-semibold flex items-center gap-2">
              <Clock size={16} /> {pending.length} Aguardando Verificação
            </h4>
            {pending.map((u) => (
              <div key={u.id} className="flex justify-between items-center py-2.5 border-b border-[var(--border)] last:border-0">
                <div>
                  <div className="text-sm font-medium">{u.full_name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{u.email} · {u.role}</div>
                </div>
                {canEdit ? (
                  <div className="flex gap-1.5">
                    <Button label="Liberar" size="small" severity="success" onClick={() => approve(u.id)} />
                    <Button label="Recusar" size="small" severity="danger" outlined onClick={() => reject(u.id)} />
                  </div>
                ) : <span className="text-xs text-[var(--text-muted)]">Somente leitura</span>}
              </div>
            ))}
          </Card>
        )}

        <Card>
          <h4 className="mb-3 font-semibold">Todos os Usuários ({users.length})</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Nome</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Email</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Setor</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Role</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const statusCls: Record<string, string> = {
                    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
                  };
                  const isLider = u.role === 'lider';
                  return (
                    <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2.5 font-medium">
                        {u.full_name}
                        {isLider && <span className="ml-1.5 text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded">LÍDER</span>}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs">{u.email}</td>
                      <td className="px-4 py-2.5 text-xs">{u.department || '-'}</td>
                      <td className="px-4 py-2.5 text-center">
                        {u.role === 'admin_master' ? (
                          <span className="text-[11px] bg-purple-500 text-white px-2 py-0.5 rounded">Admin Master</span>
                        ) : (
                          <Dropdown
                            value={u.role}
                            options={['admin_editor', 'admin_leitor', 'lider', 'socio', 'colaborador'].map((r) => ({ label: ROLE_LABELS[r] || r, value: r }))}
                            onChange={(e) => changeRole(u.id, e.value)}
                            disabled={u.id === user!.id}
                            className="text-xs"
                          />
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCls[u.status] || ''}`}>{u.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex gap-1 justify-center">
                          {isMaster && u.role !== 'admin_master' && (
                            <Button icon={<Building2 size={12} />} size="small" severity="secondary" outlined label="Setor" onClick={() => { setAssignUserId(u.id); setAssignOpen(true); }} />
                          )}
                          {u.id !== user!.id && (
                            <Button icon={<Trash2 size={12} />} size="small" severity="danger" outlined label="Remover" onClick={() => deleteUser(u.id)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <CreateUserDialog visible={createOpen} onHide={() => setCreateOpen(false)} onSaved={load} setores={setores} />
        <AssignSetorDialog visible={assignOpen} onHide={() => setAssignOpen(false)} userId={assignUserId} users={users} setores={setores} onSaved={load} />
      </div>
    </div>
  );
}

function CreateUserDialog({ visible, onHide, onSaved, setores }: { visible: boolean; onHide: () => void; onSaved: () => void; setores: string[] }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [dept, setDept] = useState<string | null>(null);
  const [role, setRole] = useState('colaborador');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmail(''); setName(''); setPassword(''); setDept(null); setRole('colaborador'); setError(null);
    }
  }, [visible]);

  async function save() {
    setError(null);
    if (!email || !name || !password || !dept || !role) {
      setError('Preencha todos os campos.');
      return;
    }
    setSaving(true);
    try {
      await API.createUserDirect({ email, full_name: name, password, department: dept, role });
      toast.show('Usuário criado e liberado!');
      onHide();
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog header="Criar Usuário" visible={visible} onHide={onHide} style={{ width: 480 }} modal>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Email *</label>
          <InputText value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@macfor.com.br" className="w-full" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Nome completo *</label>
          <InputText value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Senha inicial *</label>
          <Password value={password} onChange={(e) => setPassword(e.target.value)} feedback={false} toggleMask inputClassName="w-full" className="w-full" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Departamento *</label>
          <Dropdown value={dept} options={setores.map((s) => ({ label: s, value: s }))} onChange={(e) => setDept(e.value)} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Role *</label>
          <Dropdown
            value={role}
            options={['colaborador', 'socio', 'admin_leitor', 'admin_editor'].map((r) => ({ label: ROLE_LABELS[r] || r, value: r }))}
            onChange={(e) => setRole(e.value)}
            className="w-full"
          />
        </div>
        {error && <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" outlined onClick={onHide} />
          <Button label="Criar e Liberar" loading={saving} onClick={save} />
        </div>
      </div>
    </Dialog>
  );
}

function AssignSetorDialog({ visible, onHide, userId, users, setores, onSaved }: { visible: boolean; onHide: () => void; userId: number | null; users: any[]; setores: string[]; onSaved: () => void }) {
  const toast = useToast();
  const target = users.find((u) => u.id === userId);
  const [setor, setSetor] = useState<string | null>(target?.department || null);
  const [isLider, setIsLider] = useState(target?.role === 'lider');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && target) {
      setSetor(target.department || null);
      setIsLider(target.role === 'lider');
    }
  }, [visible, target]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      await API.assignUserSetor(userId, { setor: setor || null, is_lider: isLider });
      toast.show('Setor atualizado!');
      onHide();
      onSaved();
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog header="Atribuir Setor" visible={visible} onHide={onHide} style={{ width: 420 }} modal>
      <div className="space-y-3">
        {target && (
          <p className="text-sm text-[var(--text-muted)]">{target.full_name} ({target.email})</p>
        )}
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Setor</label>
          <Dropdown value={setor} options={[{ label: 'Sem setor', value: null }, ...setores.map((s) => ({ label: s, value: s }))]} onChange={(e) => setSetor(e.value)} className="w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox inputId="isLider" checked={isLider} onChange={(e) => setIsLider(e.checked || false)} />
          <label htmlFor="isLider" className="text-sm cursor-pointer">É líder deste setor?</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" outlined onClick={onHide} />
          <Button label="Salvar" loading={saving} onClick={save} />
        </div>
      </div>
    </Dialog>
  );
}

export default withAuth(AdminUsersPage, isAdminRole);
