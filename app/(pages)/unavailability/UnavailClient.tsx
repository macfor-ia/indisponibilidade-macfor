'use client';

import { useState, useCallback, useEffect } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Calendar, Clock, CircleCheck, Plus, FileText, History, Users } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { PageHeader } from '../../components/PageHeader';
import { withAuth } from '../../components/withAuth';
import { EditUnavailDialog } from '../../components/EditUnavailDialog';
import { API } from '../../lib/api-client';
import { canViewAllRole, isLiderRole } from '../../lib/client-config';
import { isOperacaoRole, isAreaRole } from '../../lib/squads';
import { useAuth, useToast } from '../../providers';
import { KpiStrip } from './_components/KpiStrip';
import { ActiveTimeline } from './_components/ActiveTimeline';
import { TabContent } from './_components/TabContent';
import { useKpis } from './_components/useKpis';

function UnavailPage() {
  const { user } = useAuth();
  const toast = useToast();

  const isAdmin = canViewAllRole(user!.role);
  const isLider = isLiderRole(user!.role);
  const isSocio = user!.role === 'socio';
  // Roles de visualização restrita (por cliente ou por área) — só ganham o Painel Geral,
  // filtrado; nunca a fila de aprovação.
  const isScopedViewer = isOperacaoRole(user!.role) || isAreaRole(user!.role);
  const [isApprover, setIsApprover] = useState(false);

  useEffect(() => {
    API.getMyMemberInfo().then((info: any) => setIsApprover(!!info?.is_approver)).catch(() => {});
  }, []);

  // Sócio também aprova via report_to (igual líder). E qualquer pessoa —
  // mesmo role "colaborador"/prestador — que tenha alguém reportando pra ela
  // (is_approver) também ganha a fila de aprovação.
  const canSeePending = isLider || isSocio || isApprover;
  const canSeeActive = isAdmin || isLider;

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
    { key: 'overview', show: isAdmin || isLider || isScopedViewer, label: 'Painel Geral', icon: Calendar },
    { key: 'pending', show: canSeePending, label: 'Pedidos Aguardando', icon: Clock },
    { key: 'active', show: canSeeActive, label: 'Indisponíveis Agora', icon: CircleCheck },
    { key: 'form', show: true, label: 'Solicitar', icon: Plus },
    { key: 'mine', show: true, label: 'Minhas Solicitações', icon: FileText },
    { key: 'all', show: isAdmin, label: 'Histórico Completo', icon: History },
    // Última aba: só líder e roles por área (ex: Mídia e SEO) — a equipe é quem reporta pra eles.
    { key: 'team', show: isLider || isAreaRole(user!.role), label: 'Minha Equipe', icon: Users },
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
        <PageHeader
          icon={<Calendar size={28} className="text-[var(--accent)]" />}
          title="Indisponibilidade de Agenda"
          subtitle="Controle de períodos de descanso ou indisponibilidade"
        />

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

export const UnavailClient = withAuth(UnavailPage);
