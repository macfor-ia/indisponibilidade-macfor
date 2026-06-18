'use client';

import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ChevronLeft, Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { withAuth } from '../../../components/withAuth';
import { Card } from '../../../components/Card';
import { API } from '../../../lib/api-client';
import { isMasterAdminRole } from '../../../lib/client-config';
import { useToast } from '../../../providers';

function SetoresPage() {
  const router = useRouter();
  const toast = useToast();
  const [setores, setSetores] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ index: number; value: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    const data = await API.getSetores().catch(() => []);
    setSetores(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  async function addSetor() {
    if (!newName.trim()) return;
    try {
      await API.createSetor(newName.trim());
      toast.show('Setor criado!');
      setNewName('');
      setAdding(false);
      await load();
    } catch (e: any) { toast.show(e.message, 'error'); }
  }

  async function updateSetor() {
    if (!editing) return;
    try {
      await API.updateSetor(editing.index, editing.value.trim());
      toast.show('Setor atualizado!');
      setEditing(null);
      await load();
    } catch (e: any) { toast.show(e.message, 'error'); }
  }

  async function deleteSetor(index: number) {
    if (!confirm('Remover este setor?')) return;
    try {
      await API.deleteSetor(index);
      toast.show('Setor removido!');
      await load();
    } catch (e: any) { toast.show(e.message, 'error'); }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8">
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Layers size={28} className="text-[var(--accent)]" /> Gerenciar Setores
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">{setores.length} setores cadastrados</p>
          </div>
          <div className="flex gap-2">
            <Button label="Voltar" icon={<ChevronLeft size={14} />} severity="secondary" outlined size="small" onClick={() => router.push('/unavailability')} />
            <Button label="Novo Setor" icon={<Plus size={14} />} size="small" onClick={() => setAdding(true)} />
          </div>
        </div>

        <Card className="max-w-xl">
          {adding && (
            <div className="flex gap-2 mb-4">
              <InputText value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do setor" className="flex-1" autoFocus onKeyDown={(e) => e.key === 'Enter' && addSetor()} />
              <Button label="Criar" size="small" onClick={addSetor} />
              <Button label="Cancelar" severity="secondary" outlined size="small" onClick={() => setAdding(false)} />
            </div>
          )}
          <div className="space-y-2">
            {setores.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                {editing?.index === i ? (
                  <>
                    <InputText value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} className="flex-1" autoFocus onKeyDown={(e) => e.key === 'Enter' && updateSetor()} />
                    <Button label="Salvar" size="small" onClick={updateSetor} />
                    <Button label="Cancelar" severity="secondary" outlined size="small" onClick={() => setEditing(null)} />
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{s}</span>
                    <Button icon={<Pencil size={12} />} size="small" severity="secondary" outlined onClick={() => setEditing({ index: i, value: s })} />
                    <Button icon={<Trash2 size={12} />} size="small" severity="danger" outlined onClick={() => deleteSetor(i)} />
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(SetoresPage, isMasterAdminRole);
