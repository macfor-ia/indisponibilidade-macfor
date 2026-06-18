import { supabase } from '../../lib/database';

const CLIENTES_TABLE = 'clientes';
const USER_CLIENTES_TABLE = 'user_clientes';

export interface Cliente {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at?: string;
}

export interface UserClienteLink {
  user_id: number;
  cliente_id: number;
  ativo: boolean;
  created_at?: string;
}

export type ClienteInput = Omit<Cliente, 'id' | 'created_at'>;
export type ClienteUpdate = Partial<ClienteInput>;

export function validateCliente(data: Partial<ClienteInput>): string | null {
  if (!data.nome || !data.nome.trim()) return 'Nome do cliente é obrigatório.';
  if (data.nome.trim().length < 2) return 'Nome do cliente deve ter ao menos 2 caracteres.';
  return null;
}

function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

export const ClienteModel = {
  async list(includeInactive = false): Promise<Cliente[]> {
    let q = supabase.from(CLIENTES_TABLE).select('*').order('nome', { ascending: true });
    if (!includeInactive) q = q.eq('ativo', true);
    const res = await q;
    if (res.error) { console.error('ClienteModel.list error:', res.error); return []; }
    return res.data || [];
  },

  async getById(id: number): Promise<Cliente | null> {
    const res = await supabase.from(CLIENTES_TABLE).select('*').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    return res.data;
  },

  async getByNome(nome: string): Promise<Cliente | null> {
    const res = await supabase.from(CLIENTES_TABLE).select('*').ilike('nome', nome).maybeSingle();
    if (res.error) return null;
    return res.data;
  },

  async create(input: ClienteInput): Promise<Cliente> {
    const err = validateCliente(input);
    if (err) throw new Error(err);
    const exists = await this.getByNome(input.nome.trim());
    if (exists) throw new Error('Já existe um cliente com este nome.');
    const payload = { nome: input.nome.trim(), descricao: input.descricao ?? null, ativo: toBool(input.ativo ?? true) };
    const res = await supabase.from(CLIENTES_TABLE).insert([payload]).select();
    if (res.error) throw res.error;
    return res.data![0];
  },

  async update(id: number, input: ClienteUpdate): Promise<Cliente> {
    if (Object.keys(input).length === 0) throw new Error('Nada para atualizar.');
    if (input.nome !== undefined) {
      const err = validateCliente({ nome: input.nome });
      if (err) throw new Error(err);
    }
    const payload: any = { ...input };
    if (input.nome !== undefined) payload.nome = input.nome.trim();
    if (input.ativo !== undefined) payload.ativo = toBool(input.ativo);
    const res = await supabase.from(CLIENTES_TABLE).update(payload).eq('id', id).select();
    if (res.error) throw res.error;
    if (!res.data || !res.data.length) throw new Error('Cliente não encontrado.');
    return res.data[0];
  },

  async delete(id: number): Promise<void> {
    const res = await supabase.from(CLIENTES_TABLE).delete().eq('id', id);
    if (res.error) throw res.error;
  },


  async assignUser(user_id: number, cliente_id: number): Promise<void> {
    const res = await supabase.from(USER_CLIENTES_TABLE).upsert(
      [{ user_id, cliente_id, ativo: true }],
      { onConflict: 'user_id,cliente_id' },
    );
    if (res.error) throw res.error;
  },

  async unassignUser(user_id: number, cliente_id: number): Promise<void> {
    const res = await supabase.from(USER_CLIENTES_TABLE).delete().eq('user_id', user_id).eq('cliente_id', cliente_id);
    if (res.error) throw res.error;
  },

  async setUserClienteAtivo(user_id: number, cliente_id: number, ativo: boolean): Promise<void> {
    const res = await supabase.from(USER_CLIENTES_TABLE)
      .upsert([{ user_id, cliente_id, ativo: toBool(ativo) }], { onConflict: 'user_id,cliente_id' });
    if (res.error) throw res.error;
  },

  async getUsersOfCliente(cliente_id: number): Promise<number[]> {
    const res = await supabase.from(USER_CLIENTES_TABLE)
      .select('user_id')
      .eq('cliente_id', cliente_id)
      .eq('ativo', true);
    if (res.error) return [];
    return (res.data || []).map((r: any) => r.user_id);
  },

  async getClientesOfUser(user_id: number): Promise<number[]> {
    const res = await supabase.from(USER_CLIENTES_TABLE)
      .select('cliente_id')
      .eq('user_id', user_id)
      .eq('ativo', true);
    if (res.error) return [];
    return (res.data || []).map((r: any) => r.cliente_id);
  },

  async getAllLinks(): Promise<UserClienteLink[]> {
    const res = await supabase.from(USER_CLIENTES_TABLE).select('user_id, cliente_id, ativo');
    if (res.error) return [];
    return res.data || [];
  },
};
