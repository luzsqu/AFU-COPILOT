import { state } from './state.js';
import { guardar } from './storage.js';
import { navigate } from './router.js';
import { toast } from './toast.js';
import { esc, showFieldError, clearFieldError } from './utils.js';

function hash(s) { return btoa(unescape(encodeURIComponent(s))); }

export function renderLogin() {
  const hasCuenta = !!state.usuario;
  const view = document.getElementById('view');

  view.innerHTML = `
<div class="auth-page">

  <!-- ── HERO PANEL ────────────────────────────── -->
  <div class="auth-hero">
    <div class="auth-hero-brand">
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
        <rect width="46" height="46" rx="14" fill="rgba(255,255,255,.18)"/>
        <path d="M12 15h22M12 22.5h14M12 30h17" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="33" cy="30" r="6.5" fill="rgba(255,255,255,.95)"/>
        <path d="M30.5 30l1.5 1.5 3-3" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div>
        <div class="auth-hero-app-name">Analista HU</div>
        <div class="auth-hero-app-sub">ISTQB Foundation Level</div>
      </div>
    </div>

    <div class="auth-hero-content">
      <h1 class="auth-hero-headline">Transforma requisitos<br>en historias perfectas</h1>
      <p class="auth-hero-body">Crea historias de usuario estructuradas, genera criterios Gherkin con IA y exporta directamente a Jira.</p>
    </div>

    <ul class="auth-hero-features">
      <li>
        <span class="ahf-icon">✓</span>
        <span>Historias ISTQB bien estructuradas</span>
      </li>
      <li>
        <span class="ahf-icon">✓</span>
        <span>Criterios Gherkin generados con IA</span>
      </li>
      <li>
        <span class="ahf-icon">✓</span>
        <span>Test cases, DoR y DoD automáticos</span>
      </li>
      <li>
        <span class="ahf-icon">✓</span>
        <span>Exportación JSON lista para Jira</span>
      </li>
    </ul>
  </div>

  <!-- ── FORM PANEL ────────────────────────────── -->
  <div class="auth-form-panel">
    <div class="auth-form-inner">
      <div class="auth-form-header">
        <h2 class="auth-title">${hasCuenta ? 'Bienvenido de nuevo' : 'Crear tu cuenta'}</h2>
        <p class="auth-desc">${hasCuenta
          ? 'Ingresa tus credenciales para continuar.'
          : 'Aplicativo local — los datos se guardan solo en este navegador.'}</p>
      </div>

      <form id="form-auth" novalidate>
        <div class="form-group">
          <label class="form-label" for="auth-user">Usuario</label>
          <input type="text" id="auth-user" class="form-control" placeholder="tu usuario" autocomplete="username" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="auth-pass">Contraseña</label>
          <div class="input-wrap">
            <input type="password" id="auth-pass" class="form-control" placeholder="••••••••" autocomplete="current-password" required>
            <button type="button" class="input-toggle" id="btn-toggle-pass" aria-label="Mostrar contraseña">👁</button>
          </div>
        </div>
        <button type="submit" class="btn btn-accent btn-full" style="padding: .625rem 1rem; font-size: .9rem;">
          ${hasCuenta ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      ${hasCuenta ? `<button class="auth-link" id="btn-reset-account">¿Olvidaste tu contraseña?</button>` : ''}
      <div id="auth-error" class="auth-error hidden"></div>
    </div>
  </div>

</div>`;

  document.getElementById('btn-toggle-pass').addEventListener('click', () => {
    const input = document.getElementById('auth-pass');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Feedback inmediato en blur
  const userEl = document.getElementById('auth-user');
  const passEl = document.getElementById('auth-pass');

  userEl?.addEventListener('blur',  () => { if (!userEl.value.trim()) showFieldError(userEl, 'Ingresá tu usuario'); });
  userEl?.addEventListener('input', () => { if (userEl.value.trim())  clearFieldError(userEl); hideAuthError(); });
  passEl?.addEventListener('blur',  () => { if (!passEl.value)        showFieldError(passEl, 'Ingresá tu contraseña'); });
  passEl?.addEventListener('input', () => { if (passEl.value)         clearFieldError(passEl); hideAuthError(); });

  document.getElementById('form-auth').addEventListener('submit', e => {
    e.preventDefault();
    const user = userEl.value.trim();
    const pass = passEl.value;

    // Mostrar errores en campos vacíos
    let hasError = false;
    if (!user) { showFieldError(userEl, 'Ingresá tu usuario');    hasError = true; }
    if (!pass) { showFieldError(passEl, 'Ingresá tu contraseña'); hasError = true; }
    if (hasError) return;

    if (!hasCuenta) {
      state.usuario = { username: user, passwordHash: hash(pass) };
      guardar();
      navigate('/projects');
    } else {
      if (state.usuario.username !== user || state.usuario.passwordHash !== hash(pass)) {
        showFieldError(passEl, 'Usuario o contraseña incorrectos');
        showAuthError('Usuario o contraseña incorrectos');
        passEl.focus();
        return;
      }
      navigate(state.proyectoActivoId ? '/dashboard' : '/projects');
    }
  });

  if (hasCuenta) {
    document.getElementById('btn-reset-account').addEventListener('click', () => {
      showConfirm('¿Borrar credenciales?', 'Se eliminarán el usuario y contraseña guardados. No se borran las historias.', () => {
        state.usuario = null;
        guardar();
        navigate('/login');
      });
    });
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideAuthError() {
  document.getElementById('auth-error')?.classList.add('hidden');
}

export function logout() {
  state.usuario          = null;
  state.proyectoActivoId = null;
  guardar();
  navigate('/login');
}

export function showConfirm(titulo, msg, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-title').textContent = titulo;
  document.getElementById('confirm-msg').textContent = msg;
  modal.classList.remove('hidden');
  const btnOk = document.getElementById('confirm-ok');
  const btnCancel = document.getElementById('confirm-cancel');
  const cleanup = () => { modal.classList.add('hidden'); btnOk.replaceWith(btnOk.cloneNode(true)); };
  document.getElementById('confirm-ok').addEventListener('click', () => { cleanup(); onConfirm(); }, { once: true });
  btnCancel.addEventListener('click', cleanup, { once: true });
}
