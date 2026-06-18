import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO CRITICO: SUPABASE_URL ou SUPABASE_KEY nao definidos.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const USERS_TABLE = 'users5';
const MEMBERS_TABLE = 'members';

export const queries = {
  getUserByEmail: async (email: string) => {
    const res = await supabase.from(USERS_TABLE).select('*').eq('email', email).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    const d: any = res.data;
    return d ? { ...d, full_name: d.nome || d.full_name, password: d.passw || d.password, status: d.status || 'approved' } : null;
  },
  getUserById: async (id: number) => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, department, member_id, created_at, approved_by, approved_at').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    const d: any = res.data;
    return d ? { ...d, full_name: d.nome || d.full_name, status: d.status || 'approved' } : null;
  },
  getAllUsers: async () => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, department, created_at, approved_by, approved_at').order('created_at', { ascending: false });
    if (res.error) { console.error('getAllUsers error:', res.error); return []; }
    return (res.data || []).map((d: any) => ({ ...d, full_name: d.nome || d.full_name }));
  },
  getUsersByIds: async (ids: number[]) => {
    if (!ids || !ids.length) return [];
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, department, member_id').in('id', ids);
    if (res.error) return [];
    return (res.data || []).map((d: any) => ({ ...d, email: d.email?.toLowerCase() }));
  },
  getMembersByIds: async (ids: number[]) => {
    if (!ids || !ids.length) return [];
    const res = await supabase.from(MEMBERS_TABLE).select('id, email, name, report_to').in('id', ids);
    if (res.error) return [];
    return res.data || [];
  },
  getMembersByEmails: async (emails: string[]) => {
    if (!emails || !emails.length) return [];
    const res = await supabase.from(MEMBERS_TABLE).select('id, email, name, report_to').in('email', emails);
    if (res.error) return [];
    return res.data || [];
  },
  assignUserSetor: async ({ id, department, role }: { id: number; department?: string | null; role?: string }) => {
    const updates: any = {};
    if (department !== undefined) updates.department = department;
    if (role !== undefined) updates.role = role;
    const res = await supabase.from(USERS_TABLE).update(updates).eq('id', id);
    if (res.error) throw res.error;
  },
  getLideresByDepartment: async (department: string) => {
    const res = await supabase.from(USERS_TABLE)
      .select('id, email, nome')
      .eq('role', 'lider')
      .eq('department', department)
      .eq('status', 'approved');
    if (res.error) return [];
    return (res.data || []).map((d: any) => ({ ...d, email: d.email?.toLowerCase() }));
  },
  getPendingUsers: async (status: string) => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, created_at').eq('status', status);
    if (res.error) { console.error('getPendingUsers error:', res.error); return []; }
    return (res.data || []).map((d: any) => ({ ...d, full_name: d.nome || d.full_name }));
  },
  getApprovedUsers: async (status: string) => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, created_at').eq('status', status);
    if (res.error) { console.error('getApprovedUsers error:', res.error); return []; }
    return (res.data || []).map((d: any) => ({ ...d, full_name: d.nome || d.full_name }));
  },
  createUser: async (user: any) => {
    const payload: any = { ...user, nome: user.full_name, passw: user.password, status: 'pending' };
    delete payload.full_name;
    delete payload.password;
    const res = await supabase.from(USERS_TABLE).insert([payload]).select();
    if (res.error) throw res.error;
    return res.data![0];
  },
  approveUser: async ({ id, approved_by }: { id: number; approved_by: number }) => {
    const res = await supabase.from(USERS_TABLE).update({ status: 'approved', approved_by, approved_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  rejectUser: async ({ id, approved_by }: { id: number; approved_by: number }) => {
    const res = await supabase.from(USERS_TABLE).update({ status: 'rejected', approved_by, approved_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  deleteUser: async (id: number) => {
    const res = await supabase.from(USERS_TABLE).delete().eq('id', id);
    if (res.error) throw res.error;
  },
  changeUserRole: async ({ id, role }: { id: number; role: string }) => {
    const res = await supabase.from(USERS_TABLE).update({ role }).eq('id', id);
    if (res.error) throw res.error;
  },


  getAllMembers: async () => {
    const res = await supabase.from(MEMBERS_TABLE).select('*').order('name', { ascending: true });
    if (res.error) { console.error('getAllMembers error:', res.error); return []; }
    return res.data || [];
  },
  getMemberByEmail: async (email: string) => {
    const res = await supabase.from(MEMBERS_TABLE).select('*').eq('email', email).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    return res.data;
  },
  getMemberById: async (id: number) => {
    const res = await supabase.from(MEMBERS_TABLE).select('*').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    return res.data;
  },
  createMember: async (data: any) => {
    const res = await supabase.from(MEMBERS_TABLE).insert([data]).select();
    if (res.error) throw res.error;
    return res.data![0];
  },
  updateMember: async (id: number, data: any) => {
    const res = await supabase.from(MEMBERS_TABLE).update(data).eq('id', id).select();
    if (res.error) throw res.error;
    return res.data![0];
  },
  deleteMember: async (id: number) => {
    const res = await supabase.from(MEMBERS_TABLE).delete().eq('id', id);
    if (res.error) throw res.error;
  },
  getApproverForMember: async (email: string) => {
    const memberRes = await supabase.from(MEMBERS_TABLE).select('report_to').eq('email', email).single();
    if (memberRes.error || !memberRes.data) return null;
    const { report_to } = memberRes.data as any;
    if (!report_to) return null;
    const approverEmails = report_to.split(/[,;]/).map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.includes('@'));
    if (!approverEmails.length) return null;
    const res = await supabase.from(MEMBERS_TABLE).select('*').in('email', approverEmails);
    const approvers = res.data || [];
    return approvers.length === 1 ? approvers[0] : approvers.length > 1 ? approvers : null;
  },
  getApproverEmailsForMember: async (email: string) => {
    const memberRes = await supabase.from(MEMBERS_TABLE).select('report_to').eq('email', email).single();
    if (memberRes.error || !memberRes.data) return [];
    const { report_to } = memberRes.data as any;
    if (!report_to) return [];
    return report_to.split(/[,;]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  },
  getMembersEmailsReportingTo: async (liderEmail: string) => {
    if (!liderEmail) return [];
    const liderEmailLower = liderEmail.toLowerCase();
    const liderRes = await supabase.from(MEMBERS_TABLE).select('name').eq('email', liderEmailLower).single();
    const liderName = (liderRes.data as any)?.name?.toLowerCase() || null;

    const res = await supabase.from(MEMBERS_TABLE).select('email, report_to');
    if (res.error) return [];

    return (res.data || []).filter((m: any) => {
      if (!m.report_to) return false;
      const parts = m.report_to.split(/[,;]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      return parts.some((p: string) => {
        if (p === liderEmailLower) return true;
        if (liderName && p === liderName) return true;
        return false;
      });
    }).map((m: any) => m.email?.toLowerCase()).filter(Boolean);
  },


  createUnavailability: async (data: any) => {
    const res = await supabase.from('unavailability').insert([data]).select();
    if (res.error) throw res.error;
    return res.data![0];
  },
  getAllUnavailability: async ({ limit = 500 }: { limit?: number } = {}) => {
    const res = await supabase.from('unavailability')
      .select(`*, ${USERS_TABLE}!user_id (nome, email)`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (res.error) { console.error('getAllUnavailability error:', res.error); return []; }
    return (res.data || []).map((d: any) => ({ ...d, user_name: d[USERS_TABLE]?.nome, user_email: d[USERS_TABLE]?.email }));
  },
  getUserUnavailability: async (user_id: number) => {
    const res = await supabase.from('unavailability')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    return res.data || [];
  },
  getPendingUnavailability: async () => {
    const res = await supabase.from('unavailability')
      .select(`*, ${USERS_TABLE}!user_id (nome, email, role)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (res.error) { console.error('getPendingUnavailability error:', res.error); return []; }
    return (res.data || []).map((d: any) => ({ ...d, user_name: d[USERS_TABLE]?.nome, user_email: d[USERS_TABLE]?.email, user_role: d[USERS_TABLE]?.role }));
  },
  getActiveUnavailability: async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await supabase.from('unavailability')
      .select(`*, ${USERS_TABLE}!user_id (nome, email, role)`)
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: true });
    if (res.error) { console.error('getActiveUnavailability error:', res.error); return []; }
    return (res.data || []).map((d: any) => ({ ...d, user_name: d[USERS_TABLE]?.nome, user_email: d[USERS_TABLE]?.email, user_role: d[USERS_TABLE]?.role }));
  },
  approveUnavailability: async ({ id, reviewed_by }: { id: number; reviewed_by: number }) => {
    const res = await supabase.from('unavailability').update({ status: 'approved', reviewed_by, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  rejectUnavailability: async ({ id, reviewed_by }: { id: number; reviewed_by: number }) => {
    const res = await supabase.from('unavailability').update({ status: 'rejected', reviewed_by, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  updateUnavailability: async (id: number, data: any) => {
    const res = await supabase.from('unavailability').update(data).eq('id', id);
    if (res.error) throw res.error;
  },
  deleteUnavailability: async (id: number) => {
    const res = await supabase.from('unavailability').delete().eq('id', id);
    if (res.error) throw res.error;
  },
  getUnavailabilityById: async (id: number) => {
    const res = await supabase.from('unavailability').select('*').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    return res.data;
  },
  getUserActiveUnavailability: async (user_id: number) => {
    const res = await supabase.from('unavailability')
      .select('id, start_date, end_date, status')
      .eq('user_id', user_id)
      .in('status', ['pending', 'approved']);
    return res.data || [];
  },
  getEventConflictsForRequests: async (
    requests: Array<{ id: number; user_id: number; start_date: string; end_date: string }>,
  ) => {
    if (!requests.length) return {} as Record<number, any[]>;

    const userIds = [...new Set(requests.map((r) => r.user_id))];
    const linkRes = await supabase.from('user_clientes')
      .select('user_id, cliente_id')
      .in('user_id', userIds)
      .eq('ativo', true);
    if (linkRes.error) { console.error('getEventConflictsForRequests links error:', linkRes.error); return {}; }
    const links = linkRes.data || [];
    if (!links.length) return {};

    const clientesByUser: Record<number, Set<number>> = {};
    links.forEach((l: any) => {
      if (!clientesByUser[l.user_id]) clientesByUser[l.user_id] = new Set();
      clientesByUser[l.user_id].add(l.cliente_id);
    });

    const minStart = requests.reduce((m, r) => r.start_date < m ? r.start_date : m, requests[0].start_date);
    const maxEnd = requests.reduce((m, r) => r.end_date > m ? r.end_date : m, requests[0].end_date);

    const evRes = await supabase.from('eventos')
      .select('id, nome, descricao, data_inicio, data_fim')
      .lte('data_inicio', maxEnd)
      .gte('data_fim', minStart)
      .order('data_inicio', { ascending: true });
    if (evRes.error) { console.error('getEventConflictsForRequests eventos error:', evRes.error); return {}; }
    const eventos = evRes.data || [];
    if (!eventos.length) return {};

    const eventoIds = eventos.map((e: any) => e.id);
    const evClRes = await supabase.from('evento_clientes')
      .select('evento_id, cliente_id')
      .in('evento_id', eventoIds);
    const evClientesByEvento: Record<number, Set<number>> = {};
    (evClRes.data || []).forEach((row: any) => {
      if (!evClientesByEvento[row.evento_id]) evClientesByEvento[row.evento_id] = new Set();
      evClientesByEvento[row.evento_id].add(row.cliente_id);
    });

    const allClienteIds = [...new Set([
      ...Object.values(clientesByUser).flatMap((s) => [...s]),
      ...Object.values(evClientesByEvento).flatMap((s) => [...s]),
    ])];
    const clRes = allClienteIds.length
      ? await supabase.from('clientes').select('id, nome').in('id', allClienteIds)
      : { data: [] as any[] };
    const clienteNomeById: Record<number, string> = Object.fromEntries(
      (clRes.data || []).map((c: any) => [c.id, c.nome]),
    );

    const out: Record<number, any[]> = {};
    for (const req of requests) {
      const userClientes = clientesByUser[req.user_id];
      if (!userClientes || !userClientes.size) continue;

      const conflicts = eventos
        .filter((ev: any) => ev.data_inicio <= req.end_date && ev.data_fim >= req.start_date)
        .map((ev: any) => {
          const evClientes = evClientesByEvento[ev.id] || new Set<number>();
          const matchedIds = [...evClientes].filter((cid) => userClientes.has(cid));
          return { ev, matchedIds };
        })
        .filter((x) => x.matchedIds.length > 0)
        .map(({ ev, matchedIds }) => ({
          id: ev.id,
          nome: ev.nome,
          descricao: ev.descricao,
          data_inicio: ev.data_inicio,
          data_fim: ev.data_fim,
          clientes: matchedIds.map((id) => clienteNomeById[id]).filter(Boolean),
        }));

      if (conflicts.length) out[req.id] = conflicts;
    }
    return out;
  },

  getUsedDaysByUser: async (user_id: number, year?: number) => {
    const y = year ?? new Date().getFullYear();
    const yearStart = `${y}-01-01`;
    const yearEnd = `${y}-12-31`;
    const res = await supabase.from('unavailability')
      .select('total_days')
      .eq('user_id', user_id)
      .eq('status', 'approved')
      .lte('start_date', yearEnd)
      .gte('end_date', yearStart);
    if (res.error) return 0;
    return (res.data || []).reduce((sum: number, r: any) => sum + (r.total_days || 0), 0);
  },
};

export async function seedDefaultAdmin() {
  if (process.env.DISABLE_SEED === 'true') {
    console.log('[seed] DISABLE_SEED=true — seed do admin ignorado.');
    return;
  }
  try {
    const res = await supabase.from(USERS_TABLE).select('id').in('role', ['admin_master', 'admin_editor', 'admin_leitor', 'socio']).limit(1);
    if (!res.data || res.data.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      const memberRes = await supabase.from(MEMBERS_TABLE).select('id').eq('email', 'gustavo.romao@macfor.com.br').single();
      const memberId = memberRes.data ? (memberRes.data as any).id : null;
      await supabase.from(USERS_TABLE).insert([{ email: 'gustavo.romao@macfor.com.br', passw: hash, nome: 'Gustavo Romão (Admin)', role: 'admin_master', status: 'approved', member_id: memberId }]);
    } else {
      const upd = await supabase.from(USERS_TABLE).update({ role: 'admin_master' }).eq('email', 'gustavo.romao@macfor.com.br').neq('role', 'admin_master').select('id');
      if (upd.data && upd.data.length > 0) {
        console.warn('[seed] Role de gustavo.romao@macfor.com.br restaurado para admin_master.');
      }
    }
  } catch (e: any) {
    console.error('seedDefaultAdmin error:', e.message);
  }
}
