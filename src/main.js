import { state } from './modules/state.js';
import { cargar, cargarConfigIA, cargarConfigJira } from './modules/storage.js';
import { initRouter, router } from './modules/router.js';
import { initPalette, setupPaletteDOM } from './modules/palette.js';
import { cargarEjemplosData } from './modules/historias.js';
import { toast } from './modules/toast.js';

// ── BOOTSTRAP ─────────────────────────────────────────────────────────────────
cargar();
cargarConfigIA();
cargarConfigJira();

// Auto-configurar Groq desde variable de entorno si no hay API guardada
// o si el modelo guardado fue dado de baja
const GROQ_DEFAULT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const MODELOS_DADOS_DE_BAJA = ['llama-3.2-11b-vision-preview','llama-3.2-90b-vision-preview','mixtral-8x7b-32768'];
const groqKey = import.meta.env.VITE_GROK_API_KEY;

if (groqKey) {
  const modeloInvalido = state.apiCfg?.provider === 'groq' && MODELOS_DADOS_DE_BAJA.includes(state.apiCfg?.model);
  if (!state.apiCfg?.key || modeloInvalido) {
    state.apiCfg = { provider: 'groq', model: GROQ_DEFAULT_MODEL, key: groqKey };
  }
}

if (state.prefs.darkMode) {
  document.documentElement.classList.add('dark');
}

document.addEventListener('DOMContentLoaded', () => {
  setupPaletteDOM();
  initPalette();
  initRouter();
});

// ── GLOBAL KEYDOWN HELPERS ───────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
});

// ── EXPOSE FOR INLINE HTML HANDLERS ──────────────────────────────────────────
window.__afu = {
  cargarEjemplos: () => {
    const pId = state.proyectoActivoId;
    if (!pId) { toast('Selecciona un proyecto primero', 'warn'); return; }
    cargarEjemplosData();
    location.hash = '#/historias';
    router();
    toast('3 historias de ejemplo cargadas');
  }
};
