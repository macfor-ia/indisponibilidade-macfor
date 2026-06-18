'use client';

import { useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { Card } from '../../../components/Card';
import { UnavailList } from '../../../components/UnavailList';
import { UnavailForm } from '../../../components/UnavailForm';
import { Skeleton } from '../../../components/Skeleton';
import { API } from '../../../lib/api-client';
import { useAuth, useToast } from '../../../providers';
import { OverviewContent } from './OverviewContent';
import { PendingContent } from './PendingContent';
import { AllHistoryContent } from './AllHistoryContent';

interface Props {
  tabKey: string;
  reloadKey: number;
  onReload: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
}

export function TabContent({ tabKey, reloadKey, onReload, onEdit, onDelete }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let res: any = null;
        if (tabKey === 'overview') {
          const [unav, ev] = await Promise.all([API.getUnavailability(), API.getEventosPublic().catch(() => ({ eventos: [] }))]);
          res = { ...(unav as object), eventos: (ev as any).eventos };
        }
        else if (tabKey === 'all') res = await API.getUnavailability();
        else if (tabKey === 'pending') res = await API.getPendingUnavailability();
        else if (tabKey === 'active') res = await API.getActiveUnavailability();
        else if (tabKey === 'mine') res = await API.getMyUnavailability();
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) toast.show(e.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (tabKey !== 'form') load();
    return () => { cancelled = true; };
  }, [tabKey, reloadKey, toast]);

  async function approve(id: number) {
    try { await API.approveUnavailability(id); toast.show('Solicitação aprovada!'); onReload(); }
    catch (e: any) { toast.show(e.message, 'error'); }
  }
  async function reject(id: number) {
    try { await API.rejectUnavailability(id); toast.show('Solicitação rejeitada.'); onReload(); }
    catch (e: any) { toast.show(e.message, 'error'); }
  }

  if (tabKey === 'form') return <UnavailForm user={user!} onSubmitted={onReload} />;
  if (loading) return <Skeleton rows={4} />;

  if (tabKey === 'overview') {
    return <OverviewContent all={data?.data || []} eventos={data?.eventos || []} onApprove={approve} onReject={reject} />;
  }

  if (tabKey === 'pending') {
    return (
      <PendingContent
        items={data || []}
        onApprove={approve}
        onReject={reject}
        onEdit={onEdit}
        onDelete={onDelete}
        onReload={onReload}
      />
    );
  }

  if (tabKey === 'active') {
    const list = (data || []) as any[];
    if (!list.length) return <Card className="text-center text-[var(--text-muted)] py-10">Nenhuma indisponibilidade ativa.</Card>;
    return (
      <>
        <div className="mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <CircleCheck size={16} className="text-emerald-400" /> Pessoas Indisponíveis Agora
          </h3>
          <p className="text-xs text-[var(--text-muted)]">Períodos confirmados que incluem a data de hoje</p>
        </div>
        <UnavailList items={list} showUser currentUser={user!} onEdit={onEdit} onDelete={onDelete} />
      </>
    );
  }

  if (tabKey === 'mine') {
    const list = (data || []) as any[];
    if (!list.length) return <Card className="text-center text-[var(--text-muted)] py-10">Você não tem solicitações.</Card>;
    return <UnavailList items={list} currentUser={user!} onEdit={onEdit} onDelete={onDelete} />;
  }

  if (tabKey === 'all') {
    return <AllHistoryContent all={data?.data || []} truncated={data?.truncated} onEdit={onEdit} onDelete={onDelete} />;
  }

  return null;
}
