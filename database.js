require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO CRITICO: SUPABASE_URL ou SUPABASE_KEY nao foram definidos no arquivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const USERS_TABLE = 'users5';
const MEMBERS_TABLE = 'members';

const queries = {
  // ═══ USERS (AUTH) ═══
  getUserByEmail: async (email) => {
    const res = await supabase.from(USERS_TABLE).select('*').eq('email', email).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    const d = res.data;
    return d ? { ...d, full_name: d.nome || d.full_name, password: d.passw || d.password, status: d.status || 'approved' } : null;
  },
  getUserById: async (id) => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, department, member_id, created_at, approved_by, approved_at').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    const d = res.data;
    return d ? { ...d, full_name: d.nome || d.full_name, status: d.status || 'approved' } : null;
  },
  getAllUsers: async () => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, department, created_at, approved_by, approved_at').order('created_at', { ascending: false });
    if (res.error) { console.error('getAllUsers error:', res.error); return []; }
    return (res.data || []).map(d => ({ ...d, full_name: d.nome || d.full_name }));
  },
  getUsersByIds: async (ids) => {
    if (!ids || !ids.length) return [];
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, department').in('id', ids);
    if (res.error) return [];
    return (res.data || []).map(d => ({ ...d, email: d.email?.toLowerCase() }));
  },
  assignUserSetor: async ({ id, department, role }) => {
    const updates = {};
    if (department !== undefined) updates.department = department;
    if (role !== undefined) updates.role = role;
    const res = await supabase.from(USERS_TABLE).update(updates).eq('id', id);
    if (res.error) throw res.error;
  },
  getLideresByDepartment: async (department) => {
    const res = await supabase.from(USERS_TABLE)
      .select('id, email, nome')
      .eq('role', 'lider')
      .eq('department', department)
      .eq('status', 'approved');
    if (res.error) return [];
    return (res.data || []).map(d => ({ ...d, email: d.email?.toLowerCase() }));
  },
  getPendingUsers: async (status) => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, created_at').eq('status', status);
    if (res.error) { console.error('getPendingUsers error:', res.error); return []; }
    return (res.data || []).map(d => ({ ...d, full_name: d.nome || d.full_name }));
  },
  getApprovedUsers: async (status) => {
    const res = await supabase.from(USERS_TABLE).select('id, email, nome, role, status, created_at').eq('status', status);
    if (res.error) { console.error('getApprovedUsers error:', res.error); return []; }
    return (res.data || []).map(d => ({ ...d, full_name: d.nome || d.full_name }));
  },
  createUser: async (user) => {
    const payload = { ...user, nome: user.full_name, passw: user.password, status: 'pending' };
    delete payload.full_name;
    delete payload.password;
    const res = await supabase.from(USERS_TABLE).insert([payload]).select();
    if (res.error) throw res.error;
    return res.data[0];
  },
  approveUser: async ({ id, approved_by }) => {
    const res = await supabase.from(USERS_TABLE).update({ status: 'approved', approved_by, approved_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  rejectUser: async ({ id, approved_by }) => {
    const res = await supabase.from(USERS_TABLE).update({ status: 'rejected', approved_by, approved_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  deleteUser: async (id) => {
    const res = await supabase.from(USERS_TABLE).delete().eq('id', id);
    if (res.error) throw res.error;
  },
  changeUserRole: async ({ id, role }) => {
    const res = await supabase.from(USERS_TABLE).update({ role }).eq('id', id);
    if (res.error) throw res.error;
  },

  // ═══ MEMBERS (from CSV - employee registry) ═══
  getAllMembers: async () => {
    const res = await supabase.from(MEMBERS_TABLE).select('*').order('name', { ascending: true });
    if (res.error) { console.error('getAllMembers error:', res.error); return []; }
    return res.data || [];
  },
  getMemberByEmail: async (email) => {
    const res = await supabase.from(MEMBERS_TABLE).select('*').eq('email', email).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    if (res.error) throw res.error;
    return res.data;
  },
  getMemberById: async (id) => {
    const res = await supabase.from(MEMBERS_TABLE).select('*').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    return res.data;
  },
  createMember: async (data) => {
    const res = await supabase.from(MEMBERS_TABLE).insert([data]).select();
    if (res.error) throw res.error;
    return res.data[0];
  },
  updateMember: async (id, data) => {
    const res = await supabase.from(MEMBERS_TABLE).update(data).eq('id', id).select();
    if (res.error) throw res.error;
    return res.data[0];
  },
  deleteMember: async (id) => {
    const res = await supabase.from(MEMBERS_TABLE).delete().eq('id', id);
    if (res.error) throw res.error;
  },
  getApproverForMember: async (email) => {
    const memberRes = await supabase.from(MEMBERS_TABLE).select('report_to').eq('email', email).single();
    if (memberRes.error || !memberRes.data) return null;
    const { report_to } = memberRes.data;
    if (!report_to) return null;
    const approverEmails = report_to.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(s => s.includes('@'));
    if (!approverEmails.length) return null;
    const res = await supabase.from(MEMBERS_TABLE).select('*').in('email', approverEmails);
    const approvers = res.data || [];
    return approvers.length === 1 ? approvers[0] : approvers.length > 1 ? approvers : null;
  },
  getApproverEmailsForMember: async (email) => {
    const memberRes = await supabase.from(MEMBERS_TABLE).select('report_to').eq('email', email).single();
    if (memberRes.error || !memberRes.data) return [];
    const { report_to } = memberRes.data;
    if (!report_to) return [];
    return report_to.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  },

  // ═══ UNAVAILABILITY ═══
  createUnavailability: async (data) => {
    const res = await supabase.from('unavailability').insert([data]).select();
    if (res.error) throw res.error;
    return res.data[0];
  },
  getAllUnavailability: async () => {
    const res = await supabase.from('unavailability')
      .select(`*, ${USERS_TABLE}!user_id (nome, email)`)
      .order('created_at', { ascending: false });
    if (res.error) { console.error('getAllUnavailability error:', res.error); return []; }
    return res.data.map(d => ({ ...d, user_name: d[USERS_TABLE]?.nome, user_email: d[USERS_TABLE]?.email }));
  },
  getUserUnavailability: async (user_id) => {
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
    return res.data.map(d => ({ ...d, user_name: d[USERS_TABLE]?.nome, user_email: d[USERS_TABLE]?.email, user_role: d[USERS_TABLE]?.role }));
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
    return res.data.map(d => ({ ...d, user_name: d[USERS_TABLE]?.nome, user_email: d[USERS_TABLE]?.email, user_role: d[USERS_TABLE]?.role }));
  },
  approveUnavailability: async ({ id, reviewed_by }) => {
    const res = await supabase.from('unavailability').update({ status: 'approved', reviewed_by, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  rejectUnavailability: async ({ id, reviewed_by }) => {
    const res = await supabase.from('unavailability').update({ status: 'rejected', reviewed_by, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (res.error) throw res.error;
  },
  updateUnavailability: async (id, data) => {
    const res = await supabase.from('unavailability').update(data).eq('id', id);
    if (res.error) throw res.error;
  },
  deleteUnavailability: async (id) => {
    const res = await supabase.from('unavailability').delete().eq('id', id);
    if (res.error) throw res.error;
  },
  getUnavailabilityById: async (id) => {
    const res = await supabase.from('unavailability').select('*').eq('id', id).single();
    if (res.error && res.error.code === 'PGRST116') return null;
    return res.data;
  },
  // Get non-rejected unavailabilities for a user (to check overlaps)
  getUserActiveUnavailability: async (user_id) => {
    const res = await supabase.from('unavailability')
      .select('id, start_date, end_date, status')
      .eq('user_id', user_id)
      .in('status', ['pending', 'approved']);
    return res.data || [];
  },
  // Get total days used by a user (approved unavailabilities)
  getUsedDaysByUser: async (user_id) => {
    const res = await supabase.from('unavailability')
      .select('total_days')
      .eq('user_id', user_id)
      .eq('status', 'approved');
    if (res.error) return 0;
    return (res.data || []).reduce((sum, r) => sum + (r.total_days || 0), 0);
  },
};

// Seed admin asynchronously since it uses Supabase
async function seedDefaultAdmin() {
  const res = await supabase.from(USERS_TABLE).select('id').in('role', ['admin_master', 'admin_editor', 'admin_leitor', 'socio']).limit(1);
  if (!res.data || res.data.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    const memberRes = await supabase.from(MEMBERS_TABLE).select('id').eq('email', 'gustavo.romao@macfor.com.br').single();
    const memberId = memberRes.data ? memberRes.data.id : null;
    await supabase.from(USERS_TABLE).insert([{ email: 'gustavo.romao@macfor.com.br', passw: hash, nome: 'Gustavo Romão (Admin)', role: 'admin_master', status: 'approved', member_id: memberId }]);
    console.log('>> Admin padrao criado: gustavo.romao@macfor.com.br / admin123');
  } else {
    // Garantir que gustavo.romao seja admin_master
    await supabase.from(USERS_TABLE)
      .update({ role: 'admin_master' })
      .eq('email', 'gustavo.romao@macfor.com.br')
      .neq('role', 'admin_master');
  }
}
seedDefaultAdmin().catch(err => console.error("Error seeding default admin:", err));

module.exports = { db: null, queries };
