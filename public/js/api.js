// ═══ API CLIENT (with auto-retry) ═══
const API = {
  _cache: {},
  _cacheTs: {},
  _CACHE_TTL: 15000,

  async request(method, url, body = null, _retries = 2) {
    if (method === 'GET' && this._cache[url] && (Date.now() - this._cacheTs[url]) < this._CACHE_TTL) {
      return JSON.parse(JSON.stringify(this._cache[url]));
    }

    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, opts);

      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error(res.ok ? 'Resposta invalida do servidor' : `Erro ${res.status} do servidor`);
      }

      const data = await res.json();

      if (res.status === 401) {
        APP.user = null;
        throw new Error(data.error || 'Sessao expirada. Faca login novamente.');
      }

      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      if (method === 'GET') {
        this._cache[url] = data;
        this._cacheTs[url] = Date.now();
      } else {
        this._invalidateCache(url);
      }

      return data;
    } catch (e) {
      if (_retries > 0 && e instanceof TypeError) {
        const delay = (3 - _retries) * 800 + 300;
        await new Promise(r => setTimeout(r, delay));
        return this.request(method, url, body, _retries - 1);
      }
      throw e;
    }
  },

  _invalidateCache(url) {
    if (url.includes('unavailability')) {
      Object.keys(this._cache).forEach(k => {
        if (k.includes('unavailability') || k.includes('dashboard')) {
          delete this._cache[k];
          delete this._cacheTs[k];
        }
      });
    } else {
      this._cache = {};
      this._cacheTs = {};
    }
  },

  clearCache() {
    this._cache = {};
    this._cacheTs = {};
  },

  // Auth
  login: (email, password) => API.request('POST', '/api/auth/login', { email, password }),
  register: (data) => API.request('POST', '/api/auth/register', data),
  logout: () => { API.clearCache(); return API.request('POST', '/api/auth/logout'); },
  me: () => API.request('GET', '/api/auth/me'),

  // Setores
  getSetores: () => API.request('GET', '/api/setores'),
  createSetor: (name) => API.request('POST', '/api/admin/setores', { name }),
  updateSetor: (index, name) => API.request('PUT', `/api/admin/setores/${index}`, { name }),
  deleteSetor: (index) => API.request('DELETE', `/api/admin/setores/${index}`),
  assignUserSetor: (id, data) => API.request('POST', `/api/admin/users/${id}/assign-setor`, data),

  // Admin
  getUsers: () => API.request('GET', '/api/admin/users'),
  getPending: () => API.request('GET', '/api/admin/pending'),
  approveUser: (id) => API.request('POST', `/api/admin/approve/${id}`),
  rejectUser: (id) => API.request('POST', `/api/admin/reject/${id}`),
  deleteUser: (id) => API.request('DELETE', `/api/admin/users/${id}`),
  changeUserRole: (id, role) => API.request('POST', `/api/admin/change-role/${id}`, { role }),
  createUserDirect: (data) => API.request('POST', '/api/admin/users/create', data),

  // Dashboard
  getDashboard: () => API.request('GET', '/api/dashboard'),

  // Members
  getMembers: () => API.request('GET', '/api/members'),
  getMemberByEmail: (email) => API.request('GET', `/api/members/by-email/${encodeURIComponent(email)}`),
  getMyMemberInfo: () => API.request('GET', '/api/members/me'),
  createMember: (data) => API.request('POST', '/api/admin/members', data),
  updateMember: (id, data) => API.request('PUT', `/api/admin/members/${id}`, data),
  deleteMember: (id) => API.request('DELETE', `/api/admin/members/${id}`),

  // Unavailability
  createUnavailability: (data) => API.request('POST', '/api/unavailability', data),
  updateUnavailability: (id, data) => API.request('PATCH', `/api/unavailability/${id}`, data),
  getUnavailability: () => API.request('GET', '/api/unavailability'),
  getMyUnavailability: () => API.request('GET', '/api/unavailability/mine'),
  getPendingUnavailability: () => API.request('GET', '/api/unavailability/pending'),
  getActiveUnavailability: () => API.request('GET', '/api/unavailability/active'),
  getUnavailabilityImpact: () => API.request('GET', '/api/unavailability/impact'),
  approveUnavailability: (id) => API.request('POST', `/api/unavailability/${id}/approve`),
  rejectUnavailability: (id) => API.request('POST', `/api/unavailability/${id}/reject`),
  deleteUnavailability: (id) => API.request('DELETE', `/api/unavailability/${id}`),
};
