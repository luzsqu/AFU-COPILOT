import { state, SK, SK_API, SK_JIRA, PROYECTOS_DEFAULT } from './state.js';

function cargaCompleta() {
  try {
    const raw = localStorage.getItem(SK);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function guardaCompleta(data) {
  try { localStorage.setItem(SK, JSON.stringify(data)); } catch {}
}

export function cargar() {
  const d = cargaCompleta();
  if (!d) {
    state.proyectos = PROYECTOS_DEFAULT.map(p => ({ ...p }));
    return;
  }
  state.usuario        = d.usuario  || null;
  state.proyectos      = d.proyectos || [];
  state.historias      = d.historias || [];
  state.epicas         = d.epicas   || [];
  state.proyectoActivoId = d.proyectoActivoId || null;
  if (d.prefs) {
    state.prefs.vista    = d.prefs.vista    || 'cards';
    state.prefs.darkMode = d.prefs.darkMode || false;
  }
  if (!state.proyectos.length) {
    state.proyectos = PROYECTOS_DEFAULT.map(p => ({ ...p }));
  }
}

export function guardar() {
  guardaCompleta({
    usuario:         state.usuario,
    proyectos:       state.proyectos,
    historias:       state.historias,
    epicas:          state.epicas,
    proyectoActivoId: state.proyectoActivoId,
    prefs:           state.prefs
  });
}

export function cargarConfigIA() {
  try {
    const d = localStorage.getItem(SK_API);
    if (d) state.apiCfg = JSON.parse(d);
  } catch { state.apiCfg = null; }
}

export function guardarConfigIA(cfg) {
  state.apiCfg = cfg;
  try { localStorage.setItem(SK_API, JSON.stringify(cfg)); } catch {}
}

export function borrarConfigIA() {
  state.apiCfg = null;
  try { localStorage.removeItem(SK_API); } catch {}
}

export function cargarConfigJira() {
  try {
    const d = localStorage.getItem(SK_JIRA);
    if (d) state.jiraCfg = JSON.parse(d);
  } catch { state.jiraCfg = null; }
}

export function guardarConfigJira(cfg) {
  state.jiraCfg = cfg;
  try { localStorage.setItem(SK_JIRA, JSON.stringify(cfg)); } catch {}
}

export function borrarConfigJira() {
  state.jiraCfg = null;
  try { localStorage.removeItem(SK_JIRA); } catch {}
}
