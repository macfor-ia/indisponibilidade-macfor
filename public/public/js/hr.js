// ═══ HR DASHBOARD - GESTAO DE MEMBROS ═══

let _hrTabLoadId = 0;

// ─── RENDER PRINCIPAL ───
function renderHRDashboard(user) {
  return `<div class="content">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:16px" class="anim">
      <div>
        <h1 style="font-size:26px;font-weight:700;letter-spacing:-.5px">\u{1F465} Gestao de Membros</h1>
        <p style="color:var(--text-muted);margin-top:4px;font-size:14px">Cadastro e controle de colaboradores</p>
      </div>
    </div>
    <div id="hr-kpis" class="anim d1"></div>
    <div class="tabs anim d2">
      <button class="tab on" data-tab="membros" onclick="switchHRTab('membros')">\u{1F465} Membros</button>
      <button class="tab" data-tab="novo" onclick="switchHRTab('novo')">+ Novo Membro</button>
      <button class="tab" data-tab="painel" onclick="switchHRTab('painel')">\u{1F4CA} Painel</button>
    </div>
    <div id="hr-tab-content" class="anim d3"></div>
    <div id="hr-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;align-items:center;justify-content:center;padding:20px">
      <div id="hr-modal-box" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;position:relative"></div>
    </div>
  </div>`;
}

// ─── INIT ───
async function initHRDashboard() {
  loadHRKPIs();
  switchHRTab('membros');
}

// ─── KPI STRIP ───
async function loadHRKPIs() {
  const container = document.getElementById('hr-kpis');
  if (!container) return;
  try {
    const members = await API.getMembers();
    const byDept = {};
    members.forEach(m => {
      const d = m.department || 'Sem departamento';
      byDept[d] = (byDept[d] || 0) + 1;
    });
    const numDeptos = Object.keys(byDept).length;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px">
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Total de Membros</div>
          <div style="font-size:30px;font-weight:700;font-family:var(--mono);color:var(--accent)">${members.length}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Departamentos</div>
          <div style="font-size:30px;font-weight:700;font-family:var(--mono);color:var(--green)">${numDeptos}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Com Aprovador</div>
          <div style="font-size:30px;font-weight:700;font-family:var(--mono);color:var(--yellow)">${members.filter(m => m.report_to).length}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Sem Aprovador</div>
          <div style="font-size:30px;font-weight:700;font-family:var(--mono);color:var(--text-muted)">${members.filter(m => !m.report_to).length}</div>
        </div>
      </div>`;
  } catch (e) {
    container.innerHTML = '';
  }
}

// ─── TAB SWITCHING ───
function switchHRTab(tab) {
  const loadId = ++_hrTabLoadId;
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('on'));
  const tabEl = document.querySelector(`.tab[data-tab="${tab}"]`);
  if (tabEl) tabEl.classList.add('on');
  const container = document.getElementById('hr-tab-content');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px"><div class="spinner"></div></div>`;
  const guard = () => _hrTabLoadId === loadId;
  if (tab === 'membros') loadHRMembros(container, guard);
  else if (tab === 'novo') renderHRNovoMembro(container);
  else if (tab === 'painel') loadHRPainel(container, guard);
}

// ─── TAB: MEMBROS ───
async function loadHRMembros(container, guard) {
  try {
    const members = await API.getMembers();
    if (guard && !guard()) return;
    renderHRMembrosTable(container, members, '');
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

function renderHRMembrosTable(container, members, search) {
  const filtered = search
    ? members.filter(m =>
        (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.department || '').toLowerCase().includes(search.toLowerCase())
      )
    : members;

  let h = `
  <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center;flex-wrap:wrap">
    <input class="inp" id="hr-search" placeholder="\u{1F50D} Buscar por nome, email ou departamento..."
      style="flex:1;min-width:240px" value="${esc(search)}"
      oninput="hrSearchDebounce(this.value)">
    <span style="font-size:13px;color:var(--text-muted)">${filtered.length} de ${members.length} membros</span>
  </div>`;

  if (!filtered.length) {
    h += `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">Nenhum membro encontrado.</div>`;
    container.innerHTML = h;
    return;
  }

  h += `<div class="card" style="padding:0;overflow:hidden">
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:var(--surface-2)">
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Nome</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Email</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Departamento</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Area</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Reporta a</th>
            <th style="padding:12px 16px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Cota</th>
            <th style="padding:12px 16px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Acoes</th>
          </tr>
        </thead>
        <tbody>`;

  filtered.forEach(m => {
    const deptColor = DEPT_COLORS[m.department] || 'var(--accent)';
    h += `<tr style="border-bottom:1px solid var(--border)" id="hr-row-${m.id}">
      <td style="padding:11px 16px;font-weight:500;white-space:nowrap">${esc(m.name)}</td>
      <td style="padding:11px 16px;color:var(--text-muted);font-size:12px">${esc(m.email || '')}</td>
      <td style="padding:11px 16px">
        ${m.department ? `<span style="font-size:12px;padding:2px 8px;border-radius:4px;background:${deptColor}22;color:${deptColor}">${esc(m.department)}</span>` : `<span style="color:var(--text-dim)">-</span>`}
      </td>
      <td style="padding:11px 16px;color:var(--text-muted);font-size:12px">${esc(m.area || '-')}</td>
      <td style="padding:11px 16px;color:var(--text-muted);font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(m.report_to || '')}">${esc(m.report_to || '-')}</td>
      <td style="padding:11px 16px;text-align:center;font-family:var(--mono);font-weight:700;color:var(--accent)">${m.day_offs_quota ?? 0}</td>
      <td style="padding:11px 16px;text-align:center">
        <div style="display:flex;gap:6px;justify-content:center">
          <button class="btn btn-sm btn-s" onclick="openEditMember(${m.id})">\u270F Editar</button>
          <button class="btn btn-sm btn-d" onclick="confirmDeleteMember(${m.id}, '${esc(m.name)}')">\u{1F5D1} Excluir</button>
        </div>
      </td>
    </tr>`;
  });

  h += `</tbody></table></div></div>`;
  container.innerHTML = h;

  // Store members data for search
  window._hrMembersCache = members;
}

let _hrSearchTimer = null;
function hrSearchDebounce(val) {
  clearTimeout(_hrSearchTimer);
  _hrSearchTimer = setTimeout(() => {
    const container = document.getElementById('hr-tab-content');
    if (container && window._hrMembersCache) {
      renderHRMembrosTable(container, window._hrMembersCache, val);
    }
  }, 250);
}

// ─── EDITAR MEMBRO (modal) ───
async function openEditMember(id) {
  const members = window._hrMembersCache || (await API.getMembers());
  const m = members.find(x => x.id === id);
  if (!m) return;
  showHRModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h3 style="font-size:16px;font-weight:600">\u270F Editar Membro</h3>
      <button class="btn btn-sm btn-g" onclick="closeHRModal()">Fechar</button>
    </div>
    ${renderMemberForm(m)}
    <div id="hr-modal-error" style="color:var(--red);font-size:13px;margin-top:12px;display:none"></div>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-p" style="flex:1" onclick="submitEditMember(${id})">Salvar Alteracoes</button>
      <button class="btn btn-g" onclick="closeHRModal()">Cancelar</button>
    </div>
  `);
}

async function submitEditMember(id) {
  const data = readMemberForm();
  if (!data) return;
  const errEl = document.getElementById('hr-modal-error');
  errEl.style.display = 'none';
  const btn = document.querySelector('#hr-modal-box .btn-p');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    await API.updateMember(id, data);
    API.clearCache();
    closeHRModal();
    showToast('Membro atualizado com sucesso!');
    switchHRTab('membros');
    loadHRKPIs();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Salvar Alteracoes';
  }
}

// ─── EXCLUIR MEMBRO ───
function confirmDeleteMember(id, name) {
  showHRModal(`
    <div style="text-align:center;padding:12px 0">
      <div style="font-size:40px;margin-bottom:16px">\u{1F5D1}</div>
      <h3 style="font-size:16px;font-weight:600;margin-bottom:8px">Excluir Membro</h3>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:24px">
        Tem certeza que deseja excluir <strong style="color:var(--text)">${esc(name)}</strong>?
        <br><span style="font-size:12px">Esta acao nao pode ser desfeita.</span>
      </p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-d" onclick="doDeleteMember(${id})">\u{1F5D1} Sim, excluir</button>
        <button class="btn btn-g" onclick="closeHRModal()">Cancelar</button>
      </div>
    </div>
  `);
}

async function doDeleteMember(id) {
  const btn = document.querySelector('#hr-modal-box .btn-d');
  if (btn) { btn.disabled = true; btn.textContent = 'Excluindo...'; }
  try {
    await API.deleteMember(id);
    API.clearCache();
    closeHRModal();
    showToast('Membro excluido.');
    switchHRTab('membros');
    loadHRKPIs();
  } catch (e) {
    showToast(e.message, 'error');
    closeHRModal();
  }
}

// ─── TAB: NOVO MEMBRO ───
function renderHRNovoMembro(container) {
  container.innerHTML = `
    <div class="card" style="max-width:640px">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:20px">+ Novo Membro</h3>
      ${renderMemberForm(null)}
      <div id="hr-new-error" style="color:var(--red);font-size:13px;margin-top:12px;display:none"></div>
      <div id="hr-new-success" style="color:var(--green);font-size:13px;margin-top:12px;display:none"></div>
      <button class="btn btn-p" style="width:100%;margin-top:20px" id="hr-new-btn" onclick="submitNewMember()">Cadastrar Membro</button>
    </div>`;
}

async function submitNewMember() {
  const data = readMemberForm();
  if (!data) return;
  const errEl = document.getElementById('hr-new-error');
  const sucEl = document.getElementById('hr-new-success');
  errEl.style.display = 'none';
  sucEl.style.display = 'none';
  const btn = document.getElementById('hr-new-btn');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';
  try {
    await API.createMember(data);
    API.clearCache();
    sucEl.textContent = `Membro "${data.name}" cadastrado com sucesso!`;
    sucEl.style.display = 'block';
    // Limpar form
    ['mf-name','mf-email','mf-dept','mf-area','mf-reportto','mf-quota'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    loadHRKPIs();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
  btn.disabled = false;
  btn.textContent = 'Cadastrar Membro';
}

// ─── TAB: PAINEL ───
async function loadHRPainel(container, guard) {
  try {
    const members = await API.getMembers();
    if (guard && !guard()) return;

    const byDept = {};
    members.forEach(m => {
      const d = m.department || 'Sem departamento';
      if (!byDept[d]) byDept[d] = { count: 0, totalQuota: 0 };
      byDept[d].count++;
      byDept[d].totalQuota += m.day_offs_quota || 0;
    });

    const sorted = Object.entries(byDept).sort((a, b) => b[1].count - a[1].count);
    const maxCount = sorted[0]?.[1]?.count || 1;

    let h = `
    <div class="card" style="margin-bottom:24px">
      <h4 style="margin-bottom:20px">\u{1F3E2} Membros por Departamento</h4>
      <div style="display:flex;flex-direction:column;gap:14px">`;

    sorted.forEach(([dept, data]) => {
      const color = DEPT_COLORS[dept] || 'var(--accent)';
      const pct = Math.round((data.count / maxCount) * 100);
      h += `<div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:13px;font-weight:500;color:${color}">${esc(dept)}</span>
          <div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted)">
            <span><strong style="color:var(--text);font-family:var(--mono)">${data.count}</strong> membros</span>
            <span>Cota media: <strong style="color:var(--accent);font-family:var(--mono)">${data.count > 0 ? Math.round(data.totalQuota / data.count) : 0}d</strong></span>
          </div>
        </div>
        <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width .4s ease"></div>
        </div>
      </div>`;
    });

    h += `</div></div>`;

    // Tabela de membros sem aprovador
    const semAprovador = members.filter(m => !m.report_to);
    if (semAprovador.length) {
      h += `<div class="card" style="border-color:var(--yellow-border)">
        <h4 style="color:var(--yellow);margin-bottom:12px">\u26A0 ${semAprovador.length} Membros sem Aprovador Definido</h4>
        <div style="display:flex;flex-direction:column;gap:6px">`;
      semAprovador.forEach(m => {
        h += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm)">
          <span style="font-weight:500">${esc(m.name)}</span>
          <span style="font-size:12px;color:var(--text-muted)">${esc(m.department || 'Sem departamento')}</span>
        </div>`;
      });
      h += `</div></div>`;
    }

    // Top cotas
    const topQuota = [...members].sort((a, b) => (b.day_offs_quota || 0) - (a.day_offs_quota || 0)).slice(0, 10);
    h += `<div class="card" style="margin-top:24px">
      <h4 style="margin-bottom:16px">\u{1F3C6} Top 10 Maiores Cotas</h4>
      <div style="display:flex;flex-direction:column;gap:8px">`;
    topQuota.forEach((m, i) => {
      const deptColor = DEPT_COLORS[m.department] || 'var(--accent)';
      h += `<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm)">
        <span style="font-family:var(--mono);font-size:12px;color:var(--text-dim);min-width:24px">#${i + 1}</span>
        <span style="flex:1;font-weight:500">${esc(m.name)}</span>
        <span style="font-size:12px;padding:2px 8px;border-radius:4px;background:${deptColor}22;color:${deptColor}">${esc(m.department || '-')}</span>
        <span style="font-family:var(--mono);font-weight:700;color:var(--accent)">${m.day_offs_quota || 0}d</span>
      </div>`;
    });
    h += `</div></div>`;

    container.innerHTML = h;
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

// ─── FORM HELPER (reutilizado em novo e editar) ───
function renderMemberForm(m) {
  const v = (field) => m ? esc(m[field] || '') : '';
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:0">
      <div style="grid-column:1/-1">
        <label class="lbl">Nome completo *</label>
        <input class="inp" id="mf-name" value="${v('name')}" placeholder="Nome do colaborador">
      </div>
      <div style="grid-column:1/-1">
        <label class="lbl">Email corporativo *</label>
        <input class="inp" id="mf-email" type="email" value="${v('email')}" placeholder="nome@macfor.com.br">
      </div>
      <div>
        <label class="lbl">Departamento</label>
        <select class="sel" id="mf-dept">
          <option value="">Selecione...</option>
          ${DEPARTMENTS.map(d => `<option value="${d}" ${m && m.department === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="lbl">Area de atuacao</label>
        <select class="sel" id="mf-area">
          <option value="">Selecione...</option>
          ${(typeof MEMBER_AREAS !== 'undefined' ? MEMBER_AREAS : []).map(a => `<option value="${a}" ${m && m.area === a ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
      </div>
      <div style="grid-column:1/-1">
        <label class="lbl">Reporta a (nome do aprovador)</label>
        <input class="inp" id="mf-reportto" value="${v('report_to')}" placeholder="Nome do gestor direto (ex: Joao Silva)">
      </div>
      <div>
        <label class="lbl">Cota anual de dias</label>
        <input class="inp" id="mf-quota" type="number" min="0" value="${m ? (m.day_offs_quota ?? 0) : 0}" placeholder="0">
      </div>
    </div>`;
}

function readMemberForm() {
  const name = document.getElementById('mf-name')?.value.trim();
  const email = document.getElementById('mf-email')?.value.trim();
  const department = document.getElementById('mf-dept')?.value;
  const area = document.getElementById('mf-area')?.value;
  const report_to = document.getElementById('mf-reportto')?.value.trim();
  const day_offs_quota = parseInt(document.getElementById('mf-quota')?.value) || 0;

  const errId = document.getElementById('hr-modal-error') ? 'hr-modal-error' : 'hr-new-error';
  const errEl = document.getElementById(errId);

  if (!name) {
    if (errEl) { errEl.textContent = 'Nome obrigatorio.'; errEl.style.display = 'block'; }
    return null;
  }
  if (!email) {
    if (errEl) { errEl.textContent = 'Email obrigatorio.'; errEl.style.display = 'block'; }
    return null;
  }
  return { name, email, department: department || null, area: area || null, report_to: report_to || null, day_offs_quota };
}

// ─── MODAL HELPERS ───
function showHRModal(html) {
  const overlay = document.getElementById('hr-modal-overlay');
  const box = document.getElementById('hr-modal-box');
  if (!overlay || !box) return;
  box.innerHTML = html;
  overlay.style.display = 'flex';
  overlay.onclick = (e) => { if (e.target === overlay) closeHRModal(); };
}

function closeHRModal() {
  const overlay = document.getElementById('hr-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}
