'use client';

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { API } from '../lib/api-client';
import { UNAVAIL_TYPES, countCalendarDays, getMinRequestDate } from '../lib/client-config';
import { useToast } from '../providers';

interface Props {
  visible: boolean;
  onHide: () => void;
  record: any;
  onSaved: () => void;
}

export function EditUnavailDialog({ visible, onHide, record, onSaved }: Props) {
  const toast = useToast();
  const [type, setType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [days, setDays] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const minDate = new Date(getMinRequestDate() + 'T00:00:00');
  const typeOptions = UNAVAIL_TYPES.map((t) => ({ label: t.label, value: t.value }));

  function toIsoDate(d: Date | null): string {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (record) {
      setType(record.unavailability_type);
      setStartDate(new Date(record.start_date + 'T00:00:00'));
      setEndDate(new Date(record.end_date + 'T00:00:00'));
      setError(null);
    }
  }, [record]);

  useEffect(() => {
    if (type === 'pontual' && startDate) {
      setEndDate(startDate);
    }
  }, [type, startDate]);

  useEffect(() => {
    if (startDate && endDate) {
      const d = countCalendarDays(toIsoDate(startDate), toIsoDate(endDate));
      setDays(d);
    }
  }, [startDate, endDate]);

  async function save() {
    if (!record) return;
    setError(null);
    if (!startDate || !endDate) {
      setError('Datas são obrigatórias.');
      return;
    }
    setSaving(true);
    try {
      await API.updateUnavailability(record.id, {
        start_date: toIsoDate(startDate),
        end_date: toIsoDate(endDate),
        unavailability_type: type,
      });
      toast.show('Solicitação atualizada!');
      onSaved();
      onHide();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog header="Editar Solicitação" visible={visible} onHide={onHide} style={{ width: 480 }} modal>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Tipo</label>
          <Dropdown value={type} options={typeOptions} onChange={(e) => setType(e.value)} className="w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
              {type === 'pontual' ? 'Data do day off' : 'Data de início'}
            </label>
            <PrimeCalendar value={startDate} onChange={(e) => setStartDate(e.value as Date)} minDate={minDate} dateFormat="dd/mm/yy" showIcon className="w-full" />
          </div>
          {type !== 'pontual' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Último dia</label>
              <PrimeCalendar value={endDate} onChange={(e) => setEndDate(e.value as Date)} minDate={startDate || minDate} dateFormat="dd/mm/yy" showIcon className="w-full" />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Total de dias</label>
          <InputText value={String(days || '')} readOnly className="w-full opacity-70" />
        </div>
        {error && <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" outlined onClick={onHide} />
          <Button label="Salvar alterações" onClick={save} loading={saving} />
        </div>
      </div>
    </Dialog>
  );
}
