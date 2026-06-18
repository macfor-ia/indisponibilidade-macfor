import { supabase } from '../../lib/database';

const EVENTOS_TABLE = 'eventos';
const EVENTO_CLIENTES_TABLE = 'evento_clientes';

export interface Evento {
  id: number;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  created_at?: string;
  cliente_ids?: number[];
  clientes?: { id: number; nome: string }[];
}

export interface EventoInput {
  nome: string;
  descricao?: string | null;
  data_inicio: string;
  data_fim: string;
  cliente_ids: number[];
}

export type EventoUpdate = Partial<EventoInput>;

export function validateEvento(data: Partial<EventoInput>): string | null {
  if (!data.nome || !data.nome.trim()) return 'Nome do evento é obrigatório.';
  if (!data.data_inicio) return 'Data de início é obrigatória.';
  if (!data.data_fim) return 'Data de fim é obrigatória.';
  if (data.data_fim < data.data_inicio) return 'Data de fim deve ser posterior ou igual à data de início.';
  if (data.cliente_ids !== undefined && (!Array.isArray(data.cliente_ids) || data.cliente_ids.length === 0)) {
    return 'Selecione ao menos um cliente.';
  }
  return null;
}

async function attachClientes(eventos: any[]): Promise<Evento[]> {
  if (!eventos.length) return [];
  const ids = eventos.map((e) => e.id);
  const linksRes = await supabase.from(EVENTO_CLIENTES_TABLE).select('evento_id, cliente_id').in('evento_id', ids);
  const links = linksRes.data || [];
  const clienteIds = [...new Set(links.map((l: any) => l.cliente_id))];
  const clientesRes = clienteIds.length
    ? await supabase.from('clientes').select('id, nome').in('id', clienteIds)
    : { data: [] as any[] };
  const clienteById: Record<number, { id: number; nome: string }> = Object.fromEntries(
    (clientesRes.data || []).map((c: any) => [c.id, c]),
  );
  const linksByEvento: Record<number, number[]> = {};
  links.forEach((l: any) => {
    if (!linksByEvento[l.evento_id]) linksByEvento[l.evento_id] = [];
    linksByEvento[l.evento_id].push(l.cliente_id);
  });
  return eventos.map((e) => {
    const cids = linksByEvento[e.id] || [];
    return {
      ...e,
      cliente_ids: cids,
      clientes: cids.map((id) => clienteById[id]).filter(Boolean),
    };
  });
}

async function setEventoClientes(evento_id: number, cliente_ids: number[]): Promise<void> {
  const del = await supabase.from(EVENTO_CLIENTES_TABLE).delete().eq('evento_id', evento_id);
  if (del.error) throw del.error;
  if (!cliente_ids.length) return;
  const rows = cliente_ids.map((cid) => ({ evento_id, cliente_id: cid }));
  const ins = await supabase.from(EVENTO_CLIENTES_TABLE).insert(rows);
  if (ins.error) throw ins.error;
}

export const EventoModel = {
  async list(): Promise<Evento[]> {
    const res = await supabase.from(EVENTOS_TABLE).select('*').order('data_inicio', { ascending: false });
    if (res.error) { console.error('EventoModel.list error:', res.error); return []; }
    return attachClientes(res.data || []);
  },

  async getById(id: number): Promise<Evento | null> {
    const res = await supabase.from(EVENTOS_TABLE).select('*').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    const [enriched] = await attachClientes([res.data]);
    return enriched;
  },

  async getByCliente(cliente_id: number): Promise<Evento[]> {
    const linksRes = await supabase.from(EVENTO_CLIENTES_TABLE).select('evento_id').eq('cliente_id', cliente_id);
    const eventoIds = (linksRes.data || []).map((l: any) => l.evento_id);
    if (!eventoIds.length) return [];
    const res = await supabase.from(EVENTOS_TABLE).select('*').in('id', eventoIds).order('data_inicio', { ascending: false });
    if (res.error) return [];
    return attachClientes(res.data || []);
  },

  async create(input: EventoInput): Promise<Evento> {
    const err = validateEvento(input);
    if (err) throw new Error(err);
    const payload = {
      nome: input.nome.trim(),
      descricao: input.descricao ?? null,
      data_inicio: input.data_inicio,
      data_fim: input.data_fim,
    };
    const res = await supabase.from(EVENTOS_TABLE).insert([payload]).select();
    if (res.error) throw res.error;
    const evento = res.data![0];
    await setEventoClientes(evento.id, input.cliente_ids);
    const [enriched] = await attachClientes([evento]);
    return enriched;
  },

  async update(id: number, input: EventoUpdate): Promise<Evento> {
    if (Object.keys(input).length === 0) throw new Error('Nada para atualizar.');
    const current = await this.getById(id);
    if (!current) throw new Error('Evento não encontrado.');
    const merged = { ...current, ...input } as EventoInput;
    const err = validateEvento(merged);
    if (err) throw new Error(err);

    const payload: any = {};
    if (input.nome !== undefined) payload.nome = input.nome.trim();
    if (input.descricao !== undefined) payload.descricao = input.descricao;
    if (input.data_inicio !== undefined) payload.data_inicio = input.data_inicio;
    if (input.data_fim !== undefined) payload.data_fim = input.data_fim;
    if (Object.keys(payload).length > 0) {
      const res = await supabase.from(EVENTOS_TABLE).update(payload).eq('id', id);
      if (res.error) throw res.error;
    }
    if (input.cliente_ids !== undefined) {
      await setEventoClientes(id, input.cliente_ids);
    }
    const updated = await this.getById(id);
    if (!updated) throw new Error('Evento não encontrado após update.');
    return updated;
  },

  async delete(id: number): Promise<void> {
    const res = await supabase.from(EVENTOS_TABLE).delete().eq('id', id);
    if (res.error) throw res.error;
  },
};
