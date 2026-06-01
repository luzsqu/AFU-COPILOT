const ICONS = {
  success: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#16a34a"/><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  error:   `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#dc2626"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  warn:    `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2L1.5 13.5h13L8 2z" fill="#d97706"/><path d="M8 6.5v3M8 11.5v.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  info:    `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#0284c7"/><path d="M8 7.5v4M8 5.5v.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

const DURATION = { success: 5500, error: 7000, warn: 6000, info: 5500 };

function crearToast(msg, tipo = 'success') {
  const c = document.getElementById('toast-wrap');
  if (!c) return null;

  const duration = DURATION[tipo] || 5500;
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', tipo === 'error' ? 'assertive' : 'polite');

  el.innerHTML = `
    <span class="toast-icon">${ICONS[tipo] || ICONS.info}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" aria-label="Cerrar notificación" type="button">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
    <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
  `;

  c.appendChild(el);
  // Forzar reflow para disparar la transición de entrada
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));

  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    el.classList.add('hiding');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    // Fallback por si transitionend no dispara
    setTimeout(() => el.remove(), 400);
  };

  el.querySelector('.toast-close').addEventListener('click', dismiss);
  timer = setTimeout(dismiss, duration);
  return el;
}

export function toast(msg, tipo = 'success') {
  crearToast(msg, tipo);
}

/**
 * Toast con botón de acción (ej. "Deshacer").
 * Llama a onAction() si el usuario hace clic dentro del timeout.
 */
export function toastAction(msg, actionLabel, onAction, timeout = 8000) {
  const c = document.getElementById('toast-wrap');
  if (!c) return;

  const el = document.createElement('div');
  el.className = 'toast toast-success toast-has-action';
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'polite');

  el.innerHTML = `
    <span class="toast-icon">${ICONS.success}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-action-btn" type="button">${actionLabel}</button>
    <button class="toast-close" aria-label="Cerrar" type="button">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
    <div class="toast-progress" style="animation-duration: ${timeout}ms"></div>
  `;

  let fired = false;
  const dismiss = () => {
    if (fired) return;
    fired = true;
    clearTimeout(timer);
    el.classList.add('hiding');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400);
  };

  el.querySelector('.toast-action-btn').addEventListener('click', () => { onAction(); dismiss(); });
  el.querySelector('.toast-close').addEventListener('click', dismiss);

  c.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  const timer = setTimeout(dismiss, timeout);
}
