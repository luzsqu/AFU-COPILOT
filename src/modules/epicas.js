import { state } from './state.js';
import { guardar } from './storage.js';
import { guardarEpicas } from './storage.js';

export function generarEpicaId() {
  return 'EP-' + Date.now().toString(36).toUpperCase();
}

export function crearEpicaData(nombre, color) {
  if (!nombre) return null;
  if (state.epicas.find(e => e.nombre.toLowerCase() === nombre.toLowerCase())) return null;
  const epica = { id: generarEpicaId(), nombre, color };
  state.epicas.push(epica);
  guardarEpicas();
  return epica;
}

export function eliminarEpicaById(id) {
  state.epicas = state.epicas.filter(e => e.id !== id);
  state.historias.forEach(h => { if (h.epicaId === id) h.epicaId = ''; });
  if (state.epicaFiltro === id) state.epicaFiltro = null;
  guardar();
  guardarEpicas();
}
