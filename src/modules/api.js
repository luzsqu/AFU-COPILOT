import { state, MODELS } from './state.js';
import { guardarConfigIA as persistirConfigIA, borrarConfigIA as limpiarConfigIA } from './storage.js';
import { toast } from './toast.js';

export function cargarConfigIAUI() {
  const provider = document.getElementById('cfg-provider');
  const key      = document.getElementById('cfg-key');
  if (!provider || !key) return;
  updateModelOptions();
  actualizarAPIBar();
}

export function guardarConfigIAUI() {
  const key      = document.getElementById('cfg-key')?.value.trim();
  const provider = document.getElementById('cfg-provider')?.value;
  const model    = document.getElementById('cfg-model')?.value;
  if (!key) { toast('Introduce una API key', 'warn'); return; }
  const cfg = { provider, model, key };
  persistirConfigIA(cfg);
  toast('API key guardada');
}

export function borrarConfigIAUI() {
  limpiarConfigIA();
  const el = document.getElementById('cfg-key');
  if (el) el.value = '';
  toast('API key eliminada');
}

export function updateModelOptions() {
  const provEl = document.getElementById('cfg-provider');
  const sel    = document.getElementById('cfg-model');
  if (!provEl || !sel) return;
  const provider = provEl.value;
  const current  = state.apiCfg?.provider === provider ? state.apiCfg.model : null;
  sel.innerHTML  = (MODELS[provider] || []).map(m =>
    `<option value="${m}"${m === current ? ' selected' : ''}>${m}</option>`
  ).join('');
}

export function actualizarAPIBar() {
  const dot = document.getElementById('api-dot');
  const txt = document.getElementById('api-status-text');
  if (!dot || !txt) return;
  if (state.apiCfg?.key) {
    dot.classList.add('ok');
    txt.textContent = `${state.apiCfg.provider === 'claude' ? 'Claude' : 'OpenAI'} · ${state.apiCfg.model}`;
  } else {
    dot.classList.remove('ok');
    txt.textContent = 'Sin API key';
  }
}
