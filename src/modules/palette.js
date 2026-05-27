import { state } from './state.js';
import { navigate } from './router.js';
import { esc } from './utils.js';

const ACTIONS = [
  { label: 'Nueva historia',          icon: '✨', action: () => navigate('/historias/nueva') },
  { label: 'Historia desde imagen',   icon: '🎨', action: () => navigate('/historias/nueva-imagen') },
  { label: 'Ver historias',           icon: '📋', action: () => navigate('/historias') },
  { label: 'Cambiar proyecto',        icon: '⊞', action: () => navigate('/projects') },
  { label: 'Ir al dashboard',        icon: '⊞', action: () => navigate('/dashboard') }
];

export function initPalette() {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette();
    }
    if (e.key === 'Escape') closePalette();
  });
}

function togglePalette() {
  const el = document.getElementById('cmd-palette');
  if (el.classList.contains('hidden')) openPalette();
  else closePalette();
}

function openPalette() {
  if (!state.usuario) return;
  const el = document.getElementById('cmd-palette');
  el.classList.remove('hidden');
  renderPaletteItems('');
  document.getElementById('palette-input').value = '';
  document.getElementById('palette-input').focus();
}

function closePalette() {
  document.getElementById('cmd-palette')?.classList.add('hidden');
}

function renderPaletteItems(q) {
  const query = q.toLowerCase();
  const list  = document.getElementById('palette-list');

  const matches = query
    ? ACTIONS.filter(a => a.label.toLowerCase().includes(query))
    : ACTIONS;

  const histMatches = query
    ? state.historias
        .filter(h => h.proyectoId === state.proyectoActivoId &&
          (h.resumen.toLowerCase().includes(query) || h.id.toLowerCase().includes(query)))
        .slice(0, 5)
        .map(h => ({ label: h.resumen, icon: '📄', action: () => navigate(`/historias/${h.id}`) }))
    : [];

  const all = [...matches, ...histMatches];

  list.innerHTML = all.length
    ? all.map((a, i) => `<li class="palette-item" data-idx="${i}" role="option">${a.icon} ${esc(a.label)}</li>`).join('')
    : `<li class="palette-empty">Sin resultados</li>`;

  list.querySelectorAll('.palette-item').forEach((li, i) => {
    li.addEventListener('click', () => { all[i].action(); closePalette(); });
  });
}

export function setupPaletteDOM() {
  const overlay = document.getElementById('cmd-palette');
  if (!overlay) return;
  overlay.addEventListener('click', e => { if (e.target === overlay) closePalette(); });
  document.getElementById('palette-input').addEventListener('input', e => renderPaletteItems(e.target.value));
}
