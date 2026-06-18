// ═══ UNAVAILABILITY MANAGEMENT ═══

// ═══ MAIN RENDER ═══
function renderUnavailability(user) {
  const isAdmin = canViewAllRole(user.role);
  const isEditor = isEditorRole(user.role);
  const canSeePending = isAdmin || isLiderRole(user.role);

  let h = `<div class="content">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:16px" class="anim">
      <div>
        <h1 style="font-size:26px;font-weight:700;letter-spacing:-.5px">\u{1F4C5} Indisponibilidade de Agenda</h1>
        <p style="color:var(--text-muted);margin-top:4px;font-size:14px">Controle de periodos de descanso ou indisponibilidade</p>
      </div>
    </div>

    <!-- KPI Strip (admin only, filled async) -->
    ${isAdmin ? '<div id="unavail-kpis" class="anim d1"></div>' : ''}

    <!-- Active now timeline (admin only, filled async) -->
    ${isAdmin ? '<div id="unavail-timeline" class="anim d2"></div>' : ''}

    <div class="tabs anim ${isAdmin ? 'd3' : 'd1'}">
      ${isAdmin ? `<button class="tab on" data-tab="overview" onclick="switchUnavailTab('overview')">\u{1F4CA} Painel Geral</button>` : ''}
      ${canSeePending ? `<button class="tab" data-tab="pending" onclick="switchUnavailTab('pending')">\u23F3 Pedidos Aguardando Aprovacao</button>` : ''}
      ${isAdmin ? `<button class="tab" data-tab="active" onclick="switchUnavailTab('active')">\u{1F7E2} Quem Esta Indisponivel Agora</button>` : ''}
      <button class="tab ${!isAdmin ? 'on' : ''}" data-tab="form" onclick="switchUnavailTab('form')">+ Solicitar Indisponibilidade</button>
      <button class="tab" data-tab="mine" onclick="switchUnavailTab('mine')">Minhas Solicitacoes</button>
      ${isAdmin ? `<button class="tab" data-tab="all" onclick="switchUnavailTab('all')">\u{1F4CB} Historico Completo</button>` : ''}
    </div>

    <div id="unavail-tab-content" class="anim ${isAdmin ? 'd4' : 'd2'}"></div>
  </div>`;

  return h;
}

// ═══ INIT DASHBOARD (called after render) ═══
async function initUnavailDashboard() {
  const user = APP.user;
  const isAdmin = canViewAllRole(user.role);
  const canSeePending = isAdmin || isLiderRole(user.role);

  if (isAdmin) {
    loadUnavailKPIs();
    loadUnavailTimeline();
    switchUnavailTab('overview');
  } else if (canSeePending) {
    switchUnavailTab('pending');
  } else {
    switchUnavailTab('form');
  }
}

// ═══ KPI STRIP ═══
async function loadUnavailKPIs() {
  const container = document.getElementById('unavail-kpis');
  if (!container) return;

  try {
    const [all, pending, active] = await Promise.all([
      API.getUnavailability(),
      API.getPendingUnavailability(),
      API.getActiveUnavailability(),
    ]);

    const approved = all.filter(i => i.status === 'approved');
    const totalDays = approved.reduce((s, i) => s + (i.total_days || 0), 0);
    const deptCount = {};
    active.forEach(i => { deptCount[i.department] = (deptCount[i.department] || 0) + 1; });
    const topDept = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0];

    const today = new Date().toISOString().split('T')[0];
    const upcoming = approved.filter(i => i.start_date > today);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px">
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Ativos Agora</div>
          <div style="font-size:30px;font-weight:700;color:var(--green);font-family:var(--mono)">${active.length}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Pendentes</div>
          <div style="font-size:30px;font-weight:700;color:var(--yellow);font-family:var(--mono)">${pending.length}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Proximas</div>
          <div style="font-size:30px;font-weight:700;color:var(--accent);font-family:var(--mono)">${upcoming.length}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Total Registros</div>
          <div style="font-size:30px;font-weight:700;font-family:var(--mono)">${all.length}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Total Dias (Aprovados)</div>
          <div style="font-size:30px;font-weight:700;color:var(--orange);font-family:var(--mono)">${totalDays}</div>
        </div>
        ${topDept ? `<div class="card" style="padding:16px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Dept + Ausente</div>
          <div style="font-size:16px;font-weight:700;color:${DEPT_COLORS[topDept[0]] || 'var(--text)'}">${topDept[0]}</div>
          <div style="font-size:12px;color:var(--text-muted)">${topDept[1]} pessoa(s)</div>
        </div>` : ''}
      </div>`;
  } catch (e) {
    container.innerHTML = `<div style="font-size:13px;color:var(--text-muted)">Erro ao carregar KPIs.</div>`;
  }
}

// ═══ ACTIVE TIMELINE STRIP ═══
async function loadUnavailTimeline() {
  const container = document.getElementById('unavail-timeline');
  if (!container) return;

  try {
    const active = await API.getActiveUnavailability();
    if (!active.length) {
      container.innerHTML = '';
      return;
    }

    let h = `<div class="card" style="margin-bottom:24px;padding:20px">
      <h3 style="font-size:14px;margin-bottom:16px;color:var(--text-muted)">\u{1F4C5} Indisponiveis Agora</h3>
      <div style="display:flex;flex-wrap:wrap;gap:10px">`;

    active.forEach(item => {
      const deptColor = DEPT_COLORS[item.department] || 'var(--accent)';
      const daysLeft = Math.ceil((new Date(item.end_date) - new Date()) / (1000 * 60 * 60 * 24)) + 1;

      h += `<div class="unavail-person-chip" style="border-left:3px solid ${deptColor}">
        <div style="font-size:14px;font-weight:600">\u{1F464} ${esc(item.user_name || item.full_name)}</div>
        <div style="font-size:11px;color:var(--text-muted)">${item.department}</div>
        <div style="font-size:11px;color:var(--text-muted)">
          ${formatDateShort(item.start_date)} \u2192 ${formatDateShort(item.end_date)}
          <span style="color:${deptColor};font-weight:600;margin-left:4px">${daysLeft}d restantes</span>
        </div>
      </div>`;
    });

    h += `</div></div>`;
    container.innerHTML = h;
  } catch (e) {
    container.innerHTML = '';  // timeline is supplementary, fail silently
  }
}

// ═══ TAB SWITCHING ═══
let _tabLoadId = 0;

function switchUnavailTab(tab) {
  const loadId = ++_tabLoadId;
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('on'));
  const tabEl = document.querySelector(`.tab[data-tab="${tab}"]`);
  if (tabEl) tabEl.classList.add('on');
  const container = document.getElementById('unavail-tab-content');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px"><div class="spinner"></div></div>`;

  const guard = () => _tabLoadId === loadId;

  if (tab === 'overview') loadOverviewTab(container, guard);
  else if (tab === 'form') renderUnavailForm(container);
  else if (tab === 'mine') loadMyUnavailability(container, guard);
  else if (tab === 'active') loadActiveUnavailability(container, guard);
  else if (tab === 'all') loadAllUnavailability(container, guard);
  else if (tab === 'pending') loadPendingUnavailability(container, guard);
}

// ═══ OVERVIEW TAB (Admin Dashboard) ═══
async function loadOverviewTab(container, guard) {
  try {
    const [all, active, pending] = await Promise.all([
      API.getUnavailability(),
      API.getActiveUnavailability(),
      API.getPendingUnavailability(),
    ]);

    let h = '';

    // Pending approval alert
    if (pending.length) {
      h += `<div class="card" style="border-color:var(--yellow-border);margin-bottom:20px">
        <h4 style="color:var(--yellow);margin-bottom:12px">\u23F3 ${pending.length} Solicitacao(oes) Pendente(s)</h4>
        ${pending.slice(0, 5).map(item => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-size:14px;font-weight:500">${esc(item.user_name || item.full_name)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${item.department} \u00B7 ${formatDate(item.start_date)} a ${formatDate(item.end_date)} \u00B7 ${item.total_days} dias</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-green" onclick="approveUnavail(${item.id})">Aprovar</button>
              <button class="btn btn-sm btn-d" onclick="rejectUnavail(${item.id})">Rejeitar</button>
            </div>
          </div>
        `).join('')}
        ${pending.length > 5 ? `<div style="text-align:center;margin-top:10px">
          <button class="btn btn-sm btn-s" onclick="switchUnavailTab('pending')">Ver todas (${pending.length})</button>
        </div>` : ''}
      </div>`;
    }

    // Calendar
    const approvedAll = all.filter(i => i.status === 'approved' || i.status === 'pending');
    h += renderUnavailCalendar(approvedAll);

    // Department breakdown
    const deptStats = {};
    SETORES_DINAMICOS.forEach(d => { deptStats[d] = { total: 0, active: 0, days: 0 }; });
    all.filter(i => i.status === 'approved').forEach(i => {
      if (deptStats[i.department]) {
        deptStats[i.department].total++;
        deptStats[i.department].days += i.total_days || 0;
      }
    });
    active.forEach(i => {
      if (deptStats[i.department]) deptStats[i.department].active++;
    });

    const activeDepts = Object.entries(deptStats).filter(([, v]) => v.total > 0).sort((a, b) => b[1].active - a[1].active);

    if (activeDepts.length) {
      h += `<div style="margin-bottom:24px">
        <h3 class="section-title">\u{1F3E2} Indisponibilidade por Departamento</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">`;

      activeDepts.forEach(([dept, stats]) => {
        const color = DEPT_COLORS[dept] || 'var(--accent)';
        const barPct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
        h += `<div class="card" style="padding:16px;border-left:3px solid ${color}">
          <div style="font-size:14px;font-weight:600;margin-bottom:10px">${dept}</div>
          <div style="display:flex;gap:20px;font-size:13px">
            <div>
              <span style="color:var(--text-muted)">Ativos:</span>
              <strong style="color:${color};font-family:var(--mono)">${stats.active}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted)">Total:</span>
              <strong style="font-family:var(--mono)">${stats.total}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted)">Dias:</span>
              <strong style="font-family:var(--mono)">${stats.days}</strong>
            </div>
          </div>
          <div class="impact-bar"><div class="impact-fill" style="width:${barPct}%;background:${color}"></div></div>
        </div>`;
      });

      h += `</div></div>`;
    }

    // Upcoming
    const today = new Date().toISOString().split('T')[0];
    const upcoming = all.filter(i => i.status === 'approved' && i.start_date > today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    if (upcoming.length) {
      h += `<div style="margin-bottom:24px">
        <h3 class="section-title">\u{1F4C6} Proximas Indisponibilidades</h3>
        <div style="display:flex;flex-direction:column;gap:10px">`;

      upcoming.slice(0, 8).forEach(item => {
        const deptColor = DEPT_COLORS[item.department] || 'var(--accent)';
        const daysUntil = Math.ceil((new Date(item.start_date) - new Date()) / (1000 * 60 * 60 * 24));

        h += `<div class="card" style="padding:14px;border-left:3px solid ${deptColor}">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div>
              <span style="font-size:14px;font-weight:600">\u{1F464} ${esc(item.user_name || item.full_name)}</span>
              <span style="font-size:12px;color:var(--text-muted);margin-left:8px">${item.department}</span>
            </div>
            <div style="display:flex;gap:12px;align-items:center;font-size:13px">
              <span>${formatDate(item.start_date)} \u2192 ${formatDate(item.end_date)}</span>
              <span style="font-family:var(--mono);font-weight:600">${item.total_days}d</span>
              <span class="fb" style="background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent-border);font-size:11px">
                em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>`;
      });

      h += `</div></div>`;
    }

    // Recent history
    const recent = all.slice(0, 10);
    if (recent.length) {
      h += `<div style="margin-bottom:24px">
        <h3 style="font-size:16px;margin-bottom:14px">\u{1F552} Ultimas Solicitacoes</h3>
        <div class="card" style="padding:0;overflow:hidden">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:var(--surface);border-bottom:1px solid var(--border)">
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Prestador</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Departamento</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Tipo</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Periodo</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Dias</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Status</th>
              </tr>
            </thead>
            <tbody>`;

      recent.forEach(item => {
        const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
        h += `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:10px 16px;font-weight:500">${esc(item.user_name || item.full_name)}</td>
          <td style="padding:10px 16px;color:var(--text-muted)">${item.department}</td>
          <td style="padding:10px 16px;color:var(--text-muted)">${item.unavailability_type === 'prolongado' ? 'Prolongado' : 'Pontual'}</td>
          <td style="padding:10px 16px">${formatDateShort(item.start_date)} \u2192 ${formatDateShort(item.end_date)}</td>
          <td style="padding:10px 16px;text-align:center;font-family:var(--mono);font-weight:600">${item.total_days}</td>
          <td style="padding:10px 16px;text-align:center"><span class="fb ${st.cls}" style="font-size:11px">${st.icon} ${st.label}</span></td>
        </tr>`;
      });

      h += `</tbody></table></div></div>`;
    }

    if (!h) {
      h = `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
        Nenhum dado de indisponibilidade registrado ainda.
      </div>`;
    }

    if (guard && !guard()) return;
    container.innerHTML = h;

    // Load impact analysis asynchronously
    loadImpactAnalysis();
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

// ═══ IMPACT ANALYSIS ═══
async function loadImpactAnalysis() {
  // Impact analysis now focuses on department-level impact
  try {
    const impact = await API.getUnavailabilityImpact();
    if (!impact.users_on_leave || !impact.users_on_leave.length) return;

    // The impact data is already shown in the overview via department breakdown
  } catch (e) {
    // Supplementary — fail silently
  }
}

// ═══ FORM TAB ═══
function renderUnavailForm(container) {
  const user = APP.user;

  container.innerHTML = `
    <div class="card" style="max-width:640px">
      <h3 style="font-size:16px;margin-bottom:20px">\u{1F4DD} Solicitacao de Indisponibilidade</h3>

      <!-- Member info (quota, approver) loaded async -->
      <div id="unavail-member-info" style="margin-bottom:20px"></div>

      <div style="margin-bottom:18px">
        <label class="lbl">Nome completo do prestador</label>
        <input class="inp" id="unavail-name" value="${esc(user.full_name)}" readonly style="opacity:.7">
      </div>

      <div style="margin-bottom:18px">
        <label class="lbl">Tipo de indisponibilidade</label>
        <select class="sel" id="unavail-type">
          <option value="">Selecione...</option>
          ${UNAVAIL_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:18px">
        <label class="lbl">Departamento ou area de atuacao na Macfor</label>
        <select class="sel" id="unavail-dept">
          <option value="">Selecione...</option>
          ${SETORES_DINAMICOS.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
      </div>

      <div class="grid2" style="margin-bottom:18px">
        <div>
          <label class="lbl">Data de inicio da indisponibilidade</label>
          <input class="inp" type="date" id="unavail-start">
        </div>
        <div>
          <label class="lbl">Data prevista de retorno a agenda ativa</label>
          <input class="inp" type="date" id="unavail-end">
        </div>
      </div>

      <div style="margin-bottom:18px">
        <label class="lbl">Total de dias de indisponibilidade</label>
        <input class="inp" type="number" id="unavail-days" min="1" readonly style="opacity:.7">
      </div>

      <div id="unavail-quota-warn" style="display:none;padding:10px 14px;background:var(--yellow-soft,rgba(255,200,0,.1));border:1px solid var(--yellow-border,#a07800);border-radius:6px;font-size:13px;color:var(--yellow,#c89000);margin-bottom:14px"></div>

      <div id="unavail-error" style="color:var(--red);font-size:13px;margin-bottom:12px;display:none"></div>

      <button class="btn btn-p" id="unavail-submit" style="width:100%">Enviar Solicitacao</button>
    </div>`;

  // Load member info (quota, approver, used days)
  loadMemberInfo();

  // Auto-calculate days + live quota warning
  const startEl = document.getElementById('unavail-start');
  const endEl = document.getElementById('unavail-end');
  const daysEl = document.getElementById('unavail-days');
  let _memberQuotaInfo = null;
  API.getMyMemberInfo().then(info => { _memberQuotaInfo = info; }).catch(() => {});

  function calcDays() {
    if (startEl.value && endEl.value) {
      const s = new Date(startEl.value);
      const e = new Date(endEl.value);
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      daysEl.value = diff > 0 ? diff : '';
      // Live quota warning
      const warnEl = document.getElementById('unavail-quota-warn');
      if (warnEl && _memberQuotaInfo && diff > 0) {
        const remaining = _memberQuotaInfo.remaining_days || 0;
        if (diff > remaining && remaining > 0) {
          warnEl.textContent = `Atencao: voce tem ${remaining} dias restantes na cota. Esta solicitacao usa ${diff} dias.`;
          warnEl.style.display = 'block';
        } else if (remaining <= 0 && _memberQuotaInfo.quota > 0) {
          warnEl.textContent = `Cota esgotada. Esta solicitacao requer aprovacao especial.`;
          warnEl.style.display = 'block';
        } else {
          warnEl.style.display = 'none';
        }
      }
    }
  }
  startEl.addEventListener('change', calcDays);
  endEl.addEventListener('change', calcDays);

  // Submit
  document.getElementById('unavail-submit').onclick = async () => {
    const errEl = document.getElementById('unavail-error');
    errEl.style.display = 'none';

    const type = document.getElementById('unavail-type').value;
    const dept = document.getElementById('unavail-dept').value;
    const start = startEl.value;
    const end = endEl.value;
    const days = daysEl.value;

    if (!type || !dept || !start || !end || !days) {
      errEl.textContent = 'Preencha todos os campos.';
      errEl.style.display = 'block';
      return;
    }

    if (parseInt(days) < 1) {
      errEl.textContent = 'Data de retorno deve ser posterior a data de inicio.';
      errEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('unavail-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      await API.createUnavailability({
        unavailability_type: type,
        department: dept,
        start_date: start,
        end_date: end,
        total_days: parseInt(days),
      });
      showToast('Solicitacao enviada com sucesso!');
      if (canViewAllRole(APP.user.role)) {
        loadUnavailKPIs();
        loadUnavailTimeline();
      }
      switchUnavailTab('mine');
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Enviar Solicitacao';
    }
  };
}

// ═══ MY REQUESTS TAB ═══
async function loadMyUnavailability(container, guard) {
  try {
    const data = await API.getMyUnavailability();
    if (guard && !guard()) return;
    if (!data.length) {
      container.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
        Voce nao tem solicitacoes de indisponibilidade.
      </div>`;
      return;
    }
    container.innerHTML = renderUnavailList(data, false);
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

// ═══ ACTIVE TAB ═══
async function loadActiveUnavailability(container, guard) {
  try {
    const data = await API.getActiveUnavailability();
    if (guard && !guard()) return;
    if (!data.length) {
      container.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
        Nenhuma indisponibilidade ativa no momento.
      </div>`;
      return;
    }
    container.innerHTML = `<div style="margin-bottom:16px">
      <h3 style="font-size:16px;margin-bottom:4px">\u{1F7E2} Pessoas Indisponiveis Agora</h3>
      <p style="font-size:13px;color:var(--text-muted)">Periodos aprovados que incluem a data de hoje</p>
    </div>` + renderUnavailList(data, false, true);
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

// ═══ ALL TAB ═══
let _allUnavailData = [];
async function loadAllUnavailability(container, guard) {
  try {
    const data = await API.getUnavailability();
    if (guard && !guard()) return;
    _allUnavailData = data;
    if (!data.length) {
      container.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
        Nenhuma solicitacao registrada.
      </div>`;
      return;
    }
    const depts = [...new Set(data.map(i => i.department).filter(Boolean))].sort();
    container.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm btn-s all-sf on" data-status="" onclick="filterAllUnavail(this,'')">Todos</button>
          <button class="btn btn-sm btn-s all-sf" data-status="pending" onclick="filterAllUnavail(this,'pending')">⏳ Pendente</button>
          <button class="btn btn-sm btn-s all-sf" data-status="approved" onclick="filterAllUnavail(this,'approved')">✅ Aprovado</button>
          <button class="btn btn-sm btn-s all-sf" data-status="rejected" onclick="filterAllUnavail(this,'rejected')">❌ Rejeitado</button>
        </div>
        <select id="all-dept-filter" class="inp" style="max-width:200px;font-size:13px" onchange="filterAllUnavailDept(this.value)">
          <option value="">Todos os setores</option>
          ${depts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-s" onclick="exportUnavailCSV()" style="margin-left:auto">⬇ Exportar CSV</button>
      </div>
      <div id="all-unavail-list">${renderUnavailList(data, false, true)}</div>`;
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

let _allStatusFilter = '';
let _allDeptFilter = '';
function filterAllUnavail(btn, status) {
  _allStatusFilter = status;
  document.querySelectorAll('.all-sf').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  _renderAllList();
}
function filterAllUnavailDept(dept) {
  _allDeptFilter = dept;
  _renderAllList();
}
function _renderAllList() {
  let filtered = _allUnavailData;
  if (_allStatusFilter) filtered = filtered.filter(i => i.status === _allStatusFilter);
  if (_allDeptFilter) filtered = filtered.filter(i => i.department === _allDeptFilter);
  const el = document.getElementById('all-unavail-list');
  if (!el) return;
  if (!filtered.length) {
    el.innerHTML = `<div class="card" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum resultado para os filtros selecionados.</div>`;
    return;
  }
  el.innerHTML = renderUnavailList(filtered, false, true);
}
function exportUnavailCSV() {
  let filtered = _allUnavailData;
  if (_allStatusFilter) filtered = filtered.filter(i => i.status === _allStatusFilter);
  if (_allDeptFilter) filtered = filtered.filter(i => i.department === _allDeptFilter);
  const headers = ['ID','Colaborador','Email','Setor','Tipo','Inicio','Fim','Dias','Status','Criado em'];
  const rows = filtered.map(i => [
    i.id,
    i.user_name || '',
    i.user_email || '',
    i.department || '',
    i.unavailability_type || '',
    i.start_date || '',
    i.end_date || '',
    i.total_days || '',
    i.status || '',
    (i.created_at || '').slice(0, 10),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'indisponibilidades.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══ PENDING TAB ═══
async function loadPendingUnavailability(container, guard) {
  try {
    const data = await API.getPendingUnavailability();
    if (guard && !guard()) return;
    if (!data.length) {
      container.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
        Nenhuma solicitacao pendente de aprovacao.
      </div>`;
      return;
    }
    const canApprove = isEditorRole(APP.user.role) || isLiderRole(APP.user.role);
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <h3 style="font-size:16px;margin:0">⏳ Aguardando Aprovacao <span style="font-size:13px;color:var(--text-muted);font-weight:400">(${data.length})</span></h3>
        ${canApprove ? `<div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm btn-s" onclick="toggleSelectAllPending()">Selecionar todos</button>
          <button class="btn btn-sm btn-green" onclick="batchApprovePending()">Aprovar selecionados</button>
          <button class="btn btn-sm btn-d" onclick="batchRejectPending()">Rejeitar selecionados</button>
        </div>` : ''}
      </div>
      <div id="pending-list">${renderUnavailList(data, canApprove, true, true)}</div>`;
  } catch (e) {
    container.innerHTML = `<div class="card" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

function toggleSelectAllPending() {
  const cbs = document.querySelectorAll('.pending-cb');
  const anyUnchecked = [...cbs].some(cb => !cb.checked);
  cbs.forEach(cb => { cb.checked = anyUnchecked; });
}

async function batchApprovePending() {
  const ids = [...document.querySelectorAll('.pending-cb:checked')].map(cb => parseInt(cb.value));
  if (!ids.length) { showToast('Nenhuma solicitacao selecionada.', 'error'); return; }
  if (!confirm(`Aprovar ${ids.length} solicitacao(oes)?`)) return;
  let ok = 0, fail = 0;
  await Promise.all(ids.map(id => API.approveUnavailability(id).then(() => ok++).catch(() => fail++)));
  showToast(`${ok} aprovada(s)${fail ? `, ${fail} falha(s)` : ''}.`);
  loadUnavailKPIs();
  loadUnavailTimeline();
  switchUnavailTab('pending');
}

async function batchRejectPending() {
  const ids = [...document.querySelectorAll('.pending-cb:checked')].map(cb => parseInt(cb.value));
  if (!ids.length) { showToast('Nenhuma solicitacao selecionada.', 'error'); return; }
  if (!confirm(`Rejeitar ${ids.length} solicitacao(oes)?`)) return;
  let ok = 0, fail = 0;
  await Promise.all(ids.map(id => API.rejectUnavailability(id).then(() => ok++).catch(() => fail++)));
  showToast(`${ok} rejeitada(s)${fail ? `, ${fail} falha(s)` : ''}.`);
  loadUnavailKPIs();
  switchUnavailTab('pending');
}

// ═══ LIST RENDERER ═══
function renderUnavailList(items, showActions, showUser, showCheckbox) {
  let h = `<div style="display:flex;flex-direction:column;gap:12px">`;

  items.forEach(item => {
    const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
    const today = new Date().toISOString().split('T')[0];
    const isActive = item.status === 'approved' && item.start_date <= today && item.end_date >= today;
    const deptColor = DEPT_COLORS[item.department] || 'var(--accent)';

    h += `<div class="card unavail-card ${isActive ? 'unavail-active' : ''}" style="border-left:3px solid ${deptColor}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
        ${showCheckbox ? `<div style="padding-top:2px"><input type="checkbox" class="pending-cb" value="${item.id}" style="width:16px;height:16px;cursor:pointer"></div>` : ''}
        <div style="flex:1;min-width:200px">
          ${showUser ? `<div style="font-size:16px;font-weight:600;margin-bottom:4px">👤 ${esc(item.user_name || item.full_name)}</div>` : ''}
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">
            ${showUser && item.user_email ? esc(item.user_email) + ' · ' : ''}
            ${item.department}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <span class="fb ${st.cls}">${st.icon} ${st.label}</span>
            <span class="fb" style="background:var(--surface);border:1px solid var(--border);color:var(--text-muted)">
              ${item.unavailability_type === 'prolongado' ? '📆 Prolongado' : '📌 Pontual'}
            </span>
            ${isActive ? '<span class="fb fb-green">🟢 Ativo agora</span>' : ''}
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,auto);gap:16px;font-size:13px;margin-top:10px">
            <div>
              <span style="color:var(--text-muted)">Inicio:</span>
              <strong>${formatDate(item.start_date)}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted)">Retorno:</span>
              <strong>${formatDate(item.end_date)}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted)">Dias:</span>
              <strong style="font-family:var(--mono)">${item.total_days}</strong>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          ${showActions ? `
            <button class="btn btn-sm btn-green" onclick="approveUnavail(${item.id})">Aprovar</button>
            <button class="btn btn-sm btn-d" onclick="rejectUnavail(${item.id})">Rejeitar</button>
          ` : ''}
          ${(item.status === 'pending' && (item.user_id === APP.user.id || isEditorRole(APP.user.role))) ? `
            <button class="btn btn-sm btn-s" onclick="editUnavail(${item.id}, '${item.start_date}', '${item.end_date}', '${item.unavailability_type}', '${item.department}')">Editar</button>
            <button class="btn btn-sm btn-d" onclick="deleteUnavail(${item.id})">Cancelar</button>
          ` : ''}
        </div>
      </div>
    </div>`;
  });

  h += `</div>`;
  return h;
}

// ═══ CALENDAR ═══
function renderUnavailCalendar(items) {
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  const dateMap = buildDateMap(items);
  const calId = 'unavail-cal-' + Date.now();

  let h = `<div class="card" style="margin-bottom:24px;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:16px;margin:0">\u{1F4C5} Calendario de Indisponibilidade</h3>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-sm btn-s" id="${calId}-prev" onclick="calNav('${calId}',-1)">\u2190</button>
        <span id="${calId}-label" style="font-size:14px;font-weight:600;min-width:140px;text-align:center"></span>
        <button class="btn btn-sm btn-s" id="${calId}-next" onclick="calNav('${calId}',1)">\u2192</button>
      </div>
    </div>
    <div id="${calId}" data-month="${currentMonth}" data-year="${currentYear}"></div>
    <div style="display:flex;gap:16px;margin-top:14px;font-size:11px;color:var(--text-muted);flex-wrap:wrap">
      <span>\u{1F7E5} Indisponivel (aprovado)</span>
      <span>\u{1F7E7} Pendente de aprovacao</span>
      <span style="color:var(--text-dim)">Passe o mouse sobre um dia marcado para ver quem</span>
    </div>
  </div>`;

  setTimeout(() => {
    window._unavailDateMap = dateMap;
    drawCalendar(calId, currentYear, currentMonth, dateMap);
  }, 50);

  return h;
}

function buildDateMap(items) {
  const map = {};
  items.forEach(item => {
    const start = new Date(item.start_date + 'T00:00:00');
    const end = new Date(item.end_date + 'T00:00:00');
    const name = item.user_name || item.full_name;
    const status = item.status;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push({ name, status, department: item.department });
    }
  });
  return map;
}

function drawCalendar(calId, year, month, dateMap) {
  const container = document.getElementById(calId);
  if (!container) return;

  const label = document.getElementById(calId + '-label');
  const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  if (label) label.textContent = `${monthNames[month]} ${year}`;

  container.dataset.month = month;
  container.dataset.year = year;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const today = new Date().toISOString().split('T')[0];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  let h = `<div class="cal-grid">`;

  dayNames.forEach(dn => {
    h += `<div class="cal-header">${dn}</div>`;
  });

  for (let i = 0; i < startDow; i++) {
    h += `<div class="cal-cell cal-empty"></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const people = dateMap[dateStr] || [];
    const isToday = dateStr === today;
    const hasApproved = people.some(p => p.status === 'approved');
    const hasPending = people.some(p => p.status === 'pending');

    let cls = 'cal-cell';
    if (isToday) cls += ' cal-today';
    if (hasApproved) cls += ' cal-unavail';
    else if (hasPending) cls += ' cal-pending';

    let tooltip = '';
    if (people.length) {
      const names = people.map(p => {
        const icon = p.status === 'approved' ? '\u{1F534}' : '\u{1F7E0}';
        return `${icon} ${esc(p.name)} (${esc(p.department)})`;
      });
      tooltip = names.join('&#10;');
    }

    h += `<div class="${cls}" ${tooltip ? `title="${tooltip}"` : ''}>
      <span class="cal-day">${d}</span>
      ${people.length ? `<span class="cal-dot">${people.length}</span>` : ''}
    </div>`;
  }

  h += `</div>`;
  container.innerHTML = h;
}

function calNav(calId, dir) {
  const container = document.getElementById(calId);
  if (!container) return;
  let month = parseInt(container.dataset.month);
  let year = parseInt(container.dataset.year);
  month += dir;
  if (month < 0) { month = 11; year--; }
  if (month > 11) { month = 0; year++; }
  drawCalendar(calId, year, month, window._unavailDateMap || {});
}

// ═══ EDIT PENDING REQUEST ═══
function editUnavail(id, startDate, endDate, type, dept) {
  let modal = document.getElementById('editUnavailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editUnavailModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2000;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div class="card" style="width:100%;max-width:460px;margin:20px">
    <h3 style="font-size:16px;font-weight:700;margin-bottom:20px">Editar Solicitacao</h3>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="grid2">
        <div>
          <label class="lbl">Data de inicio</label>
          <input class="inp" type="date" id="edit-unavail-start" value="${startDate}">
        </div>
        <div>
          <label class="lbl">Data de retorno</label>
          <input class="inp" type="date" id="edit-unavail-end" value="${endDate}">
        </div>
      </div>
      <div>
        <label class="lbl">Total de dias</label>
        <input class="inp" type="number" id="edit-unavail-days" readonly style="opacity:.7">
      </div>
      <div>
        <label class="lbl">Tipo</label>
        <select class="sel" id="edit-unavail-type">
          ${UNAVAIL_TYPES.map(t => `<option value="${t.value}" ${t.value === type ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="edit-unavail-error" style="color:var(--red);font-size:13px;margin-top:12px;display:none"></div>
    <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
      <button class="btn btn-g btn-sm" onclick="document.getElementById('editUnavailModal').style.display='none'">Cancelar</button>
      <button class="btn btn-p btn-sm" onclick="doEditUnavail(${id})">Salvar alteracoes</button>
    </div>
  </div>`;
  modal.style.display = 'flex';

  function calcEditDays() {
    const s = document.getElementById('edit-unavail-start').value;
    const e = document.getElementById('edit-unavail-end').value;
    if (s && e) {
      const diff = Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1;
      document.getElementById('edit-unavail-days').value = diff > 0 ? diff : '';
    }
  }
  document.getElementById('edit-unavail-start').addEventListener('change', calcEditDays);
  document.getElementById('edit-unavail-end').addEventListener('change', calcEditDays);
  calcEditDays();
}

async function doEditUnavail(id) {
  const start_date = document.getElementById('edit-unavail-start').value;
  const end_date = document.getElementById('edit-unavail-end').value;
  const unavailability_type = document.getElementById('edit-unavail-type').value;
  const errEl = document.getElementById('edit-unavail-error');
  if (!start_date || !end_date) {
    errEl.textContent = 'Datas sao obrigatorias.'; errEl.style.display = 'block'; return;
  }
  try {
    await API.updateUnavailability(id, { start_date, end_date, unavailability_type });
    document.getElementById('editUnavailModal').style.display = 'none';
    showToast('Solicitacao atualizada!');
    switchUnavailTab('mine');
  } catch (e) {
    errEl.textContent = e.message; errEl.style.display = 'block';
  }
}

// ═══ ACTIONS ═══
async function approveUnavail(id) {
  try {
    await API.approveUnavailability(id);
    showToast('Solicitacao aprovada!');
    loadUnavailKPIs();
    loadUnavailTimeline();
    switchUnavailTab('pending');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function rejectUnavail(id) {
  try {
    await API.rejectUnavailability(id);
    showToast('Solicitacao rejeitada.');
    loadUnavailKPIs();
    switchUnavailTab('pending');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteUnavail(id) {
  if (!confirm('Cancelar esta solicitacao de indisponibilidade?')) return;
  try {
    await API.deleteUnavailability(id);
    showToast('Solicitacao cancelada.');
    if (canViewAllRole(APP.user.role)) {
      loadUnavailKPIs();
      loadUnavailTimeline();
    }
    switchUnavailTab('mine');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ═══ MEMBER INFO (quota, approver) ═══
async function loadMemberInfo() {
  const container = document.getElementById('unavail-member-info');
  if (!container) return;

  try {
    const info = await API.getMyMemberInfo();
    if (!info || !info.member) {
      container.innerHTML = `<div style="padding:12px 16px;background:var(--yellow-soft);border:1px solid var(--yellow-border);border-radius:var(--radius-sm);font-size:13px;color:var(--yellow)">
        Seu email nao foi encontrado no cadastro de membros. Preencha manualmente os campos abaixo.
      </div>`;
      return;
    }

    const quotaColor = info.remaining_days <= 0 ? 'var(--red)' : info.remaining_days <= 5 ? 'var(--orange)' : 'var(--green)';
    const pctUsed = info.quota > 0 ? Math.round((info.used_days / info.quota) * 100) : 0;

    let h = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
      <div style="padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Cota Anual</div>
        <div style="font-size:24px;font-weight:700;font-family:var(--mono)">${info.quota} <span style="font-size:13px;font-weight:400;color:var(--text-muted)">dias</span></div>
      </div>
      <div style="padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Dias Usados</div>
        <div style="font-size:24px;font-weight:700;font-family:var(--mono);color:var(--orange)">${info.used_days}</div>
        <div class="impact-bar" style="margin-top:6px"><div class="impact-fill" style="width:${Math.min(pctUsed, 100)}%;background:${quotaColor}"></div></div>
      </div>
      <div style="padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Dias Restantes</div>
        <div style="font-size:24px;font-weight:700;font-family:var(--mono);color:${quotaColor}">${info.remaining_days}</div>
      </div>`;

    if (info.approver) {
      const approvers = Array.isArray(info.approver) ? info.approver : [info.approver];
      h += `<div style="padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Aprovador${approvers.length > 1 ? 'es' : ''}</div>
        ${approvers.map(a => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:14px;font-weight:600">\u{1F464} ${esc(a.name)}</span>
          </div>
          ${a.email ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${esc(a.email)}</div>` : ''}
        `).join('')}
      </div>`;
    }

    h += `</div>`;

    if (info.remaining_days <= 0 && info.quota > 0) {
      h += `<div style="margin-top:12px;padding:10px 14px;background:var(--red-soft);border:1px solid var(--red);border-radius:var(--radius-sm);font-size:13px;color:var(--red)">
        Voce ja utilizou toda sua cota de ${info.quota} dias. Solicitacoes adicionais ficarao pendentes de aprovacao especial.
      </div>`;
    }

    container.innerHTML = h;

    // Pre-fill department from user session or member area (direct match against dynamic setores)
    const deptSelect = document.getElementById('unavail-dept');
    if (deptSelect) {
      const userDept = APP.user?.department;
      const memberArea = info.member?.area;
      const candidates = [userDept, memberArea].filter(Boolean);
      for (const cand of candidates) {
        const exact = Array.from(deptSelect.options).find(o => o.value === cand);
        if (exact) { exact.selected = true; break; }
        // case-insensitive fallback
        const ci = Array.from(deptSelect.options).find(o => o.value.toLowerCase() === cand.toLowerCase());
        if (ci) { ci.selected = true; break; }
      }
    }
  } catch (e) {
    container.innerHTML = `<div style="padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;color:var(--text-muted)">
      Nao foi possivel carregar suas informacoes de cota. Tente recarregar a pagina.
    </div>`;
  }
}
