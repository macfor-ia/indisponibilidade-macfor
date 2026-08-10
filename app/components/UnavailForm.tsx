'use client';

import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { User, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { API } from '../lib/api-client';
import { UNAVAIL_TYPES, countCalendarDays, getMinRequestDate, isFridayOrSaturday, AppUser } from '../lib/client-config';
import { useSetores, useToast } from '../providers';
import { Card } from './Card';

interface Props {
  user: AppUser;
  onSubmitted?: () => void;
}

export function UnavailForm({ user, onSubmitted }: Props) {
  const { setores } = useSetores();
  const toast = useToast();
  const [type, setType] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [days, setDays] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [checkingCredits, setCheckingCredits] = useState(false);

  const minDate = new Date(getMinRequestDate() + 'T00:00:00');

  async function atualizarCreditos() {
    setCheckingCredits(true);
    try {
      const info: any = await API.atualizarCreditos();
      setMemberInfo((prev: any) => ({ ...prev, ...info }));
      toast.show(info.updated ? 'Crédito de +20 dias aplicado! 🎉' : 'Nenhum crédito pendente no momento.');
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setCheckingCredits(false);
    }
  }

  function toIsoDate(d: Date | null): string {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  useEffect(() => {
    API.getMyMemberInfo().then((info: any) => {
      setMemberInfo(info);
      if (info?.member?.area && setores.includes(info.member.area)) {
        setDepartment(info.member.area);
      } else if (user.department && setores.includes(user.department)) {
        setDepartment(user.department);
      }
    }).catch(() => {});
  }, [user, setores]);

  useEffect(() => {
    if (type === 'pontual' && startDate) {
      setEndDate(startDate);
    }
  }, [type, startDate]);

  useEffect(() => {
    if (!startDate || !endDate) {
      setDays(0);
      setWarn(null);
      setBalanceError(null);
      setEndDateError(null);
      return;
    }
    const diff = countCalendarDays(toIsoDate(startDate), toIsoDate(endDate));
    setDays(diff);

    if (type === 'prolongado' && isFridayOrSaturday(toIsoDate(endDate))) {
      setEndDateError('O último dia do período não pode ser sexta-feira nem sábado — o fim das férias deve cair num domingo.');
    } else {
      setEndDateError(null);
    }

    if (memberInfo && diff > 0) {
      const remaining = memberInfo.remaining_days ?? 0;
      if (diff > remaining) {
        setBalanceError(`Saldo insuficiente: você tem ${remaining} dia(s) disponível(is) e está solicitando ${diff}.`);
      } else {
        setBalanceError(null);
      }
    } else {
      setBalanceError(null);
    }

    if (type === 'prolongado' && diff > 0 && diff < 5) {
      setWarn(`A solicitação deve ter no mínimo 5 dias corridos. Período atual: ${diff} dia(s).`);
      return;
    }
    setWarn(null);
  }, [startDate, endDate, type, memberInfo]);

  async function submit() {
    setError(null);
    if (!type || !department || !startDate || !endDate || !days) {
      setError('Preencha todos os campos.');
      return;
    }
    if (days < 1) {
      setError('Data de retorno deve ser posterior à data de início.');
      return;
    }
    if (type === 'prolongado' && days < 5) {
      const msg = `A solicitação deve ter no mínimo 5 dias corridos. Período atual: ${days} dia(s).`;
      setError(msg);
      toast.show(msg, 'error');
      return;
    }
    if (endDateError) {
      setError(endDateError);
      toast.show(endDateError, 'error');
      return;
    }
    if (balanceError) {
      setError(balanceError);
      toast.show(balanceError, 'error');
      return;
    }
    const startStr = toIsoDate(startDate);
    if (startStr < getMinRequestDate()) {
      setError('A data de início deve ser pelo menos 15 dias a partir de hoje.');
      return;
    }
    setSubmitting(true);
    try {
      await API.createUnavailability({
        unavailability_type: type,
        department,
        start_date: startStr,
        end_date: toIsoDate(endDate),
        total_days: days,
      });
      toast.show('Solicitação enviada com sucesso!');
      onSubmitted?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const typeOptions = UNAVAIL_TYPES.map((t) => ({ label: t.label, value: t.value }));
  const setorOptions = setores.map((s) => ({ label: s, value: s }));

  const quotaColor =
    memberInfo?.remaining_days <= 0 ? 'text-red-400' :
    memberInfo?.remaining_days <= 5 ? 'text-orange-400' : 'text-emerald-400';

  return (
    <Card className="w-full">
      <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-[var(--accent)]" />
        Solicitação de Indisponibilidade
      </h3>

      {memberInfo?.member && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Saldo</div>
              <Button
                onClick={atualizarCreditos}
                loading={checkingCredits}
                label="Atualizar créditos"
                icon={<RefreshCw size={11} />}
                severity="secondary"
                text
                size="small"
                className="!p-0 !text-[11px] !text-[var(--text-muted)] hover:!text-[var(--text)]"
              />
            </div>
            <div className={`text-2xl font-bold font-mono ${quotaColor}`}>{memberInfo.remaining_days} <span className="text-xs font-normal text-[var(--text-muted)]">dias</span></div>
          </div>
          {memberInfo.approver && (
            <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Verificação</div>
              {(Array.isArray(memberInfo.approver) ? memberInfo.approver : [memberInfo.approver]).map((a: any, i: number) => (
                <div key={i} className="text-xs">
                  <div className="font-semibold flex items-center gap-1.5"><User size={12} /> {a.name}</div>
                  {a.email && <div className="text-[var(--text-muted)] text-[11px]">{a.email}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Nome completo do prestador</label>
          <InputText value={user.full_name} readOnly className="w-full opacity-70" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Tipo de indisponibilidade</label>
          <Dropdown value={type} options={typeOptions} onChange={(e) => setType(e.value)} placeholder="Selecione..." className="w-full" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Departamento ou área de atuação</label>
          <Dropdown value={department} options={setorOptions} onChange={(e) => setDepartment(e.value)} placeholder="Selecione..." className="w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
              {type === 'pontual' ? 'Data do day off' : 'Data de início'}
            </label>
            <PrimeCalendar value={startDate} onChange={(e) => setStartDate(e.value as Date)} minDate={minDate} dateFormat="dd/mm/yy" showIcon className="w-full" />
            {type === 'prolongado' && (
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} className="text-yellow-400" />
                Período mínimo de 5 dias corridos.
              </p>
            )}
          </div>
          {type !== 'pontual' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Último dia</label>
              <PrimeCalendar value={endDate} onChange={(e) => setEndDate(e.value as Date)} minDate={startDate || minDate} dateFormat="dd/mm/yy" showIcon className="w-full" />
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} className="text-yellow-400" />
                Período mínimo de 5 dias corridos, e não pode terminar numa sexta-feira ou sábado.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Total de dias corridos</label>
          <InputText value={String(days || '')} readOnly className="w-full opacity-70" />
        </div>

        {warn && (
          <div className="px-3.5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{warn}</span>
          </div>
        )}
        {endDateError && (
          <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{endDateError}</span>
          </div>
        )}
        {balanceError && (
          <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{balanceError}</span>
          </div>
        )}
        {error && (
          <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button onClick={submit} loading={submitting} disabled={!!balanceError || !!endDateError} label="Enviar Solicitação" className="w-full justify-center" />
      </div>
    </Card>
  );
}
