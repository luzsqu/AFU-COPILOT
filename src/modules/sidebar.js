import { state } from './state.js';
import { navigate } from './router.js';
import { logout } from './auth.js';
import { esc } from './utils.js';
import { guardar } from './storage.js';

const ICONS = {
  dashboard: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2" width="6.5" height="6.5" rx="2" fill="currentColor" opacity=".85"/>
    <rect x="9.5" y="2" width="6.5" height="6.5" rx="2" fill="currentColor" opacity=".85"/>
    <rect x="2" y="9.5" width="6.5" height="6.5" rx="2" fill="currentColor" opacity=".85"/>
    <rect x="9.5" y="9.5" width="6.5" height="6.5" rx="2" fill="currentColor" opacity=".85"/>
  </svg>`,

  historias: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 5h12M3 9h8M3 13h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,

  flujos: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="2" width="4.5" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/>
    <rect x="6.75" y="7.5" width="4.5" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/>
    <rect x="12.5" y="2" width="4.5" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/>
    <rect x="1" y="13" width="4.5" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/>
    <path d="M5.5 3.5H6.75M11.25 9H12.5M5.5 14.5h1.25M14.75 5v2.5h-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,

  config: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.6"/>
    <path d="M9 1.5V3.5M9 14.5V16.5M1.5 9H3.5M14.5 9H16.5M3.7 3.7L5.1 5.1M12.9 12.9L14.3 14.3M3.7 14.3L5.1 12.9M12.9 5.1L14.3 3.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
};

const NAV_ITEMS = [
  { path: '/dashboard', icon: ICONS.dashboard, label: 'Inicio'         },
  { path: '/historias', icon: ICONS.historias, label: 'Historias'      },
  { path: '/flujos',    icon: ICONS.flujos,    label: 'Flujos UML'     },
  { path: '/config',    icon: ICONS.config,    label: 'Configuración'  },
];

function proyectoActivo() {
  return state.proyectos.find(p => p.id === state.proyectoActivoId) || null;
}

export function renderSidebar(currentPath) {
  const sidebar = document.getElementById('sidebar');
  const proj = proyectoActivo();
  const initials = state.usuario ? state.usuario.username.slice(0, 2).toUpperCase() : '??';

  sidebar.innerHTML = `
<div class="sb-top">

  <!-- BRAND -->
  <div class="sb-brand">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="rgba(255,255,255,.18)"/>
      <path d="M8 10.5h16M8 16h10M8 21.5h12" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <circle cx="23" cy="21.5" r="4" fill="rgba(255,255,255,.95)"/>
      <path d="M21.5 21.5l1.2 1.2 2.3-2.3" stroke="var(--accent)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div>
      <div class="sb-app-name">Analista HU</div>
      <div class="sb-app-sub">ISTQB Foundation</div>
    </div>
  </div>

  <!-- PROJECT SELECTOR -->
  <div class="sb-project-selector">
    <div class="sb-project-label">Proyecto activo</div>
    <button class="sb-project-btn" id="btn-cambiar-proyecto" title="Cambiar proyecto">
      <span class="sb-project-key">${esc(proj?.jiraKey || '—')}</span>
      <span class="sb-project-name">${esc(proj?.nombre || 'Sin proyecto')}</span>
      <svg class="sb-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
  </div>

  <!-- NAVIGATION -->
  <div class="sb-nav-section">
    <div class="sb-nav-section-label">Navegación</div>
    <nav class="sb-nav" aria-label="Navegación principal">
      ${NAV_ITEMS.map(it => {
        const isHistorias = it.path === '/historias';
        const active = currentPath === it.path ||
          (isHistorias && currentPath.startsWith('/historias'));
        return `<a class="sb-nav-item${active ? ' active' : ''}" href="#${it.path}" aria-current="${active ? 'page' : 'false'}">
          <span class="sb-nav-icon">${it.icon}</span>
          <span>${it.label}</span>
        </a>`;
      }).join('')}
    </nav>
  </div>

</div>

<!-- BOTTOM -->
<div class="sb-bottom">
  <!-- Quick search hint -->
  <button class="sb-shortcut-hint" id="btn-open-palette" aria-label="Abrir búsqueda rápida">
    <span class="sb-shortcut-label">Búsqueda rápida</span>
    <div class="kbd-combo">
      <kbd>⌘</kbd><kbd>K</kbd>
    </div>
  </button>

  <button class="sb-theme-toggle" id="btn-dark-mode" title="Cambiar tema" aria-label="Cambiar tema">
    <span id="theme-icon">${state.prefs.darkMode ? '☀' : '🌙'}</span>
    <span>${state.prefs.darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
  </button>

  <div class="sb-user-menu">
    <div class="sb-avatar" title="${esc(state.usuario?.username || '')}">${initials}</div>
    <div class="sb-user-info">
      <span class="sb-username">${esc(state.usuario?.username || '')}</span>
      <span class="sb-user-role">Analista</span>
    </div>
    <button class="sb-logout" id="btn-logout" title="Cerrar sesión" aria-label="Cerrar sesión">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div>`;

  document.getElementById('btn-cambiar-proyecto').addEventListener('click', () => navigate('/projects'));
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-dark-mode').addEventListener('click', toggleDarkMode);
  document.getElementById('btn-open-palette').addEventListener('click', () => {
    document.getElementById('cmd-palette').classList.remove('hidden');
    document.getElementById('palette-input')?.focus();
  });
}

export function updateBreadcrumb(path, id) {
  const bc = document.getElementById('breadcrumbs');
  if (!bc) return;
  const proj = proyectoActivo();
  if (!proj) { bc.innerHTML = ''; return; }

  const crumbs = [{ label: esc(proj.nombre), href: '#/dashboard' }];
  if (path === '/historias') crumbs.push({ label: 'Historias' });
  if (path === '/historias/nueva') { crumbs.push({ label: 'Historias', href: '#/historias' }); crumbs.push({ label: 'Nueva historia' }); }
  if (path === '/historias/nueva-imagen') { crumbs.push({ label: 'Historias', href: '#/historias' }); crumbs.push({ label: 'Desde imagen' }); }
  if (path === '/historias/nueva-api') { crumbs.push({ label: 'Historias', href: '#/historias' }); crumbs.push({ label: 'Desde API / MS' }); }
  if (path === '/historias/nueva-doc') { crumbs.push({ label: 'Historias', href: '#/historias' }); crumbs.push({ label: 'Desde documento' }); }
  if (path === '/historias/:id' && id) { crumbs.push({ label: 'Historias', href: '#/historias' }); crumbs.push({ label: id }); }
  if (path === '/historias/:id/editar' && id) { crumbs.push({ label: 'Historias', href: '#/historias' }); crumbs.push({ label: id, href: `#/historias/${id}` }); crumbs.push({ label: 'Editar' }); }
  if (path === '/flujos') crumbs.push({ label: 'Flujos UML' });
  if (path === '/config') crumbs.push({ label: 'Configuración' });

  if (crumbs.length < 2) { bc.innerHTML = ''; return; }

  bc.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb">` +
    crumbs.map((c, i) => {
      const last = i === crumbs.length - 1;
      return last
        ? `<span class="bc-current">${c.label}</span>`
        : `<a class="bc-link" href="${c.href}">${c.label}</a><span class="bc-sep">›</span>`;
    }).join('') +
  `</nav>`;
}

function toggleDarkMode() {
  state.prefs.darkMode = !state.prefs.darkMode;
  document.documentElement.classList.toggle('dark', state.prefs.darkMode);
  guardar();
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = state.prefs.darkMode ? '☀' : '🌙';
  const label = icon?.nextElementSibling;
  if (label) label.textContent = state.prefs.darkMode ? 'Modo claro' : 'Modo oscuro';
}
