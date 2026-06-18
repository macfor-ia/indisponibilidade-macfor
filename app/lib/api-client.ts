'use client';

const _cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 15000;

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  if (method === 'GET' && _cache[url] && Date.now() - _cache[url].ts < CACHE_TTL) {
    return JSON.parse(JSON.stringify(_cache[url].data)) as T;
  }

  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(res.ok ? 'Resposta inválida do servidor' : `Erro ${res.status} do servidor`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  if (method === 'GET') _cache[url] = { data, ts: Date.now() };
  else {
    Object.keys(_cache).forEach((k) => {
      if (url.includes('unavailability') ? (k.includes('unavailability') || k.includes('dashboard')) : true) {
        delete _cache[k];
      }
    });
  }
  return data as T;
}

export const API = {
  clearCache() { Object.keys(_cache).forEach((k) => delete _cache[k]); },

  login: (email: string, password: string) => request('POST', '/api/auth/login', { email, password }),
  register: (data: unknown) => request('POST', '/api/auth/register', data),
  logout: () => { API.clearCache(); return request('POST', '/api/auth/logout'); },
  me: () => request('GET', '/api/auth/me'),

  getSetores: () => request<string[]>('GET', '/api/setores'),
  createSetor: (name: string) => request('POST', '/api/admin/setores', { name }),
  updateSetor: (index: number, name: string) => request('PUT', `/api/admin/setores/${index}`, { name }),
  deleteSetor: (index: number) => request('DELETE', `/api/admin/setores/${index}`),

  getUsers: () => request('GET', '/api/admin/users'),
  getPending: () => request('GET', '/api/admin/pending'),
  approveUser: (id: number) => request('POST', `/api/admin/approve/${id}`),
  rejectUser: (id: number) => request('POST', `/api/admin/reject/${id}`),
  deleteUser: (id: number) => request('DELETE', `/api/admin/users/${id}`),
  changeUserRole: (id: number, role: string) => request('POST', `/api/admin/change-role/${id}`, { role }),
  createUserDirect: (data: unknown) => request('POST', '/api/admin/users/create', data),
  assignUserSetor: (id: number, data: unknown) => request('POST', `/api/admin/users/${id}/assign-setor`, data),

  getDashboard: () => request('GET', '/api/dashboard'),

  getMembers: () => request('GET', '/api/members'),
  getMemberByEmail: (email: string) => request('GET', `/api/members/by-email/${encodeURIComponent(email)}`),
  getMyMemberInfo: () => request('GET', '/api/members/me'),
  createMember: (data: unknown) => request('POST', '/api/admin/members', data),
  updateMember: (id: number, data: unknown) => request('PUT', `/api/admin/members/${id}`, data),
  deleteMember: (id: number) => request('DELETE', `/api/admin/members/${id}`),

  createUnavailability: (data: unknown) => request('POST', '/api/unavailability', data),
  updateUnavailability: (id: number, data: unknown) => request('PATCH', `/api/unavailability/${id}`, data),
  getUnavailability: () => request('GET', '/api/unavailability'),
  getMyUnavailability: () => request('GET', '/api/unavailability/mine'),
  getPendingUnavailability: () => request('GET', '/api/unavailability/pending'),
  getActiveUnavailability: () => request('GET', '/api/unavailability/active'),
  getUnavailabilityImpact: () => request('GET', '/api/unavailability/impact'),
  approveUnavailability: (id: number) => request('POST', `/api/unavailability/${id}/approve`),
  rejectUnavailability: (id: number) => request('POST', `/api/unavailability/${id}/reject`),
  deleteUnavailability: (id: number) => request('DELETE', `/api/unavailability/${id}`),

  getClientes: () => request('GET', '/api/admin/clientes'),
  createCliente: (data: unknown) => request('POST', '/api/admin/clientes', data),
  updateCliente: (id: number, data: unknown) => request('PATCH', `/api/admin/clientes/${id}`, data),
  deleteCliente: (id: number) => request('DELETE', `/api/admin/clientes/${id}`),
  assignCliente: (id: number, data: unknown) => request('POST', `/api/admin/clientes/${id}/assign`, data),

  getEventos: () => request('GET', '/api/eventos'),
  getEventosPublic: () => request('GET', '/api/eventos'),
  createEvento: (data: unknown) => request('POST', '/api/admin/eventos', data),
  updateEvento: (id: number, data: unknown) => request('PATCH', `/api/admin/eventos/${id}`, data),
  deleteEvento: (id: number) => request('DELETE', `/api/admin/eventos/${id}`),
};
