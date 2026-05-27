export function toast(msg, tipo = 'success') {
  const c = document.getElementById('toast-wrap');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `<span>${msg}</span>`;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 4000);
}

/**
 * Toast con botón de acción (ej. "Deshacer").
 * Llama a onAction() si el usuario hace clic dentro del timeout.
 * @param {string} msg
 * @param {string} actionLabel  — texto del botón
 * @param {Function} onAction   — callback al hacer clic
 * @param {number} [timeout=5000]
 */
export function toastAction(msg, actionLabel, onAction, timeout = 8000) {
  const c = document.getElementById('toast-wrap');
  if (!c) return;
  const el = document.createElement('div');
  el.className = 'toast toast-success toast-has-action';
  el.setAttribute('role', 'alert');
  el.innerHTML = `<span>${msg}</span><button class="toast-action-btn">${actionLabel}</button>`;
  let fired = false;
  const dismiss = () => {
    if (fired) return;
    fired = true;
    clearTimeout(timer);
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  };
  el.querySelector('.toast-action-btn').addEventListener('click', () => {
    onAction();
    dismiss();
  });
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  const timer = setTimeout(dismiss, timeout);
}
