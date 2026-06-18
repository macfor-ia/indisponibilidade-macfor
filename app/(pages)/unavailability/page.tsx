'use client';

import { useState, useCallback } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Calendar, Clock, CircleCheck, Plus, FileText, History } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { withAuth } from '../../components/withAuth';
import { EditUnavailDialog } from '../../components/EditUnavailDialog';
import { API } from '../../lib/api-client';
import { canViewAllRole, isLiderRole } from '../../lib/client-config';
import { useAuth, useToast } from '../../providers';
import { KpiStrip } from './_components/KpiStrip';
import { ActiveTimeline } from './_components/ActiveTimeline';
import { TabContent } from './_components/TabContent';
import { useKpis } from './_components/useKpis';

function UnavailPage() {
  const { user } = useAuth();
  const toast = useToast();

  const isAdmin = canViewAllRole(user!.role);
  const canSeePending = isLiderRole(user!.role);

  const [activeTab, setActiveTab] = useState(0);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    API.clearCache();
    setReloadKey((k) => k + 1);
  }, []);

  const { kpis, active } = useKpis(isAdmin, reloadKey);

  const tabs: { key: string; show: boolean; label: string; icon: any }[] = [
    { key: 'overview', show: isAdmin, label: 'Painel Geral', icon: Calendar },
    { key: 'pending', show: canSeePending, label: 'Pedidos Aguardando', icon: Clock },
    { key: 'active', show: isAdmin, label: 'Indisponíveis Agora', icon: CircleCheck },
    { key: 'form', show: true, label: 'Solicitar', icon: Plus },
    { key: 'mine', show: true, label: 'Minhas Solicitações', icon: FileText },
    { key: 'all', show: isAdmin, label: 'Histórico Completo', icon: History },
  ];
  const visibleTabs = tabs.filter((t) => t.show);

  function handleEdit(item: any) {
    setEditRecord(item);
    setEditVisible(true);
  }

  function handleDelete(id: number) {
    confirmDialog({
      message: 'Cancelar esta solicitação de indisponibilidade?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await API.deleteUnavailability(id);
          toast.show('Solicitação cancelada.');
          reload();
        } catch (e: any) {
          toast.show(e.message, 'error');
        }
      },
    });
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <ConfirmDialog />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 py-8">
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calendar size={28} className="text-[var(--accent)]" />
              Indisponibilidade de Agenda
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Controle de períodos de descanso ou indisponibilidade
            </p>
          </div>
        </div>

        {isAdmin && kpis && <KpiStrip kpis={kpis} />}
        {isAdmin && <ActiveTimeline items={active} />}

        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabPanel key={tab.key} header={<span className="flex items-center gap-2"><Icon size={14} /> {tab.label}</span>}>
                <TabContent
                  tabKey={tab.key}
                  reloadKey={reloadKey}
                  onReload={reload}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </TabPanel>
            );
          })}
        </TabView>

        <EditUnavailDialog visible={editVisible} onHide={() => setEditVisible(false)} record={editRecord} onSaved={reload} />
      </div>
    </div>
  );
}

export default withAuth(UnavailPage);
