// ═══ MAIN APP ROUTER ═══

const APP = {
  user: null,
  view: 'loading',
  viewData: {},
  _renderVersion: 0,
};

async function nav(view, data = {}) {
  APP.view = view;
  APP.viewData = data;
  APP._renderVersion++;
  window.scrollTo(0, 0);
  await render();
}

function skeleton(rows = 3) {
  let h = '<div class="content">';
  for (let i = 0; i < rows; i++) {
    h += `<div class="skel" style="height:${60 + Math.random() * 40}px;margin-bottom:14px;animation-delay:${i * .08}s"></div>`;
  }
  return h + '</div>';
}

async function render() {
  const app = document.getElementById('app');
  const rv = APP._renderVersion;

  // ─── LOADING ───
  if (APP.view === 'loading') {
    app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:16px">
      <div class="spinner"></div>
      <span style="font-size:13px;color:var(--text-dim)">Carregando...</span>
    </div>`;
    return;
  }

  // ─── LOGIN ───
  if (APP.view === 'login') {
    app.innerHTML = renderLogin();
    bindLogin();
    return;
  }

  // ─── REGISTER ───
  if (APP.view === 'register') {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh"><div class="spinner"></div></div>`;
    const setores = await API.getSetores().catch(() => null);
    if (rv !== APP._renderVersion) return;
    app.innerHTML = renderRegister(setores);
    bindRegister();
    return;
  }

  // ─── AUTHENTICATED VIEWS ───
  if (!APP.user) {
    try {
      const res = await API.me();
      if (rv !== APP._renderVersion) return;
      APP.user = res.user;
    } catch (e) {
      if (rv !== APP._renderVersion) return;
      APP.view = 'login';
      app.innerHTML = renderLogin();
      bindLogin();
      return;
    }
  }

  const user = APP.user;

  // ─── UNAVAILABILITY (main view) ───
  if (APP.view === 'unavailability') {
    app.innerHTML = renderNavbar(user) + skeleton(4);
    try {
      const html = renderUnavailability(user);
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + html;
      initUnavailDashboard();
    } catch (e) {
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + renderRetryCard(e, 'unavailability');
    }
    return;
  }

  // ─── ADMIN USERS ───
  if (APP.view === 'admin-users') {
    if (!isAdminRole(user.role)) { nav('unavailability'); return; }
    app.innerHTML = renderNavbar(user) + skeleton(4);
    try {
      const usersHtml = await renderAdminUsers();
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + usersHtml;
      bindAdminUsers();
    } catch (e) {
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + renderRetryCard(e, 'admin-users');
    }
    return;
  }

  // ─── ADMIN SETORES ───
  if (APP.view === 'admin-setores') {
    if (!isMasterAdminRole(user.role)) { nav('unavailability'); return; }
    API.clearCache();
    app.innerHTML = renderNavbar(user) + skeleton(3);
    try {
      const [setores, users] = await Promise.all([API.getSetores(), API.getUsers()]);
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + renderAdminSetores(setores, users);
    } catch (e) {
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + renderRetryCard(e, 'admin-setores');
    }
    return;
  }

  // ─── ADMIN MEMBERS ───
  if (APP.view === 'admin-members') {
    if (!isMasterAdminRole(user.role)) { nav('unavailability'); return; }
    API.clearCache();
    app.innerHTML = renderNavbar(user) + skeleton(4);
    try {
      const html = await renderAdminMembers();
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + html;
      bindAdminMembers();
    } catch (e) {
      if (rv !== APP._renderVersion) return;
      app.innerHTML = renderNavbar(user) + renderRetryCard(e, 'admin-members');
    }
    return;
  }

  // Fallback
  nav('unavailability');
}

// ═══ ADMIN USERS VIEW ═══
async function renderAdminUsers() {
  const [users, pending, setores] = await Promise.all([
    API.getUsers(),
    API.getPending(),
    API.getSetores().catch(() => SETORES_DINAMICOS),
  ]);

  const isMaster = isMasterAdminRole(APP.user.role);

  let h = `<div class="content">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:16px">
      <div>
        <h1 style="font-size:26px;font-weight:700;letter-spacing:-.5px">\u{1F465} Gerenciar Usuarios</h1>
        <p style="color:var(--text-muted);margin-top:4px;font-size:14px">Aprovacao e gerenciamento de contas</p>
      </div>
      <div style="display:flex;gap:8px">
        ${isMaster ? `<button class="btn btn-p" onclick="openCreateUserModal()" style="font-size:13px">+ Criar Usuario</button>` : ''}
        <button class="btn btn-s" onclick="nav('unavailability')" style="font-size:13px">\u2190 Voltar</button>
      </div>
    </div>
  <div id="createUserModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center">
    <div class="card" style="width:100%;max-width:480px;margin:20px;max-height:90vh;overflow-y:auto">
      <h3 style="font-size:18px;font-weight:700;margin-bottom:20px">Criar Usuario</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Email *</label>
          <input id="cu_email" class="inp" type="email" placeholder="email@macfor.com.br">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Nome completo *</label>
          <input id="cu_name" class="inp" type="text" placeholder="Nome completo">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Senha inicial *</label>
          <input id="cu_password" class="inp" type="password" placeholder="Min. 6 caracteres">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Departamento *</label>
          <select id="cu_dept" class="sel">
            <option value="">Selecione...</option>
            ${setores.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Role *</label>
          <select id="cu_role" class="sel">
            ${['colaborador','socio','admin_leitor','admin_editor'].map(r =>
              `<option value="${r}">${ROLE_LABELS[r] || r}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div id="cu_error" style="color:var(--red);font-size:13px;margin-top:10px;display:none"></div>
      <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
        <button class="btn btn-g btn-sm" onclick="closeCreateUserModal()">Cancelar</button>
        <button class="btn btn-p btn-sm" onclick="doCreateUserDirect()">Criar e Aprovar</button>
      </div>
    </div>
  </div>`;

  // Pending
  if (pending.length) {
    h += `<div class="card" style="border-color:var(--yellow-border);margin-bottom:20px">
      <h4 style="color:var(--yellow);margin-bottom:12px">\u23F3 ${pending.length} Aguardando Aprovacao</h4>`;
    pending.forEach(u => {
      h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:14px;font-weight:500">${esc(u.full_name)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${esc(u.email)} \u00B7 ${esc(u.role)}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-green" onclick="doApproveUser(${u.id})">Aprovar</button>
          <button class="btn btn-sm btn-d" onclick="doRejectUser(${u.id})">Rejeitar</button>
        </div>
      </div>`;
    });
    h += `</div>`;
  }

  // All users
  h += `<div class="card">
    <h4 style="margin-bottom:12px">Todos os Usuarios (${users.length})</h4>
    <div class="card" style="padding:0;overflow:hidden">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:var(--surface);border-bottom:1px solid var(--border)">
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Nome</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Email</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Setor</th>
            <th style="padding:12px 16px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Role</th>
            <th style="padding:12px 16px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Status</th>
            <th style="padding:12px 16px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Acoes</th>
          </tr>
        </thead>
        <tbody>`;

  users.forEach(u => {
    const stMap = { approved: 'fb-green', pending: 'fb-yellow', rejected: 'fb-red' };
    const isLider = u.role === 'lider';
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:10px 16px;font-weight:500">
        ${esc(u.full_name)}
        ${isLider ? `<span style="font-size:10px;background:var(--orange,#f97316);color:#fff;padding:1px 6px;border-radius:3px;margin-left:4px;vertical-align:middle">LIDER</span>` : ''}
      </td>
      <td style="padding:10px 16px;color:var(--text-muted);font-size:12px">${esc(u.email)}</td>
      <td style="padding:10px 16px;text-align:center;font-size:12px">${esc(u.department || '-')}</td>
      <td style="padding:10px 16px;text-align:center">
        ${u.role === 'admin_master'
          ? `<span class="fb" style="background:var(--purple,#7c3aed);color:#fff;padding:3px 8px;border-radius:4px;font-size:11px">Admin Master</span>`
          : `<select class="sel" style="font-size:12px;padding:4px 8px" onchange="doChangeRole(${u.id}, this.value)" ${u.id === APP.user.id ? 'disabled' : ''}>
              ${['admin_editor','admin_leitor','lider','socio','colaborador'].map(r =>
                `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLE_LABELS[r] || r}</option>`
              ).join('')}
            </select>`
        }
      </td>
      <td style="padding:10px 16px;text-align:center"><span class="fb ${stMap[u.status] || 'fb-yellow'}">${u.status}</span></td>
      <td style="padding:10px 16px;text-align:center">
        <div style="display:flex;gap:4px;justify-content:center">
          ${isMaster && u.role !== 'admin_master' ? `<button class="btn btn-sm btn-s" onclick="openAssignSetorModal(${u.id})" style="font-size:11px">Setor</button>` : ''}
          ${u.id !== APP.user.id ? `<button class="btn btn-sm btn-d" onclick="doDeleteUser(${u.id})">Remover</button>` : '-'}
        </div>
      </td>
    </tr>`;
  });

  h += `</tbody></table></div></div></div>`;
  return h;
}

function bindAdminUsers() {
  // Event bindings are inline
}

async function doApproveUser(id) {
  try {
    await API.approveUser(id);
    showToast('Usuario aprovado!');
    nav('admin-users');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doRejectUser(id) {
  try {
    await API.rejectUser(id);
    showToast('Usuario rejeitado.');
    nav('admin-users');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doChangeRole(id, role) {
  try {
    await API.changeUserRole(id, role);
    showToast('Role atualizado!');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doDeleteUser(id) {
  if (!confirm('Remover este usuario permanentemente?')) return;
  try {
    await API.deleteUser(id);
    showToast('Usuario removido.');
    nav('admin-users');
  } catch (e) { showToast(e.message, 'error'); }
}

function openCreateUserModal() {
  const modal = document.getElementById('createUserModal');
  if (modal) modal.style.display = 'flex';
}

function closeCreateUserModal() {
  const modal = document.getElementById('createUserModal');
  if (modal) modal.style.display = 'none';
}

async function doCreateUserDirect() {
  const email = document.getElementById('cu_email').value.trim();
  const full_name = document.getElementById('cu_name').value.trim();
  const password = document.getElementById('cu_password').value;
  const department = document.getElementById('cu_dept').value;
  const role = document.getElementById('cu_role').value;
  const errEl = document.getElementById('cu_error');
  errEl.style.display = 'none';

  if (!email || !full_name || !password || !department || !role) {
    errEl.textContent = 'Preencha todos os campos.';
    errEl.style.display = 'block';
    return;
  }
  try {
    await API.createUserDirect({ email, full_name, password, department, role });
    showToast('Usuario criado e aprovado!');
    closeCreateUserModal();
    nav('admin-users');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

// ═══ ADMIN MEMBERS VIEW ═══
const _membersCache = {};

async function renderAdminMembers(search = '', filterArea = '') {
  const members = await API.getMembers();
  members.forEach(m => { _membersCache[m.id] = m; });
  const allAreas = [...new Set(members.map(m => m.area).filter(Boolean))].sort();
  let filtered = filterArea
    ? members.filter(m => (m.area || '') === filterArea)
    : members;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.area?.toLowerCase().includes(q) ||
      String(m.id).includes(q));
  }

  let h = `<div class="content">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:16px">
      <div>
        <h1 style="font-size:26px;font-weight:700;letter-spacing:-.5px">\u{1F4CB} Gerenciar Membros</h1>
        <p style="color:var(--text-muted);margin-top:4px;font-size:14px">Cadastro de colaboradores (${filtered.length}/${members.length})</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-s" onclick="nav('unavailability')" style="font-size:13px">← Voltar</button>
        <button class="btn btn-p" onclick="openMemberModal(0)" style="font-size:13px">+ Novo Membro</button>
      </div>
    </div>
    <div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <input id="memberSearch" class="inp" type="text" placeholder="Buscar por nome, email, area ou ID..." value="${esc(search)}"
        oninput="debounceMemberSearch(this.value)" style="max-width:280px">
      <select id="memberAreaFilter" class="inp" style="max-width:200px" onchange="doFilterMemberArea(this.value)">
        <option value="">Todas as equipes</option>
        ${allAreas.map(a => `<option value="${esc(a)}" ${filterArea === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}
      </select>
      ${filterArea ? `<button class="btn btn-g btn-sm" onclick="doFilterMemberArea('')">Limpar filtro</button>` : ''}
    </div>
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px;background:var(--card,#1e1e2e);border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:var(--surface);border-bottom:1px solid var(--border)">
          <th style="padding:10px 12px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;white-space:nowrap">ID</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Nome</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Email</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Equipe / Squad</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Reporta para</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Dias</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Acoes</th>
        </tr>
      </thead>
      <tbody>`;

  filtered.forEach(m => {
    h += `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--text-muted);font-family:monospace">#${m.id}</td>
      <td style="padding:8px 12px;font-weight:500;white-space:nowrap">${esc(m.name)}</td>
      <td style="padding:8px 12px;color:var(--text-muted);font-size:12px">${esc(m.email || '-')}</td>
      <td style="padding:8px 12px;font-size:12px">${esc(m.area || '-')}${m.squad ? `<span style="font-size:11px;color:var(--text-muted);display:block">${esc(m.squad)}</span>` : ''}</td>
      <td style="padding:8px 12px;font-size:12px;color:var(--text-muted)">${_reportToNames(m.report_to)}</td>
      <td style="padding:8px 12px;text-align:center;font-size:12px">${m.day_offs_quota ?? '-'}</td>
      <td style="padding:8px 12px;text-align:center">
        <div style="display:flex;gap:6px;justify-content:center">
          <button class="btn btn-sm btn-s" onclick="openMemberModal(${m.id})">Editar</button>
          <button class="btn btn-sm btn-d" onclick="doDeleteMember(${m.id})">Remover</button>
        </div>
      </td>
    </tr>`;
  });

  h += `</tbody></table></div>
  <div id="memberModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center">
    <div class="card" style="width:100%;max-width:540px;margin:20px;max-height:90vh;overflow-y:auto">
      <div id="memberModalContent"></div>
    </div>
  </div>
  </div>`;
  return h;
}

function bindAdminMembers() {
  // inline handlers
}

let _memberSearchTimer = null;
let _memberAreaFilter = '';
function debounceMemberSearch(val) {
  clearTimeout(_memberSearchTimer);
  _memberSearchTimer = setTimeout(async () => {
    const html = await renderAdminMembers(val, _memberAreaFilter);
    const app = document.getElementById('app');
    app.innerHTML = renderNavbar(APP.user) + html;
    bindAdminMembers();
  }, 300);
}
async function doFilterMemberArea(area) {
  _memberAreaFilter = area;
  const search = document.getElementById('memberSearch')?.value || '';
  const html = await renderAdminMembers(search, area);
  document.getElementById('app').innerHTML = renderNavbar(APP.user) + html;
  bindAdminMembers();
}

function _reportToNames(report_to) {
  if (!report_to) return '-';
  const emailToName = {};
  Object.values(_membersCache).forEach(m => { if (m.email) emailToName[m.email.toLowerCase()] = m.name; });
  const names = report_to.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean)
    .map(e => emailToName[e] || e);
  return esc(names.join(', ')) || '-';
}

function _buildReportToList(excludeId, currentReportTo) {
  const selected = (currentReportTo || '').split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const allMembers = Object.values(_membersCache)
    .filter(m => m.id !== excludeId && m.email)
    .sort((a, b) => a.name.localeCompare(b.name));
  return allMembers.map(m => {
    const checked = selected.includes(m.email.toLowerCase());
    return `<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:4px;cursor:pointer;transition:background .1s" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">
      <input type="checkbox" class="mf_approver_cb" value="${esc(m.email.toLowerCase())}" ${checked ? 'checked' : ''} style="width:14px;height:14px;flex-shrink:0">
      <div style="min-width:0">
        <div style="font-size:13px">${esc(m.name)}</div>
        <div style="font-size:11px;color:var(--text-muted)">${esc(m.email)}</div>
      </div>
      ${m.funcao ? `<span style="font-size:11px;color:var(--text-muted);margin-left:auto;white-space:nowrap;flex-shrink:0">${esc(m.funcao)}</span>` : ''}
    </label>`;
  }).join('');
}

function filterApproverList(val) {
  const q = val.toLowerCase();
  document.querySelectorAll('#mf_approver_list label').forEach(lbl => {
    lbl.style.display = lbl.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function openMemberModal(id) {
  const m = id ? _membersCache[id] : null;
  const modal = document.getElementById('memberModal');
  const content = document.getElementById('memberModalContent');
  content.innerHTML = `
    <h3 style="font-size:18px;font-weight:700;margin-bottom:20px">${m ? `Editar Membro <span style="font-size:13px;color:var(--text-muted);font-weight:400">#${m.id}</span>` : 'Novo Membro'}</h3>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Nome *</label>
          <input id="mf_name" class="inp" type="text" value="${esc(m?.name || '')}" placeholder="Nome completo">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Email</label>
          <input id="mf_email" class="inp" type="email" value="${esc(m?.email || '')}" placeholder="email@macfor.com.br">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Equipe/Area *</label>
          <input id="mf_area" class="inp" type="text" list="mf_area_opts" value="${esc(m?.area || '')}" placeholder="Selecione ou digite...">
          <datalist id="mf_area_opts">${(SETORES_DINAMICOS || []).map(s => `<option value="${esc(s)}"></option>`).join('')}</datalist>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Squad</label>
          <input id="mf_squad" class="inp" type="text" value="${esc(m?.squad || '')}" placeholder="Sub-equipe (opcional)">
        </div>
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Funcao *</label>
        <input id="mf_funcao" class="inp" type="text" value="${esc(m?.funcao || '')}" placeholder="Ex: Designer Sr">
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Quota de dias</label>
        <input id="mf_day_offs" class="inp" type="number" min="0" value="${m?.day_offs_quota ?? 20}" style="max-width:120px">
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <input id="mf_operacoes" type="checkbox" ${m?.operacoes ? 'checked' : ''} style="width:15px;height:15px">
        <label for="mf_operacoes" style="font-size:13px;cursor:pointer">Operacoes</label>
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">Reporta para (aprovador das solicitacoes)</label>
        <input class="inp" type="text" placeholder="Buscar aprovador..." oninput="filterApproverList(this.value)"
          style="margin-bottom:6px">
        <div id="mf_approver_list" style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;padding:4px">
          ${_buildReportToList(m?.id || 0, m?.report_to || '')}
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:4px">Selecione um ou mais aprovadores</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
      <button class="btn btn-g btn-sm" onclick="closeMemberModal()">Cancelar</button>
      <button class="btn btn-p btn-sm" onclick="doSaveMember(${m ? m.id : 'null'})">Salvar</button>
    </div>`;
  modal.style.display = 'flex';
}

function closeMemberModal() {
  document.getElementById('memberModal').style.display = 'none';
}

async function doSaveMember(id) {
  const name = document.getElementById('mf_name').value.trim();
  const email = document.getElementById('mf_email').value.trim();
  const area = document.getElementById('mf_area').value.trim();
  const funcao = document.getElementById('mf_funcao').value.trim();
  const squad = document.getElementById('mf_squad').value.trim();
  const day_offs_quota = parseInt(document.getElementById('mf_day_offs').value) || 20;
  const operacoes = document.getElementById('mf_operacoes').checked;
  const checked = [...document.querySelectorAll('.mf_approver_cb:checked')].map(cb => cb.value);
  const report_to = checked.join(', ') || null;

  if (!name || !area || !funcao) { showToast('Nome, area e funcao sao obrigatorios.', 'error'); return; }

  try {
    if (id) {
      await API.updateMember(id, { name, email: email || null, area, funcao, squad: squad || null, report_to, day_offs_quota, operacoes });
      showToast('Membro atualizado!');
    } else {
      await API.createMember({ name, email: email || null, area, funcao, squad: squad || null, report_to, day_offs_quota, operacoes });
      showToast('Membro criado!');
    }
    closeMemberModal();
    nav('admin-members');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doDeleteMember(id) {
  const name = _membersCache[id]?.name || 'este membro';
  if (!confirm(`Remover "${name}" permanentemente? Isso pode afetar solicitacoes vinculadas.`)) return;
  try {
    await API.deleteMember(id);
    showToast('Membro removido.');
    nav('admin-members');
  } catch (e) { showToast(e.message, 'error'); }
}

// ═══ ADMIN SETORES VIEW ═══
let _setoresPageUsers = [];
let _setorModalIdx = null;
let _addToSetorName = null;

function renderAdminSetores(setores, users) {
  _setoresPageUsers = users;
  SETORES_DINAMICOS = setores;

  let h = `<div class="content">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:16px">
      <div>
        <h1 style="font-size:26px;font-weight:700;letter-spacing:-.5px">\u{1F3DB} Gerenciar Setores</h1>
        <p style="color:var(--text-muted);margin-top:4px;font-size:14px">${setores.length} setores · ${users.length} usuarios</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-p" onclick="openSetorModal(null)" style="font-size:13px">+ Novo Setor</button>
        <button class="btn btn-s" onclick="nav('unavailability')" style="font-size:13px">← Voltar</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">`;

  setores.forEach((setor, idx) => {
    const members = users.filter(u => u.department === setor);
    const lideres = members.filter(u => u.role === 'lider');
    const outros = members.filter(u => u.role !== 'lider');
    const color = DEPT_COLORS[setor] || 'var(--accent)';
    const setorEsc = setor.replace(/\\/g,'\\\\').replace(/'/g,"\\'");

    h += `<div class="card" style="border-top:3px solid ${color};padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:8px">
        <div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:2px">${esc(setor)}</h3>
          <div style="font-size:12px;color:var(--text-muted)">${lideres.length} lider(es) · ${outros.length} membro(s)</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn btn-sm btn-s" onclick="openAddToSetorModal('${setorEsc}')" style="font-size:11px">+ Membro</button>
          <button class="btn btn-sm btn-s" onclick="openSetorModal(${idx})" title="Renomear" style="font-size:11px">✎</button>
          <button class="btn btn-sm btn-d" onclick="doDeleteSetor(${idx}, '${setorEsc}')" style="font-size:11px">✕</button>
        </div>
      </div>`;

    h += `<div style="margin-bottom:10px">
      <div style="font-size:10px;color:var(--orange,#f97316);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px">
        ★ Lideres (aprovam solicitacoes)
      </div>`;

    if (!lideres.length) {
      h += `<div style="font-size:12px;color:var(--yellow);padding:6px 8px;background:var(--surface);border-radius:4px">
        ⚠ Nenhum lider — solicitacoes deste setor nao terao aprovador
      </div>`;
    } else {
      lideres.forEach(u => {
        const uSetor = setor.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        h += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--surface);border-radius:4px;margin-bottom:4px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.full_name)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${esc(u.email || '')}</div>
          </div>
          <button class="btn btn-sm" style="background:rgba(249,115,22,.12);color:var(--orange,#f97316);border:1px solid var(--orange,#f97316);font-size:10px;padding:2px 7px;border-radius:4px;cursor:pointer;white-space:nowrap"
            onclick="doToggleLider(${u.id}, false, '${uSetor}')">↓ Rebaixar</button>
          <button class="btn btn-sm btn-d" style="font-size:10px;padding:2px 7px"
            onclick="doRemoveFromSetor(${u.id})">✕</button>
        </div>`;
      });
    }
    h += `</div>`;

    if (outros.length) {
      h += `<div>
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Membros (${outros.length})</div>
        <div style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:3px">`;
      outros.forEach(u => {
        const uSetor = setor.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        h += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:4px">
          <div style="flex:1;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.full_name)}</div>
          <button class="btn btn-sm btn-s" style="font-size:10px;padding:2px 7px;white-space:nowrap"
            onclick="doToggleLider(${u.id}, true, '${uSetor}')">★ Lider</button>
          <button class="btn btn-sm btn-d" style="font-size:10px;padding:2px 7px"
            onclick="doRemoveFromSetor(${u.id})">✕</button>
        </div>`;
      });
      h += `</div></div>`;
    }

    h += `</div>`;
  });

  const semSetor = users.filter(u => u.role !== 'admin_master' && (!u.department || !setores.includes(u.department)));
  if (semSetor.length) {
    h += `<div class="card" style="border-top:3px solid var(--border);padding:16px">
      <div style="margin-bottom:12px">
        <h3 style="font-size:15px;font-weight:700;color:var(--text-muted)">Sem Setor Atribuido</h3>
        <div style="font-size:12px;color:var(--text-muted)">${semSetor.length} usuario(s) aguardando alocacao</div>
      </div>
      <div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">`;
    semSetor.forEach(u => {
      h += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:4px">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.full_name)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${esc(u.email || '')}</div>
        </div>
        <select class="inp" style="font-size:11px;padding:3px 6px;max-width:150px" onchange="doQuickAssignSetor(${u.id}, this.value, this)">
          <option value="">Alocar a setor...</option>
          ${setores.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
        </select>
      </div>`;
    });
    h += `</div></div>`;
  }

  h += `</div>

  <!-- Setor name modal -->
  <div id="setorModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center">
    <div class="card" style="width:100%;max-width:400px;margin:20px">
      <h3 id="setorModalTitle" style="font-size:18px;font-weight:700;margin-bottom:16px">Novo Setor</h3>
      <input id="setorModalName" class="inp" type="text" placeholder="Nome do setor" onkeydown="if(event.key==='Enter')doSaveSetor()">
      <div id="setorModalError" style="color:var(--red);font-size:13px;margin-top:8px;display:none"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-g btn-sm" onclick="closeSetorModal()">Cancelar</button>
        <button class="btn btn-p btn-sm" onclick="doSaveSetor()">Salvar</button>
      </div>
    </div>
  </div>

  <!-- Add member to sector modal -->
  <div id="addToSetorModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center">
    <div class="card" style="width:100%;max-width:480px;margin:20px;max-height:90vh;overflow-y:auto">
      <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">Adicionar ao Setor</h3>
      <p id="addToSetorName" style="font-size:14px;color:var(--accent);font-weight:600;margin-bottom:14px"></p>
      <input class="inp" type="text" placeholder="Buscar usuario..." oninput="filterAddToSetor(this.value)" style="margin-bottom:10px">
      <div id="addToSetorList" style="max-height:320px;overflow-y:auto;border:1px solid var(--border);border-radius:6px"></div>
      <div style="display:flex;justify-content:flex-end;margin-top:14px">
        <button class="btn btn-g btn-sm" onclick="document.getElementById('addToSetorModal').style.display='none'">Fechar</button>
      </div>
    </div>
  </div>
  </div>`;

  return h;
}

// ═══ SETOR CRUD ═══
function openSetorModal(idx) {
  _setorModalIdx = idx;
  const modal = document.getElementById('setorModal');
  document.getElementById('setorModalTitle').textContent = idx === null ? 'Novo Setor' : 'Renomear Setor';
  const input = document.getElementById('setorModalName');
  input.value = idx !== null ? (SETORES_DINAMICOS[idx] || '') : '';
  document.getElementById('setorModalError').style.display = 'none';
  modal.style.display = 'flex';
  setTimeout(() => input.focus(), 50);
}

function closeSetorModal() {
  document.getElementById('setorModal').style.display = 'none';
}

async function doSaveSetor() {
  const name = document.getElementById('setorModalName').value.trim();
  const err = document.getElementById('setorModalError');
  if (!name) { err.textContent = 'Digite um nome para o setor.'; err.style.display = 'block'; return; }
  try {
    if (_setorModalIdx === null) {
      await API.createSetor(name);
      showToast('Setor criado!');
    } else {
      await API.updateSetor(_setorModalIdx, name);
      showToast('Setor renomeado!');
    }
    closeSetorModal();
    nav('admin-setores');
  } catch (e) { err.textContent = e.message; err.style.display = 'block'; }
}

async function doDeleteSetor(idx, name) {
  if (!confirm(`Excluir o setor "${name}"? Os usuarios deste setor ficarao sem setor atribuido.`)) return;
  try {
    await API.deleteSetor(idx);
    showToast('Setor excluido.');
    nav('admin-setores');
  } catch (e) { showToast(e.message, 'error'); }
}

// ═══ DIRECT MEMBER ACTIONS ═══
async function doToggleLider(userId, makeLider, setorName) {
  try {
    await API.assignUserSetor(userId, { setor: setorName, is_lider: makeLider });
    showToast(makeLider ? 'Usuario promovido a lider!' : 'Lider rebaixado a membro.');
    nav('admin-setores');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doRemoveFromSetor(userId) {
  if (!confirm('Remover este usuario do setor?')) return;
  try {
    await API.assignUserSetor(userId, { setor: null, is_lider: false });
    showToast('Usuario removido do setor.');
    nav('admin-setores');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doQuickAssignSetor(userId, setor, selectEl) {
  if (!setor) return;
  try {
    await API.assignUserSetor(userId, { setor, is_lider: false });
    showToast('Usuario alocado ao setor!');
    nav('admin-setores');
  } catch (e) {
    showToast(e.message, 'error');
    if (selectEl) selectEl.value = '';
  }
}

// ═══ ADD MEMBER TO SECTOR MODAL ═══
function openAddToSetorModal(setorName) {
  _addToSetorName = setorName;
  document.getElementById('addToSetorName').textContent = setorName;
  const eligible = _setoresPageUsers.filter(u =>
    u.role !== 'admin_master' && u.department !== setorName
  );
  document.getElementById('addToSetorList').innerHTML = _buildAddToSetorList(eligible);
  document.getElementById('addToSetorModal').style.display = 'flex';
}

function _buildAddToSetorList(users) {
  if (!users.length) {
    return `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Todos os usuarios ja estao neste setor.</div>`;
  }
  return users.map(u => `
    <div class="add-setor-row" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500">${esc(u.full_name)}</div>
        <div style="font-size:11px;color:var(--text-muted)">${esc(u.email || '')} · ${u.department ? `Setor atual: ${esc(u.department)}` : 'Sem setor'}</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button class="btn btn-sm btn-s" onclick="doAddToSetor(${u.id}, false)" style="font-size:11px">Membro</button>
        <button class="btn btn-sm" style="background:var(--orange,#f97316);color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer"
          onclick="doAddToSetor(${u.id}, true)">★ Lider</button>
      </div>
    </div>
  `).join('');
}

function filterAddToSetor(val) {
  const q = val.toLowerCase();
  document.querySelectorAll('#addToSetorList .add-setor-row').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

async function doAddToSetor(userId, isLider) {
  if (!_addToSetorName) return;
  try {
    await API.assignUserSetor(userId, { setor: _addToSetorName, is_lider: isLider });
    showToast(isLider ? 'Lider adicionado ao setor!' : 'Membro adicionado ao setor!');
    document.getElementById('addToSetorModal').style.display = 'none';
    nav('admin-setores');
  } catch (e) { showToast(e.message, 'error'); }
}

// openAssignSetorModal - still called from admin-users table
function openAssignSetorModal(userId) {
  const user = _setoresPageUsers.find(u => u.id === userId) || null;
  let modal = document.getElementById('assignSetorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'assignSetorModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div class="card" style="width:100%;max-width:420px;margin:20px">
    <h3 style="font-size:18px;font-weight:700;margin-bottom:4px">Atribuir Setor</h3>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">${user ? esc(user.full_name) + ' (' + esc(user.email || '') + ')' : 'Usuario #' + userId}</p>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">Setor</label>
        <select id="assignSetorSelect" class="sel">
          <option value="">Sem setor</option>
          ${SETORES_DINAMICOS.map(s => `<option value="${esc(s)}" ${user?.department === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <input id="assignSetorLider" type="checkbox" style="width:15px;height:15px" ${user?.role === 'lider' ? 'checked' : ''}>
        <label for="assignSetorLider" style="font-size:13px;cursor:pointer">É lider deste setor?</label>
      </div>
    </div>
    <div id="assignSetorError" style="color:var(--red);font-size:13px;margin-top:8px;display:none"></div>
    <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
      <button class="btn btn-g btn-sm" onclick="document.getElementById('assignSetorModal').style.display='none'">Cancelar</button>
      <button class="btn btn-p btn-sm" onclick="doAssignSetorLegacy(${userId})">Salvar</button>
    </div>
  </div>`;
  if (user) {
    // async load if cache is stale
  } else {
    Promise.all([API.getUsers(), API.getSetores()]).then(([users, setores]) => {
      _setoresPageUsers = users; SETORES_DINAMICOS = setores;
      openAssignSetorModal(userId);
    }).catch(() => {});
    return;
  }
  modal.style.display = 'flex';
}

async function doAssignSetorLegacy(userId) {
  const setor = document.getElementById('assignSetorSelect').value;
  const is_lider = document.getElementById('assignSetorLider').checked;
  const errEl = document.getElementById('assignSetorError');
  errEl.style.display = 'none';
  try {
    await API.assignUserSetor(userId, { setor: setor || null, is_lider });
    showToast('Setor atualizado!');
    document.getElementById('assignSetorModal').style.display = 'none';
    nav(APP.view);
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}


// ═══ RETRY CARD ═══
function renderRetryCard(e, view, viewData = {}) {
  const retryId = '_retry_' + Date.now();
  window[retryId] = viewData;
  return `<div class="content"><div class="card" style="text-align:center;padding:40px">
    <p style="color:var(--red);margin-bottom:8px">${esc(e.message)}</p>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Erro de conexao. Clique para tentar novamente.</p>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-p" onclick="API.clearCache();nav('${esc(view)}',window['${retryId}'])">Tentar novamente</button>
    </div>
  </div></div>`;
}

// ═══ INIT ═══
(async function init() {
  try {
    const [res, setores] = await Promise.all([
      API.me(),
      API.getSetores().catch(() => null),
    ]);
    APP.user = res.user;
    if (setores) SETORES_DINAMICOS = setores;
    nav('unavailability');
  } catch (e) {
    nav('login');
  }
})();
