// ═══ SHARED COMPONENTS ═══

function isMasterAdminRole(role) {
  return role === 'admin_master';
}

function isAdminRole(role) {
  return role === 'admin_master' || role === 'admin_editor' || role === 'admin_leitor';
}

function isEditorRole(role) {
  return role === 'admin_master' || role === 'admin_editor';
}

function isLiderRole(role) {
  return role === 'lider';
}

function canViewAllRole(role) {
  return isAdminRole(role) || role === 'socio';
}

function canApproveSomething(role) {
  return isEditorRole(role) || isLiderRole(role);
}

function renderNavbar(user) {
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const showAdminBtns = isAdminRole(user.role);
  const isMaster = isMasterAdminRole(user.role);

  return `
  <div class="navbar">
    <div class="navbar-left">
      <span class="nav-brand" style="cursor:pointer" onclick="nav('unavailability')">\u{1F4C5} Indisponibilidade</span>
      <span class="nav-role role-${esc(user.role)}">${esc(roleLabel)}</span>
    </div>
    <div class="navbar-right">
      <span class="user-info">\u{1F464} ${esc(user.full_name)}</span>
      ${showAdminBtns ? `<button class="btn btn-s btn-sm" onclick="nav('admin-users')">\u{1F465} Usuarios</button>` : ''}
      ${isMaster ? `<button class="btn btn-s btn-sm" onclick="nav('admin-setores')" style="background:var(--orange,#f97316)">\u{1F3DB} Setores</button>` : ''}
      ${isMaster ? `<button class="btn btn-s btn-sm" onclick="nav('admin-members')" style="background:var(--purple,#7c3aed)">\u{1F4CB} Membros</button>` : ''}
      <button class="btn btn-p btn-sm" onclick="nav('unavailability')">\u{1F4C5} Indisponibilidade</button>
      <button class="btn btn-g btn-sm" onclick="doLogout()" style="font-size:12px">\u{1F6AA} Sair</button>
    </div>
  </div>`;
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2500);
  setTimeout(() => t.remove(), 3000);
}

async function doLogout() {
  try {
    await API.logout();
  } catch (e) { /* ignore */ }
  APP.user = null;
  nav('login');
}

function formatDate(d) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function formatDateShort(d) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return d;
}
