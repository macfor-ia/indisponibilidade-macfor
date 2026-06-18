// ═══ AUTH PAGES ═══

function renderLogin() {
  return `
  <div class="login-page">
    <div class="login-box anim">
      <div class="login-header">
        <div style="font-size:48px;margin-bottom:16px">\u{1F4C5}</div>
        <h1>Indisponibilidade</h1>
        <p>Faca login para acessar o sistema</p>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div id="login-error" style="display:none;padding:10px 14px;background:var(--red-soft);color:var(--red);border-radius:var(--radius-sm);margin-bottom:16px;font-size:13px"></div>

        <div style="margin-bottom:16px">
          <label class="lbl">Email</label>
          <input class="inp" id="login-email" type="email" placeholder="seu@macfor.com.br">
        </div>
        <div style="margin-bottom:20px">
          <label class="lbl">Senha</label>
          <input class="inp" id="login-pass" type="password" placeholder="Sua senha">
        </div>
        <button class="btn btn-p" id="login-btn" style="width:100%;justify-content:center;padding:13px">
          Entrar
        </button>
      </div>

      <div style="text-align:center">
        <button class="btn btn-g" id="goto-register">Nao tem conta? Cadastre-se</button>
      </div>
    </div>
  </div>`;
}

function renderRegister(setores) {
  const opts = (setores || DEPARTMENTS).map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
  return `
  <div class="login-page">
    <div class="login-box anim" style="max-width:520px">
      <div class="login-header">
        <div style="font-size:48px;margin-bottom:16px">\u{1F4DD}</div>
        <h1>Cadastro</h1>
        <p>Crie sua conta. Um admin precisara aprovar seu acesso.</p>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div id="reg-error" style="display:none;padding:10px 14px;background:var(--red-soft);color:var(--red);border-radius:var(--radius-sm);margin-bottom:16px;font-size:13px"></div>
        <div id="reg-success" style="display:none;padding:10px 14px;background:var(--green-soft);color:var(--green);border-radius:var(--radius-sm);margin-bottom:16px;font-size:13px"></div>

        <div style="margin-bottom:16px">
          <label class="lbl">Nome Completo</label>
          <input class="inp" id="reg-name" placeholder="Seu nome completo">
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Email</label>
          <input class="inp" id="reg-email" type="email" placeholder="seu@macfor.com.br">
        </div>
        <div style="margin-bottom:16px">
          <label class="lbl">Senha (min. 6 caracteres)</label>
          <input class="inp" id="reg-pass" type="password" placeholder="Crie uma senha">
        </div>
        <div style="margin-bottom:20px">
          <label class="lbl">Setor</label>
          <select class="sel" id="reg-dept">
            <option value="">Selecione...</option>
            ${opts}
          </select>
        </div>

        <button class="btn btn-p" id="reg-btn" style="width:100%;justify-content:center;padding:13px">
          Solicitar Cadastro
        </button>
      </div>

      <div style="text-align:center">
        <button class="btn btn-g" id="goto-login">\u2190 Voltar ao Login</button>
      </div>
    </div>
  </div>`;
}

function bindLogin() {
  const btn = document.getElementById('login-btn');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-pass');
  const errDiv = document.getElementById('login-error');

  if (!btn) return;

  async function doLogin() {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) {
      errDiv.style.display = 'block';
      errDiv.textContent = 'Preencha email e senha.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Entrando...';
    try {
      await API.login(email, pass);
      nav('unavailability');
    } catch (e) {
      errDiv.style.display = 'block';
      errDiv.textContent = e.message;
    }
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }

  btn.onclick = doLogin;
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') passInput.focus(); });

  document.getElementById('goto-register').onclick = () => nav('register');
}

function bindRegister() {
  const btn = document.getElementById('reg-btn');
  if (!btn) return;

  btn.onclick = async () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const department = document.getElementById('reg-dept').value;
    const errDiv = document.getElementById('reg-error');
    const sucDiv = document.getElementById('reg-success');

    if (!name || !email || !pass || !department) {
      errDiv.style.display = 'block';
      sucDiv.style.display = 'none';
      errDiv.textContent = 'Preencha todos os campos.';
      return;
    }
    if (!email.toLowerCase().endsWith('@macfor.com.br')) {
      errDiv.style.display = 'block';
      sucDiv.style.display = 'none';
      errDiv.textContent = 'Apenas emails @macfor.com.br podem se registrar.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      const res = await API.register({ email, password: pass, full_name: name, department });
      errDiv.style.display = 'none';
      sucDiv.style.display = 'block';
      sucDiv.textContent = res.message;
    } catch (e) {
      errDiv.style.display = 'block';
      sucDiv.style.display = 'none';
      errDiv.textContent = e.message;
    }
    btn.disabled = false;
    btn.textContent = 'Solicitar Cadastro';
  };

  document.getElementById('goto-login').onclick = () => nav('login');
}
