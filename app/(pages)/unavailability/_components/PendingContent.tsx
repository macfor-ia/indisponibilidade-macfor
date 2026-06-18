'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Clock } from 'lucide-react';
import { Card } from '../../../components/Card';
import { UnavailList } from '../../../components/UnavailList';
import { isEditorRole, isLiderRole } from '../../../lib/client-config';
import { useAuth, useToast } from '../../../providers';
import { API } from '../../../lib/api-client';

interface Props {
  items: any[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onReload: () => void;
}

export function PendingContent({ items, onApprove, onReject, onEdit, onDelete, onReload }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function batchAction(action: 'approve' | 'reject') {
    const ids = Array.from(selectedIds);
    if (!ids.length) { toast.show('Nenhuma selecionada.', 'error'); return; }
    if (!confirm(`${action === 'approve' ? 'Confirmar' : 'Reavaliar'} ${ids.length} solicitação(ões)?`)) return;
    let ok = 0, fail = 0;
    await Promise.all(ids.map((id) =>
      (action === 'approve' ? API.approveUnavailability(id) : API.rejectUnavailability(id))
        .then(() => ok++).catch(() => fail++)
    ));
    toast.show(`${ok} ${action === 'approve' ? 'confirmada' : 'negada'}(s)${fail ? `, ${fail} falha(s)` : ''}.`);
    setSelectedIds(new Set());
    onReload();
  }

  if (!items.length) {
    return (
      <Card className="text-center text-[var(--text-muted)] py-10">
        Nenhuma solicitação pendente de verificação.
      </Card>
    );
  }

  const canApprove = isEditorRole(user!.role) || isLiderRole(user!.role);

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Clock size={16} className="text-yellow-400" />
          Aguardando Verificação <span className="text-xs text-[var(--text-muted)] font-normal">({items.length})</span>
        </h3>
        {canApprove && (
          <div className="flex gap-2 flex-wrap">
            <Button label="Selecionar todos" size="small" severity="secondary" outlined onClick={() =>
              setSelectedIds(new Set(selectedIds.size === items.length ? [] : items.map((i) => i.id)))
            } />
            <Button label="Confirmar selecionados" size="small" severity="success" onClick={() => batchAction('approve')} />
            <Button label="Reavaliar selecionados" size="small" severity="danger" onClick={() => batchAction('reject')} />
          </div>
        )}
      </div>
      <UnavailList
        items={items}
        showActions={canApprove}
        showUser
        showCheckbox={canApprove}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onApprove={onApprove}
        onReject={onReject}
        onEdit={onEdit}
        onDelete={onDelete}
        currentUser={user!}
      />
    </>
  );
}
