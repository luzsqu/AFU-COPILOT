import { state, JIRA_TIPOS, JIRA_PRIORIDADES } from './state.js';
import { esc, formatDate } from './utils.js';
import { guardar } from './storage.js';
import { generarCriterios } from './gherkin.js';
import { generarTestCases, TC_ESTADOS, TC_TIPOS_LIST, TC_PRIORIDADES, mkTestCase } from './testcases.js';
import { crearHistoriaData, crearHistoriasDesdeIA, eliminarHistoriaById, duplicarHistoria, actualizarHistoria } from './historias.js';
import { toast, toastAction } from './toast.js';
import { navigate } from './router.js';
import { showConfirm } from './auth.js';
import { generarHistoriasDesdeImagenConIA } from './import.js';
import { extraerTextoDeArchivo, generarHistoriasDesdeDoc } from './importDoc.js';

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function renderDashboard() {
  const proj = state.proyectos.find(p => p.id === state.proyectoActivoId);
  const histsProj = state.historias.filter(h => h.proyectoId === state.proyectoActivoId);
  const total  = histsProj.length;
  const listas = histsProj.filter(h => (h.criterios || []).length >= 4).length;
  const conTC  = histsProj.filter(h => (h.testCases || []).length > 0).length;
  const sinc   = histsProj.filter(h => h.sincJira).length;
  const user   = state.usuario?.username || '';

  document.getElementById('view').innerHTML = `
<div class="dashboard-wrap">

  <!-- HEADER -->
  <div class="dashboard-header">
    <div class="dashboard-greeting">
      <div class="dashboard-greeting-text">
        <h1 class="page-title">${getGreeting()}, ${esc(user)} 👋</h1>
        <p class="page-sub">${esc(proj?.descripcion || 'Aquí está el resumen de tu proyecto.')}</p>
      </div>
      <button class="dashboard-proj-badge" id="db-proj-badge" title="Cambiar proyecto">
        <span class="dashboard-proj-badge-key">${esc(proj?.jiraKey || '—')}</span>
        <span class="dashboard-proj-badge-name">${esc(proj?.nombre || 'Proyecto')}</span>
      </button>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon stat-icon-orange">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="stat-body">
        <div class="stat-val">${total}</div>
        <div class="stat-label">Historias</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon-green">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.6"/>
          <path d="M7 10l2.5 2.5 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="stat-body">
        <div class="stat-val">${listas}</div>
        <div class="stat-label">Con criterios</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon-blue">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/>
          <path d="M7 8h6M7 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="stat-body">
        <div class="stat-val">${conTC}</div>
        <div class="stat-label">Con test cases</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon-purple">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3v3M10 14v3M3 10h3M14 10h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.6"/>
        </svg>
      </div>
      <div class="stat-body">
        <div class="stat-val">${sinc}</div>
        <div class="stat-label">Sincronizadas</div>
      </div>
    </div>
  </div>

  <!-- CREATION PATHS -->
  <div class="creation-grid">

    <div class="creation-card creation-card-orange" id="ac-manual" role="button" tabindex="0" aria-label="Crear HU Manual">
      <div class="creation-card-icon creation-icon-orange">✨</div>
      <div class="creation-card-title">HU Manual</div>
      <div class="creation-card-desc">Crea historias de usuario desde cero con criterios Gherkin ISTQB y test cases automáticos.</div>
      <div class="creation-card-cta creation-cta-orange">Crear historia →</div>
    </div>

    <div class="creation-card creation-card-purple" id="ac-imagen" role="button" tabindex="0" aria-label="Crear HU desde Mockup">
      <div class="creation-card-icon creation-icon-purple">🎨</div>
      <div class="creation-card-title">Desde Mockup</div>
      <div class="creation-card-desc">Sube un wireframe o captura de pantalla y la IA genera historias ISTQB automáticamente.</div>
      <div class="creation-card-cta creation-cta-purple">Analizar imagen →</div>
    </div>

    <div class="creation-card creation-card-teal" id="ac-flujos" role="button" tabindex="0" aria-label="Crear Flujos UML">
      <div class="creation-card-icon creation-icon-teal">📊</div>
      <div class="creation-card-title">Flujos UML</div>
      <div class="creation-card-desc">Genera diagramas UML, BPMN y esquemas de flujo desde documentación escrita del proyecto.</div>
      <div class="creation-card-cta creation-cta-teal">Crear flujo →</div>
    </div>

    <div class="creation-card creation-card-blue" id="ac-api" role="button" tabindex="0" aria-label="Historias técnicas desde API">
      <div class="creation-card-icon creation-icon-blue">🔌</div>
      <div class="creation-card-title">API / Microservicio</div>
      <div class="creation-card-desc">Importa Swagger, docs REST o contratos y genera historias técnicas ISTQB con IA.</div>
      <div class="creation-card-cta creation-cta-blue">Importar documentación →</div>
    </div>

    <div class="creation-card creation-card-rose" id="ac-doc" role="button" tabindex="0" aria-label="Generar HU desde documento">
      <span class="creation-card-new-badge creation-badge-rose">Nuevo</span>
      <div class="creation-card-icon creation-icon-rose">📄</div>
      <div class="creation-card-title">Desde Documento</div>
      <div class="creation-card-desc">Sube un PDF, Word o TXT con requisitos y la IA extrae y genera las historias ISTQB.</div>
      <div class="creation-card-cta creation-cta-rose">Subir documento →</div>
    </div>

  </div>

  ${total === 0 ? renderOnboarding() : ''}

</div>`;

  document.getElementById('ac-manual').addEventListener('click', () => navigate('/historias/nueva'));
  document.getElementById('ac-imagen').addEventListener('click', () => navigate('/historias/nueva-imagen'));
  document.getElementById('ac-flujos').addEventListener('click',  () => navigate('/flujos'));
  document.getElementById('ac-api').addEventListener('click',     () => navigate('/historias/nueva-api'));
  document.getElementById('ac-doc').addEventListener('click',     () => navigate('/historias/nueva-doc'));

  // Keyboard navigation for creation cards
  document.querySelectorAll('.creation-card').forEach(card => {
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
  });

  document.getElementById('db-proj-badge')?.addEventListener('click', () => navigate('/projects'));
  document.getElementById('btn-onboard-historia')?.addEventListener('click', () => navigate('/historias/nueva'));
  document.getElementById('btn-onboard-imagen')?.addEventListener('click', () => navigate('/historias/nueva-imagen'));
  document.getElementById('btn-onboard-ejemplos')?.addEventListener('click', () => window.__afu?.cargarEjemplos());
}

function renderOnboarding() {
  return `
<div class="onboarding-card">
  <div class="onboarding-steps">
    <div class="onboard-step done">
      <div class="step-dot">✓</div>
      <div class="step-label">Cuenta creada</div>
    </div>
    <div class="onboard-step done">
      <div class="step-dot">✓</div>
      <div class="step-label">Proyecto activo</div>
    </div>
    <div class="onboard-step active">
      <div class="step-dot">3</div>
      <div class="step-label">Primera historia</div>
    </div>
  </div>
  <div class="onboarding-header">
    <h3>¡Ya casi terminas la configuración!</h3>
    <p>Crea tu primera historia de usuario para comenzar a trabajar con el proyecto.</p>
  </div>
  <div class="onboarding-actions">
    <button class="btn btn-accent" id="btn-onboard-historia">✨ Crear primera historia</button>
    <button class="btn btn-outline" id="btn-onboard-imagen">🎨 Generar desde imagen</button>
    <div class="onboard-divider">o</div>
    <button class="btn btn-ghost" id="btn-onboard-ejemplos">📋 Cargar historias de ejemplo</button>
  </div>
</div>`;
}

// ── HISTORIAS LIST ────────────────────────────────────────────────────────────
// Sort & filter state — persists across view-switch (cards ↔ tabla) without re-render
let _sortCol = null;        // 'id' | 'tipo' | 'resumen' | 'prioridad' | null
let _sortDir = 'asc';       // 'asc' | 'desc'
let _filtros = { tipo: null, prioridad: null };

const PRIO_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function _applyFiltersAndSort(hists) {
  let out = hists;
  if (_filtros.tipo)      out = out.filter(h => h.tipo      === _filtros.tipo);
  if (_filtros.prioridad) out = out.filter(h => h.prioridad === _filtros.prioridad);
  if (!_sortCol) return out;
  return [...out].sort((a, b) => {
    let va, vb;
    if (_sortCol === 'prioridad') {
      va = PRIO_ORDER[a.prioridad] ?? 99;
      vb = PRIO_ORDER[b.prioridad] ?? 99;
      return _sortDir === 'asc' ? va - vb : vb - va;
    }
    va = (a[_sortCol] || '').toString().toLowerCase();
    vb = (b[_sortCol] || '').toString().toLowerCase();
    if (va < vb) return _sortDir === 'asc' ? -1 : 1;
    if (va > vb) return _sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

export function renderHistoriasList() {
  const allHists = state.historias.filter(h => h.proyectoId === state.proyectoActivoId);
  const hists    = _applyFiltersAndSort(allHists);
  const vista    = state.prefs.vista;

  document.getElementById('view').innerHTML = `
<div class="historias-wrap">
  <div class="historias-header">
    <div>
      <h1 class="page-title">Historias de Usuario</h1>
      <p class="page-sub">${hists.length} de ${allHists.length} historia${allHists.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="historias-actions">
      <input type="search" id="search-hu" class="form-control search-input" placeholder="Buscar historias…" aria-label="Buscar">
      <div class="vista-toggle" role="group" aria-label="Cambiar vista">
        <button class="vista-btn${vista === 'cards' ? ' active' : ''}" data-vista="cards" title="Vista cards">⊞</button>
        <button class="vista-btn${vista === 'lista' ? ' active' : ''}" data-vista="lista" title="Vista lista">☰</button>
      </div>
      <button class="btn btn-ghost" id="btn-modo-sel">Seleccionar</button>
      <button class="btn btn-accent" onclick="window.location.hash='#/historias/nueva'">+ Nueva historia</button>
    </div>
  </div>

  <div class="img-cta-banner${localStorage.getItem('afu-banner-collapsed') === '1' ? ' collapsed' : ''}" id="img-cta-banner">
    <div class="img-cta-banner-header">
      <div class="img-cta-content">
        <span class="img-cta-icon">🎨</span>
        <div>
          <div class="img-cta-title">¿Tienes un mockup o wireframe?</div>
          <div class="img-cta-sub">Analiza imágenes con IA para generar historias automáticamente</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem">
        <button class="btn btn-accent btn-sm" onclick="window.location.hash='#/historias/nueva-imagen'">Analizar imagen →</button>
        <button class="img-cta-dismiss" id="btn-banner-dismiss" title="Ocultar banner">✕</button>
      </div>
    </div>
  </div>

  ${_renderFilterBar(allHists)}

  <div id="historias-content">${hists.length ? renderHuContent(hists, vista) : renderEmptyState()}</div>

  <div class="sel-bar hidden" id="sel-bar">
    <div class="sel-bar-info">
      <span id="sel-count">0 seleccionadas</span>
      <div id="sel-chips" class="sel-chips"></div>
    </div>
    <div class="sel-bar-actions">
      <button class="btn btn-ghost btn-sm" id="btn-sel-pdf">PDF</button>
      <button class="btn btn-ghost btn-sm" id="btn-sel-csv">CSV</button>
      <button class="btn btn-ghost btn-sm" id="btn-sel-md">Markdown</button>
      <button class="btn btn-jira-bulk btn-sm" id="btn-sel-jira">🔗 Enviar a Jira</button>
      <button class="btn btn-danger btn-sm" id="btn-sel-del">Eliminar</button>
    </div>
  </div>
</div>`;

  setupListaEvents(hists);
}

function _renderFilterBar(allHists) {
  const tipos      = [...new Set(allHists.map(h => h.tipo).filter(Boolean))];
  const prioridades = ['Critical', 'High', 'Medium', 'Low'].filter(p => allHists.some(h => h.prioridad === p));
  if (!tipos.length && !prioridades.length) return '';
  const tipoPills = tipos.map(t =>
    `<button class="filter-pill${_filtros.tipo === t ? ' active' : ''}" data-filter-tipo="${esc(t)}">${esc(t)}</button>`
  ).join('');
  const prioPills = prioridades.map(p =>
    `<button class="filter-pill${_filtros.prioridad === p ? ' active' : ''}" data-filter-prio="${esc(p)}">${esc(p)}</button>`
  ).join('');
  const sep = tipos.length && prioridades.length ? '<div class="filter-separator"></div>' : '';
  const hasFilter = _filtros.tipo || _filtros.prioridad;
  return `<div class="filter-bar" id="filter-bar">
    <span class="filter-bar-label">Filtrar</span>
    ${tipoPills}${sep}${prioPills}
    ${hasFilter ? `<button class="filter-pill" id="btn-clear-filters" style="opacity:.6">✕ Limpiar</button>` : ''}
  </div>`;
}

function renderHuContent(hists, vista) {
  if (vista === 'lista') return renderListaView(hists);
  return `<div class="cards-grid" id="cards-container">${hists.map(renderHuCard).join('')}</div>`;
}

function healthDots(h) {
  const d = !!h.descripcion;
  const c = (h.criterios || []).length > 0;
  const t = (h.testCases || []).length > 0;
  return `<div class="health-dots" title="Descripción · Criterios · Test Cases">
    <span class="dot${d ? ' dot-ok' : ''}"></span>
    <span class="dot${c ? ' dot-ok' : ''}"></span>
    <span class="dot${t ? ' dot-ok' : ''}"></span>
  </div>`;
}

function jiraReadyBadge(h) {
  const ok = h.resumen && (h.criterios || []).length >= 2;
  return ok ? `<span class="badge badge-jira-ready">✓ Jira</span>` : '';
}

function renderHuCard(h) {
  const sel = state.seleccionadas.has(h.id) ? ' selected' : '';
  return `<article class="hu-card${sel}" data-id="${esc(h.id)}" role="listitem" tabindex="0">
    <div class="hu-card-inner">
      <div class="hu-card-header">
        <input type="checkbox" class="hu-card-check" ${state.seleccionadas.has(h.id) ? 'checked' : ''} aria-label="Seleccionar" tabindex="-1">
        <span class="hu-id">${esc(h.id)}</span>
        <div class="card-actions">
          <button class="btn-icon" data-action="copy" data-id="${esc(h.id)}" title="Copiar HU">📋</button>
          <button class="btn-icon" data-action="edit" data-id="${esc(h.id)}" title="Editar">✏</button>
          <button class="btn-icon" data-action="dup"  data-id="${esc(h.id)}" title="Duplicar">⧉</button>
          <button class="btn-icon btn-icon-del" data-action="del" data-id="${esc(h.id)}" title="Eliminar">✕</button>
        </div>
      </div>
      <div class="hu-card-title">${esc(h.resumen)}</div>
      <div class="hu-card-story">Como <strong>${esc(h.como)}</strong>, quiero ${esc(h.quiero)}</div>
      <div class="hu-card-badges">
        <span class="badge badge-tipo-jira">${esc(h.tipo)}</span>
        <span class="badge badge-prio badge-${(h.prioridad||'').toLowerCase()}">${esc(h.prioridad)}</span>
        ${(h.etiquetas || []).slice(0,2).map(t => `<span class="badge badge-tag">${esc(t)}</span>`).join('')}
        ${jiraReadyBadge(h)}
      </div>
      <div class="hu-card-footer">
        ${healthDots(h)}
        <span class="hu-card-date">${formatDate(h.creadoEn)}</span>
      </div>
    </div>
  </article>`;
}

function _sortThClass(col) {
  if (_sortCol !== col) return 'sortable';
  return `sortable sort-${_sortDir}`;
}
function _sortIcon(col) {
  if (_sortCol !== col) return '<i class="sort-icon">⇅</i>';
  return `<i class="sort-icon">${_sortDir === 'asc' ? '↑' : '↓'}</i>`;
}

function renderListaView(hists) {
  return `<div class="tabla-wrap">
  <table class="tabla-hu" aria-label="Lista de historias">
    <thead>
      <tr>
        <th class="col-check"><input type="checkbox" id="check-all" aria-label="Seleccionar todo"></th>
        <th class="${_sortThClass('id')}"     data-sort="id">ID ${_sortIcon('id')}</th>
        <th class="${_sortThClass('tipo')}"   data-sort="tipo">Tipo ${_sortIcon('tipo')}</th>
        <th class="${_sortThClass('resumen')}" data-sort="resumen">Resumen ${_sortIcon('resumen')}</th>
        <th class="${_sortThClass('prioridad')}" data-sort="prioridad">Prioridad ${_sortIcon('prioridad')}</th>
        <th>Etiquetas</th><th>Acciones</th>
      </tr>
    </thead>
    <tbody>
    ${hists.map(h => `
      <tr class="${state.seleccionadas.has(h.id) ? 'row-selected' : ''}" data-id="${esc(h.id)}">
        <td><input type="checkbox" class="row-check" data-id="${esc(h.id)}" ${state.seleccionadas.has(h.id) ? 'checked' : ''}></td>
        <td><span class="hu-id-sm">${esc(h.id)}</span></td>
        <td><span class="badge badge-tipo-jira">${esc(h.tipo)}</span></td>
        <td><a class="tabla-link" href="#/historias/${esc(h.id)}">${esc(h.resumen)}</a></td>
        <td><span class="badge badge-${(h.prioridad||'').toLowerCase()}">${esc(h.prioridad)}</span></td>
        <td>${(h.etiquetas||[]).slice(0,3).map(t=>`<span class="badge badge-tag">${esc(t)}</span>`).join('')}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon" data-action="copy"   data-id="${esc(h.id)}" title="Copiar HU">📋</button>
            <button class="btn-icon" data-action="detail" data-id="${esc(h.id)}" title="Ver detalle">↗</button>
            <button class="btn-icon" data-action="dup"    data-id="${esc(h.id)}" title="Duplicar">⧉</button>
            <button class="btn-icon btn-icon-del" data-action="del" data-id="${esc(h.id)}" title="Eliminar">✕</button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function renderEmptyState() {
  return `<div class="empty-state">
    <span class="empty-state-icon">📋</span>
    <h3>Sin historias todavía</h3>
    <p>Crea tu primera historia de usuario o genera una a partir de un mockup o wireframe.</p>
    <div class="empty-actions">
      <button class="btn btn-accent" onclick="window.location.hash='#/historias/nueva'">✨ Nueva historia</button>
      <button class="btn btn-outline" onclick="window.location.hash='#/historias/nueva-imagen'">🎨 Desde imagen</button>
    </div>
  </div>`;
}

function setupListaEvents(hists) {
  const content = document.getElementById('historias-content');

  document.getElementById('search-hu').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = hists.filter(h =>
      h.resumen.toLowerCase().includes(q) ||
      h.id.toLowerCase().includes(q) ||
      (h.etiquetas || []).some(t => t.toLowerCase().includes(q))
    );
    // Only replace inner content — the listener on #historias-content stays intact
    content.innerHTML = filtered.length
      ? renderHuContent(filtered, state.prefs.vista)
      : `<div class="empty-state"><h3>Sin resultados</h3><p>Prueba con otra búsqueda</p></div>`;
    if (state.modoSeleccion) content.classList.add('selection-mode');
  });

  document.querySelectorAll('.vista-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.prefs.vista = btn.dataset.vista;
      guardar();
      // Only replace inner content — no need to re-bind events
      content.innerHTML = renderHuContent(hists, state.prefs.vista);
      document.querySelectorAll('.vista-btn').forEach(b => b.classList.toggle('active', b.dataset.vista === state.prefs.vista));
      if (state.modoSeleccion) content.classList.add('selection-mode');
    });
  });

  // Filter pills
  document.getElementById('filter-bar')?.addEventListener('click', e => {
    const tipoPill = e.target.closest('[data-filter-tipo]');
    const prioPill = e.target.closest('[data-filter-prio]');
    const clear    = e.target.closest('#btn-clear-filters');
    if (tipoPill) {
      _filtros.tipo = _filtros.tipo === tipoPill.dataset.filterTipo ? null : tipoPill.dataset.filterTipo;
      renderHistoriasList(); return;
    }
    if (prioPill) {
      _filtros.prioridad = _filtros.prioridad === prioPill.dataset.filterPrio ? null : prioPill.dataset.filterPrio;
      renderHistoriasList(); return;
    }
    if (clear) { _filtros.tipo = null; _filtros.prioridad = null; renderHistoriasList(); }
  });

  // Banner dismiss / restore
  const bannerEl = document.getElementById('img-cta-banner');
  document.getElementById('btn-banner-dismiss')?.addEventListener('click', () => {
    localStorage.setItem('afu-banner-collapsed', '1');
    bannerEl?.classList.add('collapsed');
  });

  document.getElementById('btn-modo-sel').addEventListener('click', () => {
    state.modoSeleccion = !state.modoSeleccion;
    if (!state.modoSeleccion) { state.seleccionadas.clear(); renderHistoriasList(); return; }
    document.getElementById('btn-modo-sel').textContent = 'Cancelar';
    document.getElementById('sel-bar').classList.remove('hidden');
    document.getElementById('historias-content')?.classList.add('selection-mode');
  });

  bindContentEvents();
  setupSelBar();

  // Restore selection UI if modoSeleccion was already active before this re-render
  if (state.modoSeleccion) {
    document.getElementById('btn-modo-sel').textContent = 'Cancelar';
    updateSelBar();
  }
}

function bindContentEvents() {
  const content = document.getElementById('historias-content');
  if (!content) return;

  if (state.modoSeleccion) content.classList.add('selection-mode');

  // Sort header clicks — delegated on content so they survive content.innerHTML replacements
  content.addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const col = th.dataset.sort;
      if (_sortCol === col) _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
      else { _sortCol = col; _sortDir = 'asc'; }
      // Re-render only the table content (keep the existing event listener)
      const sorted = _applyFiltersAndSort(state.historias.filter(h => h.proyectoId === state.proyectoActivoId));
      content.innerHTML = renderListaView(sorted);
      if (state.modoSeleccion) content.classList.add('selection-mode');
      sorted.forEach(h => _syncSeleccionVisual(h.id));
    }
  });

  // Single click listener via delegation — called only ONCE per #historias-content node.
  // Vista switches and search only replace content.innerHTML, so this listener persists.
  content.addEventListener('click', e => {
    if (state.modoSeleccion) {
      // In selection mode the whole card is the toggle target.
      // Action buttons are hidden via CSS so they can't be clicked.
      const card = e.target.closest('.hu-card[data-id]');
      if (card) { toggleSeleccion(card.dataset.id); return; }

      // List view row body — preventDefault stops <a> anchors from changing the hash
      const row = e.target.closest('tr[data-id]');
      if (row && !e.target.closest('.row-check')) { e.preventDefault(); toggleSeleccion(row.dataset.id); }
      return;
    }

    // Normal mode — action buttons and navigation
    const btn = e.target.closest('[data-action]');
    if (btn) {
      const { action, id } = btn.dataset;
      if (action === 'del') {
        const saved = state.historias.find(h => h.id === id);
        eliminarHistoriaById(id);
        renderHistoriasList();
        toastAction('Historia eliminada', 'Deshacer', () => {
          if (saved) { state.historias.push(saved); guardar(); renderHistoriasList(); }
        });
      }
      if (action === 'dup') {
        const copia = duplicarHistoria(id);
        if (copia) { renderHistoriasList(); toast('Historia duplicada'); }
      }
      if (action === 'copy') {
        const h = state.historias.find(h => h.id === id);
        if (h) copyHU(h);
        return;
      }
      if (action === 'edit')   navigate(`/historias/${id}/editar`);
      if (action === 'detail') navigate(`/historias/${id}`);
      return;
    }

    const card = e.target.closest('.hu-card[data-id]');
    if (card && !e.target.closest('.card-actions')) navigate(`/historias/${card.dataset.id}`);
    const row  = e.target.closest('tr[data-id]');
    if (row && !e.target.closest('.row-actions') && !e.target.closest('.row-check')) navigate(`/historias/${row.dataset.id}`);
  });

  // Row-check and select-all via delegation — survives content.innerHTML replacements
  content.addEventListener('change', e => {
    const cb = e.target.closest('.row-check');
    if (cb) { toggleSeleccion(cb.dataset.id); return; }
    if (e.target.id === 'check-all') {
      // Usar solo las filas visibles en el DOM para respetar el filtro de búsqueda activo.
      const visibleIds = [...content.querySelectorAll('tr[data-id]')].map(r => r.dataset.id);
      if (e.target.checked) visibleIds.forEach(id => state.seleccionadas.add(id));
      else visibleIds.forEach(id => state.seleccionadas.delete(id));
      updateSelBar();
      visibleIds.forEach(id => _syncSeleccionVisual(id));
    }
  });
}

function toggleSeleccion(id) {
  if (state.seleccionadas.has(id)) state.seleccionadas.delete(id);
  else state.seleccionadas.add(id);
  updateSelBar();
  _syncSeleccionVisual(id);
}

function _syncSeleccionVisual(id) {
  const isSelected = state.seleccionadas.has(id);
  // Card view
  const card = document.querySelector(`.hu-card[data-id="${CSS.escape(id)}"]`);
  if (card) {
    card.classList.toggle('selected', isSelected);
    const cb = card.querySelector('.hu-card-check');
    if (cb) cb.checked = isSelected;
  }
  // List view
  const row = document.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
  if (row) {
    row.classList.toggle('row-selected', isSelected);
    const cb = row.querySelector('.row-check');
    if (cb) cb.checked = isSelected;
  }
}

function updateSelBar() {
  const bar = document.getElementById('sel-bar');
  const cnt = document.getElementById('sel-count');
  if (!bar) return;
  const n = state.seleccionadas.size;
  cnt.textContent = `${n} seleccionada${n !== 1 ? 's' : ''}`;
  if (n > 0 || state.modoSeleccion) bar.classList.remove('hidden');
  else bar.classList.add('hidden');

  // Render chips showing which stories are selected (ID + truncated title)
  const chipsEl = document.getElementById('sel-chips');
  if (chipsEl) {
    if (n === 0) {
      chipsEl.innerHTML = '';
    } else {
      const ids = [...state.seleccionadas];
      const MAX_CHIPS = 5;
      const shown = ids.slice(0, MAX_CHIPS);
      const extra = ids.length - shown.length;
      const getLabel = id => {
        const h = state.historias.find(x => x.id === id);
        return h ? `${id} · ${h.resumen.length > 30 ? h.resumen.slice(0, 28) + '…' : h.resumen}` : id;
      };
      chipsEl.innerHTML =
        shown.map(id => `<span class="sel-chip" title="${esc(getLabel(id))}">${esc(id)}</span>`).join('') +
        (extra > 0 ? `<span class="sel-chips-more">+${extra} más</span>` : '');
    }
  }

  // Sincronizar el checkbox "Seleccionar todo" con el estado real:
  // marcarlo si todas las filas visibles están seleccionadas.
  const checkAll = document.getElementById('check-all');
  if (checkAll) {
    const visibleIds = [...document.querySelectorAll('#historias-content tr[data-id]')].map(r => r.dataset.id);
    checkAll.checked = visibleIds.length > 0 && visibleIds.every(id => state.seleccionadas.has(id));
  }
}

function setupSelBar() {
  const bar = document.getElementById('sel-bar');
  if (!bar) return;
  document.getElementById('btn-sel-pdf')?.addEventListener('click', () => {
    if (!state.seleccionadas.size) { toast('Selecciona al menos una historia', 'warn'); return; }
    import('./export.js').then(m => m.exportarPDF());
  });
  document.getElementById('btn-sel-csv')?.addEventListener('click', () => {
    if (!state.seleccionadas.size) { toast('Selecciona al menos una historia', 'warn'); return; }
    import('./export.js').then(m => m.exportarCSV());
  });
  document.getElementById('btn-sel-md')?.addEventListener('click',  () => {
    if (!state.seleccionadas.size) { toast('Selecciona al menos una historia', 'warn'); return; }
    import('./export.js').then(m => m.exportarTodo());
  });
  document.getElementById('btn-sel-jira')?.addEventListener('click', () => {
    if (!state.seleccionadas.size) return;
    if (!state.jiraCfg?.email || !state.jiraCfg?.token) {
      toast('Configura Jira primero en ⚙ Configuración', 'warn'); return;
    }
    mostrarModalJiraBulk([...state.seleccionadas]);
  });
  document.getElementById('btn-sel-del')?.addEventListener('click', () => {
    if (!state.seleccionadas.size) return;
    const n = state.seleccionadas.size;
    // Snapshot antes de eliminar para poder hacer undo
    const saved = [...state.seleccionadas].map(id => state.historias.find(h => h.id === id)).filter(Boolean);
    showConfirm('¿Eliminar seleccionadas?', `Se eliminarán ${n} historias. Podrás deshacer por 5 segundos.`, () => {
      saved.forEach(h => eliminarHistoriaById(h.id));
      state.seleccionadas.clear();
      renderHistoriasList();
      toastAction(`${n} historia${n !== 1 ? 's' : ''} eliminada${n !== 1 ? 's' : ''}`, 'Deshacer', () => {
        state.historias.push(...saved);
        guardar();
        renderHistoriasList();
      });
    });
  });
}

async function mostrarModalJiraBulk(ids) {
  const historias = ids.map(id => state.historias.find(h => h.id === id)).filter(Boolean);
  if (!historias.length) return;
  const proj  = state.proyectos.find(p => p.id === state.proyectoActivoId);
  let proyKey = proj?.jiraKey || '';

  let modal = document.getElementById('modal-jira-bulk');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-jira-bulk';
    modal.className = 'modal-overlay hidden';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3>Enviar ${historias.length} historia${historias.length !== 1 ? 's' : ''} a Jira</h3>
        <button class="modal-close" id="btn-close-jira-bulk">✕</button>
      </div>
      <div class="modal-body" id="jira-bulk-body">
        <div class="jira-confirm-preview" style="margin-bottom:.75rem">

          <div class="jira-confirm-row">
            <span class="jira-confirm-label">Proyecto Jira</span>
            <div class="jira-proj-picker-inline">
              <strong id="jira-bulk-key">${esc(proyKey || '—')}</strong>
              <button class="btn btn-ghost btn-xs" id="btn-jira-bulk-pick" type="button">Cambiar ↓</button>
            </div>
          </div>
          <div id="jira-bulk-proj-wrap" class="hidden" style="margin:.25rem 0 .5rem 0"></div>

          <div class="jira-confirm-row">
            <span class="jira-confirm-label">Tipo de incidencia</span>
            <div style="display:flex;align-items:center;gap:.5rem">
              <select id="jira-bulk-type" class="form-control" style="width:auto;font-size:.82rem;padding:.25rem .5rem">
                <option value="">Cargando tipos…</option>
              </select>
              <span id="jira-bulk-type-hint" style="font-size:.72rem;color:var(--text-muted)"></span>
            </div>
          </div>

        </div>
        <div class="jira-bulk-list">
          ${historias.map(h => `
            <div class="jira-bulk-item" data-bulk-id="${esc(h.id)}">
              <div class="jira-bulk-item-info">
                <span class="jira-bulk-item-key">${esc(h.id)}</span>
                <span class="jira-bulk-item-title">${esc(h.resumen)}</span>
                ${h.jiraIssueKey ? `<span class="jira-bulk-resend" title="Ya enviada como ${esc(h.jiraIssueKey)}">↻ ${esc(h.jiraIssueKey)}</span>` : ''}
              </div>
              <span class="jira-bulk-status" id="bulk-status-${esc(h.id)}"></span>
            </div>`).join('')}
        </div>
        <div id="jira-bulk-summary" class="test-result hidden" style="margin-top:.75rem"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="btn-cancel-jira-bulk">Cancelar</button>
        <button class="btn btn-accent" id="btn-confirm-jira-bulk">🚀 Enviar ${historias.length} historia${historias.length !== 1 ? 's' : ''}</button>
      </div>
    </div>`;

  modal.classList.remove('hidden');

  const closeModal = () => modal.classList.add('hidden');
  document.getElementById('btn-close-jira-bulk').onclick = closeModal;
  document.getElementById('btn-cancel-jira-bulk').onclick = closeModal;

  // Load real issue types for a given project key and populate the select
  async function cargarTipos(key) {
    const sel  = document.getElementById('jira-bulk-type');
    const hint = document.getElementById('jira-bulk-type-hint');
    if (!sel || !key) return;
    sel.innerHTML = `<option value="">Cargando…</option>`;
    if (hint) hint.textContent = '';
    try {
      const { obtenerTiposIssue } = await import('./jira.js');
      const tipos = await obtenerTiposIssue(key);
      if (!tipos.length) {
        sel.innerHTML = JIRA_TIPOS.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
        if (hint) hint.textContent = '(tipos estándar)';
        return;
      }
      sel.innerHTML = tipos.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
      if (hint) hint.textContent = `(${tipos.length} tipos reales)`;
    } catch {
      sel.innerHTML = JIRA_TIPOS.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
      if (hint) hint.textContent = '(tipos estándar)';
    }
  }

  // Auto-load types on open if project is already configured
  if (proyKey) cargarTipos(proyKey);

  document.getElementById('btn-jira-bulk-pick').onclick = async () => {
    const wrap = document.getElementById('jira-bulk-proj-wrap');
    if (!wrap.classList.contains('hidden')) { wrap.classList.add('hidden'); return; }
    wrap.innerHTML = `<span class="test-spinner" style="margin-right:.4rem"></span><span style="font-size:.82rem;color:var(--text-muted)">Cargando proyectos…</span>`;
    wrap.classList.remove('hidden');
    try {
      const { listarProyectosJira } = await import('./jira.js');
      const projects = await listarProyectosJira();
      if (!projects.length) { wrap.innerHTML = `<span style="font-size:.82rem;color:var(--text-muted)">Sin proyectos disponibles</span>`; return; }
      wrap.innerHTML = `
        <div style="display:flex;gap:.4rem;align-items:center;flex-wrap:wrap">
          <select class="form-control" id="jira-bulk-proj-select" style="flex:1;min-width:180px;font-size:.82rem;padding:.25rem .5rem">
            ${projects.map(p => `<option value="${esc(p.key)}"${p.key === proyKey ? ' selected' : ''}>${esc(p.key)} — ${esc(p.name)}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-accent" id="btn-apply-jira-bulk-proj" type="button">Aplicar</button>
        </div>`;
      document.getElementById('btn-apply-jira-bulk-proj').onclick = () => {
        proyKey = document.getElementById('jira-bulk-proj-select').value;
        document.getElementById('jira-bulk-key').textContent = proyKey;
        wrap.classList.add('hidden');
        if (proj) { proj.jiraKey = proyKey; guardar(); }
        cargarTipos(proyKey);
      };
    } catch (err) {
      wrap.innerHTML = `<span style="color:var(--error-color);font-size:.82rem">✕ ${esc(err.message)}</span>`;
    }
  };

  document.getElementById('btn-confirm-jira-bulk').onclick = async () => {
    if (!proyKey) { toast('Selecciona un proyecto Jira primero', 'warn'); return; }

    const confirmBtn = document.getElementById('btn-confirm-jira-bulk');
    const cancelBtn  = document.getElementById('btn-cancel-jira-bulk');
    confirmBtn.disabled = true;
    cancelBtn.disabled  = true;
    document.getElementById('btn-close-jira-bulk').disabled = true;

    const { crearIssueEnJira } = await import('./jira.js');
    const tipoSeleccionado = document.getElementById('jira-bulk-type')?.value || '';
    let ok = 0, fail = 0;

    for (const h of historias) {
      const statusEl = document.getElementById(`bulk-status-${h.id}`);
      const itemEl   = document.querySelector(`.jira-bulk-item[data-bulk-id="${CSS.escape(h.id)}"]`);
      if (statusEl) statusEl.innerHTML = `<span class="test-spinner"></span>`;

      try {
        const hParaEnviar = tipoSeleccionado ? { ...h, tipo: tipoSeleccionado } : h;
        const result   = await crearIssueEnJira(hParaEnviar, proyKey);
        const issueKey = result.key;
        const issueUrl = `${state.jiraCfg.baseUrl}/browse/${issueKey}`;
        actualizarHistoria(h.id, { jiraIssueKey: issueKey, sincJira: true, jiraIssueUrl: issueUrl });
        h.jiraIssueKey = issueKey; h.sincJira = true; h.jiraIssueUrl = issueUrl;
        if (statusEl) statusEl.innerHTML = `<a href="${esc(issueUrl)}" target="_blank" rel="noopener" class="jira-bulk-link">${esc(issueKey)} ↗</a>`;
        if (itemEl) itemEl.classList.add('jira-bulk-item-ok');
        ok++;
      } catch (e) {
        if (statusEl) statusEl.innerHTML = `<span class="jira-bulk-err">✕ ${esc(e.message)}</span>`;
        if (itemEl) itemEl.classList.add('jira-bulk-item-err');
        fail++;
      }
    }

    const summary = document.getElementById('jira-bulk-summary');
    summary.className = `test-result test-result-${fail === 0 ? 'ok' : 'error'}`;
    summary.innerHTML = `<strong>${fail === 0 ? '✓' : '⚠'}</strong> ${ok} issue${ok !== 1 ? 's' : ''} creado${ok !== 1 ? 's' : ''} en Jira${fail ? ` · ${fail} con error — revisa los mensajes arriba` : ''}.`;
    summary.classList.remove('hidden');

    cancelBtn.textContent = 'Cerrar';
    cancelBtn.disabled    = false;
    document.getElementById('btn-close-jira-bulk').disabled = false;
    if (ok > 0) toast(`${ok} issue${ok !== 1 ? 's' : ''} creado${ok !== 1 ? 's' : ''} en Jira ✓`);
  };
}

function copyHU(h) {
  const criteriosText = (h.criterios || []).slice(0, 6).map(c => {
    const pasos = (c.pasos || []).map(p => `  ${p.kw === 'And' ? '  ' : ''}${p.kw} ${p.texto}`).join('\n');
    return `• ${c.titulo}\n${pasos}`;
  }).join('\n\n');

  const lines = [
    `[${h.id}] ${h.resumen}`,
    '',
    `Como ${h.como}, quiero ${h.quiero}, para ${h.para}.`,
    '',
    `Tipo: ${h.tipo}  |  Prioridad: ${h.prioridad}${h.storyPoints != null ? `  |  SP: ${h.storyPoints}` : ''}`,
  ];
  if (h.descripcion) lines.push('', h.descripcion);
  if (criteriosText) lines.push('', 'Criterios de aceptación:', criteriosText);

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => toast('Historia copiada al portapapeles ✓'))
    .catch(() => toast('No se pudo copiar — intenta desde HTTPS', 'warn'));
}

// ── HISTORIA FORM ─────────────────────────────────────────────────────────────
export function renderHistoriaForm() {
  document.getElementById('view').innerHTML = `
<div class="form-view">
  <div class="form-view-header">
    <h1 class="page-title">Forjar Historia</h1>
    <p class="page-sub">Completa los campos para generar criterios Gherkin y test cases automáticamente</p>
  </div>
  <div class="form-card">
    <form id="form-hu" novalidate>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="hu-tipo">Tipo (Jira issuetype)</label>
          <select id="hu-tipo" class="form-control">
            ${JIRA_TIPOS.map(t => `<option value="${t}"${t==='Story'?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="hu-prioridad">Prioridad</label>
          <select id="hu-prioridad" class="form-control">
            ${JIRA_PRIORIDADES.map(p => `<option value="${p}"${p==='Medium'?' selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="hu-sp">Story Points</label>
          <input type="number" id="hu-sp" class="form-control" placeholder="—" min="0" max="100">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="hu-resumen">Resumen * <span class="form-hint">max 255 caracteres</span></label>
        <input type="text" id="hu-resumen" class="form-control" placeholder="Título descriptivo de la historia" maxlength="255" required>
        <div class="char-count" id="char-count">0 / 255</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="hu-como">Como (rol) *</label>
          <input type="text" id="hu-como" class="form-control" placeholder="usuario registrado, administrador…" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="hu-quiero">Quiero (acción) *</label>
          <input type="text" id="hu-quiero" class="form-control" placeholder="poder iniciar sesión con email…" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="hu-para">Para (objetivo) *</label>
        <input type="text" id="hu-para" class="form-control" placeholder="acceder a mi cuenta de forma segura…" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="hu-desc">Descripción y contexto</label>
        <textarea id="hu-desc" class="form-control" rows="3" placeholder="Contexto adicional, restricciones, reglas de negocio…"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Etiquetas</label>
        <div class="tag-input-wrap" id="tag-input-wrap">
          <div class="tag-chips" id="tag-chips"></div>
          <input type="text" id="tag-input" class="tag-input" placeholder="Escribe y presiona Enter o coma…">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Links de referencia</label>
        <div id="links-list"></div>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-add-link">+ Agregar link</button>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="window.location.hash='#/historias'">Cancelar</button>
        <button type="submit" class="btn btn-accent" id="btn-crear-hu" disabled>Crear historia</button>
      </div>
    </form>
  </div>
</div>`;

  setupTagInput();
  setupLinksInput();
  setupFormValidation();
}

function setupTagInput(initialTags = []) {
  const tags = [];
  const chips = document.getElementById('tag-chips');
  const input = document.getElementById('tag-input');

  function addTag(val) {
    const v = val.trim().toLowerCase().replace(/[^a-z0-9-_áéíóúñ]/gi, '');
    if (!v || tags.includes(v)) return;
    tags.push(v);
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${esc(v)}<button type="button" data-tag="${esc(v)}" aria-label="Quitar ${esc(v)}">×</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      tags.splice(tags.indexOf(v), 1);
      chip.remove();
      input.dataset.tags = JSON.stringify(tags);
    });
    chips.appendChild(chip);
    input.value = '';
    input.dataset.tags = JSON.stringify(tags);
  }

  initialTags.forEach(t => addTag(t));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input.value); }
    if (e.key === 'Backspace' && !input.value && tags.length) {
      tags.pop();
      chips.lastElementChild?.remove();
      input.dataset.tags = JSON.stringify(tags);
    }
  });
  input.addEventListener('blur', () => { if (input.value.trim()) addTag(input.value); });
}

function setupLinksInput(initialLinks = []) {
  const list = document.getElementById('links-list');
  const TIPOS_LINK = ['Mockup', 'Documento', 'Figma', 'Otro'];

  function addLinkRow(link = null) {
    const idx = list.children.length;
    const row = document.createElement('div');
    row.className = 'link-row';
    row.innerHTML = `
      <select class="form-control link-tipo" data-idx="${idx}">
        ${TIPOS_LINK.map(t => `<option value="${t}"${link && t === link.tipo ? ' selected' : ''}>${t}</option>`).join('')}
      </select>
      <input type="url" class="form-control link-url" placeholder="https://…" data-idx="${idx}" value="${link ? esc(link.url) : ''}">
      <input type="text" class="form-control link-desc" placeholder="Descripción" data-idx="${idx}" value="${link ? esc(link.desc || '') : ''}">
      <button type="button" class="btn-icon btn-icon-del" data-remove="${idx}">✕</button>`;
    row.querySelector('[data-remove]').addEventListener('click', () => row.remove());
    list.appendChild(row);
  }

  initialLinks.filter(l => l.url && !l.url.startsWith('data:')).forEach(l => addLinkRow(l));
  document.getElementById('btn-add-link').addEventListener('click', () => addLinkRow());
}

function setupFormValidation() {
  const resumen = document.getElementById('hu-resumen');
  const como    = document.getElementById('hu-como');
  const quiero  = document.getElementById('hu-quiero');
  const para    = document.getElementById('hu-para');
  const btn     = document.getElementById('btn-crear-hu');
  const counter = document.getElementById('char-count');

  function validate() {
    const ok = resumen.value.trim() && como.value.trim() && quiero.value.trim() && para.value.trim();
    btn.disabled = !ok;
    counter.textContent = `${resumen.value.length} / 255`;
  }

  [resumen, como, quiero, para].forEach(el => el.addEventListener('input', validate));
  resumen.addEventListener('input', validate);

  document.getElementById('form-hu').addEventListener('submit', e => {
    e.preventDefault();
    const tagsRaw = document.getElementById('tag-input').dataset.tags;
    const etiquetas = tagsRaw ? JSON.parse(tagsRaw) : [];

    const links = [...document.querySelectorAll('.link-row')].map(row => ({
      tipo: row.querySelector('.link-tipo').value,
      url:  row.querySelector('.link-url').value.trim(),
      desc: row.querySelector('.link-desc').value.trim()
    })).filter(l => l.url);

    const h = crearHistoriaData({
      tipo:        document.getElementById('hu-tipo').value,
      resumen:     resumen.value.trim(),
      como:        como.value.trim(),
      quiero:      quiero.value.trim(),
      para:        para.value.trim(),
      descripcion: document.getElementById('hu-desc').value.trim(),
      etiquetas,
      prioridad:   document.getElementById('hu-prioridad').value,
      storyPoints: document.getElementById('hu-sp').value || null,
      links
    });
    toast('Historia creada con ' + h.criterios.length + ' criterios y ' + h.testCases.length + ' test cases');
    navigate(`/historias/${h.id}`);
  });
}

// ── IMAGE FORM ────────────────────────────────────────────────────────────────
export function renderImageForm() {
  const cfg = state.apiCfg;
  const hasApi = !!(cfg?.key);
  const PROVIDER_LABELS = { claude: 'Claude', openai: 'OpenAI', grok: 'Grok (xAI)', groq: 'Groq' };
  const aiStatusHtml = hasApi
    ? `<div class="ai-status ai-status-ok">✓ IA activa — ${esc(PROVIDER_LABELS[cfg.provider] || cfg.provider)} · ${esc(cfg.model)}</div>`
    : `<div class="ai-status ai-status-warn">⚠ Sin IA configurada — la imagen <strong>no será analizada</strong>, se generará una historia genérica por tipo de pantalla. <a href="#/config" class="ai-cfg-link">Configurar API →</a></div>`;

  document.getElementById('view').innerHTML = `
<div class="form-view">
  <div class="form-view-header">
    <h1 class="page-title">Visión a Historia</h1>
    <p class="page-sub">Sube un mockup o captura y genera automáticamente la historia de usuario</p>
  </div>
  <div class="form-card">
    ${aiStatusHtml}

    <div class="form-group">
      <label class="form-label">Tipo de mockup</label>
      <select id="img-tipo-mockup" class="form-control">
        ${['Login','Formulario','Dashboard','Checkout','Listado','Detalle','Otro'].map(t => `<option>${t}</option>`).join('')}
      </select>
    </div>

    <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-label="Área de carga de imagen">
      <div class="dz-icon">🖼</div>
      <div class="dz-title">Arrastra tu imagen aquí</div>
      <div class="dz-sub">PNG, JPG · máx 5 MB</div>
      <input type="file" id="file-input" accept="image/*" class="dz-file-input" aria-label="Seleccionar imagen">
      <button type="button" class="btn btn-ghost btn-sm dz-btn" onclick="document.getElementById('file-input').click()">Seleccionar archivo</button>
    </div>
    <div class="img-preview hidden" id="img-preview">
      <img id="preview-img" src="" alt="Vista previa del mockup" class="preview-img">
      <button type="button" class="btn btn-ghost btn-sm" id="btn-clear-img">Quitar imagen</button>
    </div>

    <div class="form-group" style="margin-top:1rem">
      <label class="form-label" for="img-notas">Notas sobre la imagen <span class="form-hint">(opcional — ayuda a la IA a entender el contexto)</span></label>
      <textarea id="img-notas" class="form-control" rows="3" placeholder="¿Qué muestra esta pantalla? ¿Qué flujo representa? ¿Hay restricciones de negocio?"></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" onclick="window.location.hash='#/historias'">Cancelar</button>
      <button type="button" class="btn btn-accent" id="btn-gen-imagen" disabled>${hasApi ? 'Analizar con IA' : 'Generar historia'}</button>
    </div>
  </div>
</div>`;

  setupDropzone();
  document.getElementById('btn-gen-imagen').addEventListener('click', generarDesdeImagen);

  // If image was pre-loaded from dashboard drag & drop, show preview immediately
  if (state.imagenBase64) {
    document.getElementById('preview-img').src = `data:${state.imagenType};base64,${state.imagenBase64}`;
    document.getElementById('img-preview').classList.remove('hidden');
    document.getElementById('dropzone').classList.add('hidden');
    document.getElementById('btn-gen-imagen').disabled = false;
  }
}

function setupDropzone() {
  const dz   = document.getElementById('dropzone');
  const fi   = document.getElementById('file-input');

  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processImageFile(file);
  });
  fi.addEventListener('change', e => { if (e.target.files[0]) processImageFile(e.target.files[0]); });
  document.getElementById('btn-clear-img')?.addEventListener('click', clearImage);
}

function processImageFile(file) {
  if (!file.type.startsWith('image/')) { toast('El archivo debe ser una imagen', 'warn'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('La imagen supera 5 MB — elige una más pequeña', 'warn'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    const dataUrl = ev.target.result;
    state.imagenBase64 = dataUrl.split(',')[1];
    state.imagenType   = file.type;
    document.getElementById('preview-img').src = dataUrl;
    document.getElementById('img-preview').classList.remove('hidden');
    document.getElementById('dropzone').classList.add('hidden');
    document.getElementById('btn-gen-imagen').disabled = false;
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  state.imagenBase64 = null;
  state.imagenType   = null;
  document.getElementById('preview-img').src = '';
  document.getElementById('img-preview').classList.add('hidden');
  document.getElementById('dropzone').classList.remove('hidden');
  document.getElementById('btn-gen-imagen').disabled = true;
}

async function generarDesdeImagen() {
  const tipo    = document.getElementById('img-tipo-mockup').value;
  const notas   = document.getElementById('img-notas').value.trim();
  const imgB64  = state.imagenBase64;
  const imgType = state.imagenType;

  if (state.apiCfg?.key && imgB64) {
    const btn = document.getElementById('btn-gen-imagen');
    btn.disabled = true;
    btn.textContent = 'Analizando con IA…';
    toast('Analizando imagen con IA…', 'info');

    const items = await generarHistoriasDesdeImagenConIA(imgB64, imgType, tipo, notas);

    if (items && items.length > 0) {
      const mockupLink = { tipo: 'Mockup', url: `data:${imgType};base64,${imgB64}`, desc: `Mockup ${tipo}` };
      const creadas = crearHistoriasDesdeIA(items, 'ia', 'vision-imagen');
      creadas.forEach(h => {
        if (!h.imagenes) h.imagenes = [];
        h.imagenes.push({ id: Date.now(), src: `data:${imgType};base64,${imgB64}`, desc: `Mockup ${tipo}` });
        if (!h.links) h.links = [];
        h.links.push(mockupLink);
      });
      guardar();
      state.imagenBase64 = null;
      state.imagenType   = null;
      toast(`${creadas.length} historia${creadas.length !== 1 ? 's' : ''} generada${creadas.length !== 1 ? 's' : ''} con IA desde imagen`);
      navigate('/historias');
      return;
    }
    // API returned nothing — error toast already shown by import.js
    if (btn) { btn.disabled = false; btn.textContent = 'Analizar con IA'; }
    return;
  }

  const PLANTILLAS = {
    Login:      { como: 'usuario no autenticado', quiero: 'iniciar sesión con mis credenciales', para: 'acceder de forma segura a la plataforma' },
    Formulario: { como: 'usuario del sistema', quiero: 'completar y enviar el formulario', para: 'registrar la información requerida' },
    Dashboard:  { como: 'usuario autenticado', quiero: 'ver el resumen de métricas y acciones rápidas', para: 'tener visibilidad del estado general' },
    Checkout:   { como: 'cliente con carrito activo', quiero: 'completar el proceso de pago', para: 'finalizar mi compra de forma segura' },
    Listado:    { como: 'usuario del sistema', quiero: 'ver, filtrar y gestionar el listado de items', para: 'encontrar y operar sobre la información' },
    Detalle:    { como: 'usuario del sistema', quiero: 'ver el detalle completo del item seleccionado', para: 'obtener toda la información necesaria para tomar decisiones' },
    Otro:       { como: 'usuario del sistema', quiero: 'interactuar con la funcionalidad mostrada', para: 'completar la tarea correspondiente' }
  };

  const t = PLANTILLAS[tipo] || PLANTILLAS['Otro'];
  const descripcion = `Pantalla tipo ${tipo}.${notas ? ' ' + notas : ''} Generado desde imagen.`;
  const links = imgB64
    ? [{ tipo: 'Mockup', url: `data:${imgType};base64,${imgB64}`, desc: `Mockup ${tipo}` }]
    : [];

  const h = crearHistoriaData({
    tipo: 'Story', resumen: `Vista ${tipo} — ${notas ? notas.slice(0, 60) : 'desde imagen'}`,
    como: t.como, quiero: t.quiero, para: t.para,
    descripcion, etiquetas: ['mockup', tipo.toLowerCase()], prioridad: 'Medium',
    storyPoints: null, links
  });

  if (imgB64) {
    if (!h.imagenes) h.imagenes = [];
    h.imagenes.push({ id: Date.now(), src: `data:${imgType};base64,${imgB64}`, desc: `Mockup ${tipo}` });
    guardar();
  }

  state.imagenBase64 = null;
  state.imagenType   = null;
  toast('Historia generada con plantilla genérica. Configura tu API en ⚙ Configuración para análisis real con IA.', 'warn');
  state.tabActual = 'mockups';
  navigate(`/historias/${h.id}`);
}

// ── HISTORIA DETAIL ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'resumen',   icon: '📌', label: 'Resumen'    },
  { id: 'criterios', icon: '✅', label: 'Criterios'  },
  { id: 'testcases', icon: '🧪', label: 'Test Cases' },
  { id: 'mockups',   icon: '🎨', label: 'Mockups'    },
  { id: 'jira',      icon: '🔗', label: 'Jira'       }
];

export function renderHistoriaDetail(id) {
  const h = state.historias.find(h => h.id === id);
  if (!h) { document.getElementById('view').innerHTML = `<div class="empty-state"><h3>Historia no encontrada</h3><a href="#/historias" class="btn btn-outline">Volver</a></div>`; return; }

  state.idActual = id;
  const tab = state.tabActual || 'resumen';
  state.tabActual = 'resumen';

  document.getElementById('view').innerHTML = `
<div class="detail-wrap">
  <div class="detail-header">
    <div class="detail-header-left">
      <div class="detail-id-badge"><span class="badge badge-tipo-jira">${esc(h.tipo)}</span> <span class="hu-id">${esc(h.id)}</span></div>
      <h1 class="detail-title">${esc(h.resumen)}</h1>
      <div class="detail-meta">
        <span class="badge badge-${(h.prioridad||'').toLowerCase()}">${esc(h.prioridad)}</span>
        ${h.storyPoints != null ? `<span class="badge badge-sp">${h.storyPoints} SP</span>` : ''}
        ${(h.etiquetas||[]).map(t => `<span class="badge badge-tag">${esc(t)}</span>`).join('')}
        <span class="detail-date">Creada ${formatDate(h.creadoEn)}</span>
      </div>
    </div>
    <div class="detail-header-right">
      <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#/historias'">← Volver</button>
      <button class="btn btn-ghost btn-sm" id="btn-copy-hu">📋 Copiar</button>
      <button class="btn btn-outline btn-sm" onclick="window.location.hash='#/historias/${esc(h.id)}/editar'">✏ Editar</button>
    </div>
  </div>

  <nav class="tabs" role="tablist" aria-label="Secciones de la historia">
    ${TABS.map(t => `
      <button class="tab-btn${t.id === tab ? ' active' : ''}" role="tab" aria-selected="${t.id === tab}" data-tab="${t.id}">
        <span class="tab-icon">${t.icon}</span> ${t.label}
      </button>`).join('')}
  </nav>

  <div id="tab-content" class="tab-content">
    ${renderTab(h, tab)}
  </div>
</div>`;

  document.querySelector('.tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
      b.setAttribute('aria-selected', b.dataset.tab === tabId);
    });
    document.getElementById('tab-content').innerHTML = renderTab(h, tabId);
    bindTabEvents(h, tabId);
  });

  document.getElementById('btn-copy-hu')?.addEventListener('click', () => copyHU(h));
  bindTabEvents(h, tab);
}

function renderTab(h, tab) {
  switch (tab) {
    case 'resumen':   return renderTabResumen(h);
    case 'criterios': return renderTabCriterios(h);
    case 'testcases': return renderTabTestCases(h);
    case 'mockups':   return renderTabMockups(h);
    case 'jira':      return renderTabJira(h);
    default:          return '';
  }
}

function bindTabEvents(h, tab) {
  if (tab === 'criterios') {
    document.getElementById('btn-regen-criterios')?.addEventListener('click', () => {
      h.criterios = generarCriterios(h);
      // Test cases se regeneran independientemente — NO son una derivación de los criterios
      h.testCases = generarTestCases(h);
      actualizarHistoria(h.id, { criterios: h.criterios, testCases: h.testCases });
      document.getElementById('tab-content').innerHTML = renderTabCriterios(h);
      bindTabEvents(h, 'criterios');
      toast(`${h.criterios.length} criterios regenerados · ${h.testCases.length} test cases actualizados`);
    });
  }
  if (tab === 'testcases') {
    document.getElementById('btn-add-tc')?.addEventListener('click', () => {
      const n = (h.testCases || []).length + 1;
      const tc = mkTestCase(h.id, n);
      h.testCases = [...(h.testCases || []), tc];
      actualizarHistoria(h.id, { testCases: h.testCases });
      document.getElementById('tab-content').innerHTML = renderTabTestCases(h);
      bindTabEvents(h, 'testcases');
    });

    // Dropdown exportar TCs
    const exportBtn  = document.getElementById('btn-export-tcs');
    const exportMenu = document.getElementById('tc-export-menu');
    if (exportBtn && exportMenu) {
      exportBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = exportMenu.classList.toggle('tc-export-menu--open');
        exportMenu.setAttribute('aria-hidden', String(!open));
      });
      exportMenu.addEventListener('click', e => {
        const opt = e.target.closest('[data-export-fmt]');
        if (!opt) return;
        exportMenu.classList.remove('tc-export-menu--open');
        exportMenu.setAttribute('aria-hidden', 'true');
        const fmt = opt.dataset.exportFmt;
        import('./export.js').then(m => {
          if (fmt === 'csv')  m.exportarTCsDeHU(h);
          if (fmt === 'md')   m.exportarTCsMd(h);
          if (fmt === 'clip') m.copiarTCsClipboard(h);
        });
      });
      // Cerrar al clic fuera
      document.addEventListener('click', function closeMenu(e) {
        if (!document.getElementById('tc-export-wrap')?.contains(e.target)) {
          exportMenu.classList.remove('tc-export-menu--open');
          exportMenu.setAttribute('aria-hidden', 'true');
          document.removeEventListener('click', closeMenu);
        }
      });
    }

    // Delegación: eliminar TC o abrir drawer
    document.getElementById('tc-list-wrap')?.addEventListener('click', e => {
      const del  = e.target.closest('[data-del-tc]');
      const card = e.target.closest('.tc-card-clickable');

      if (del) {
        e.stopPropagation();
        e.preventDefault();
        const idx = Number(del.dataset.delTc);
        h.testCases.splice(idx, 1);
        actualizarHistoria(h.id, { testCases: h.testCases });
        document.getElementById('tab-content').innerHTML = renderTabTestCases(h);
        bindTabEvents(h, 'testcases');
      } else if (card) {
        const idx = Number(card.dataset.tcIdx);
        const tc  = (h.testCases || [])[idx];
        if (tc) abrirDrawerTC(tc, h, h.testCases || []);
      }
    });

    // Teclado: Enter/Space en tarjeta también abre el drawer
    document.getElementById('tc-list-wrap')?.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.tc-card-clickable');
      if (!card) return;
      e.preventDefault();
      const idx = Number(card.dataset.tcIdx);
      const tc  = (h.testCases || [])[idx];
      if (tc) abrirDrawerTC(tc, h, h.testCases || []);
    });
  }
  if (tab === 'jira') {
    document.getElementById('btn-copiar-jira')?.addEventListener('click', () => {
      const payload = buildJiraPayload(h);
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
        .then(() => toast('Payload JSON copiado'));
    });
    document.getElementById('btn-enviar-jira')?.addEventListener('click', () => {
      mostrarModalEnvioJira(h);
    });
  }
}

// TAB RENDERERS ───────────────────────────────────────────────────────────────
function renderTabResumen(h) {
  const linksHtml = (h.links || []).length
    ? `<div class="form-group"><label class="form-label">Links de referencia</label>
       <div class="links-list">${h.links.map(l => `
         <div class="link-item"><span class="badge badge-tag">${esc(l.tipo)}</span>
         <a href="${esc(l.url)}" target="_blank" rel="noopener" class="link-url-text">${esc(l.desc || l.url)}</a></div>`).join('')}
       </div></div>` : '';

  return `<div class="tab-resumen">
    <div class="resumen-story">
      <div class="story-fmt">
        Como <strong>${esc(h.como)}</strong>,
        quiero <em>${esc(h.quiero)}</em>,
        para <em>${esc(h.para)}</em>.
      </div>
      ${h.descripcion ? `<div class="story-desc">${esc(h.descripcion)}</div>` : ''}
    </div>
    <div class="resumen-meta-grid">
      <div class="meta-item"><div class="meta-label">Tipo</div><div>${esc(h.tipo)}</div></div>
      <div class="meta-item"><div class="meta-label">Prioridad</div><div>${esc(h.prioridad)}</div></div>
      <div class="meta-item"><div class="meta-label">Story Points</div><div>${h.storyPoints ?? '—'}</div></div>
      <div class="meta-item"><div class="meta-label">Creada</div><div>${formatDate(h.creadoEn)}</div></div>
    </div>
    ${linksHtml}
  </div>`;
}

const KW_CLASS = {
  Escenario:'kw-esc', Scenario:'kw-esc',
  Dado:'kw-dado',     Given:'kw-dado',
  Cuando:'kw-cuando', When:'kw-cuando',
  Entonces:'kw-entonces', Then:'kw-entonces',
  Y:'kw-y',           And:'kw-y'
};

function renderTabCriterios(h) {
  const crits = h.criterios || [];
  const TIPO_CLASSES = { positivo:'gb-pos', negativo:'gb-neg', boundary:'gb-bnd', nf:'gb-nf', condicional:'gb-cnd' };
  const TIPO_LABELS  = { positivo:'POSITIVO', negativo:'NEGATIVO', boundary:'BOUNDARY', nf:'NO FUNCIONAL', condicional:'CONDICIONAL' };

  return `<div class="tab-criterios">
    <div class="tab-toolbar">
      <span class="tab-count">${crits.length} criterio${crits.length !== 1 ? 's' : ''} de aceptación</span>
      <button class="btn btn-ghost btn-sm" id="btn-regen-criterios">↺ Regenerar</button>
    </div>
    ${crits.map(c => `
      <div class="gherkin-block">
        <div class="gherkin-header">
          <span class="gb-id">${esc(c.id)}</span>
          <span class="gb-badge ${TIPO_CLASSES[c.tipo] || 'gb-pos'}">${TIPO_LABELS[c.tipo] || c.tipo.toUpperCase()}</span>
          <span class="gb-title">${esc(c.titulo)}</span>
        </div>
        <pre class="gherkin-pre">${(c.pasos || []).map(p => {
          const cls = KW_CLASS[p.kw] || '';
          const isY = p.kw === 'Y' || p.kw === 'And';
          const pad = isY ? '    ' : '';
          return `${pad}<span class="${cls}">${esc(p.kw)}</span> ${esc(p.texto)}`;
        }).join('\n')}</pre>
      </div>`).join('')}
  </div>`;
}

const ESTADO_CLASS = { 'No ejecutado':'tc-noej', 'Pasó':'tc-paso', 'Falló':'tc-fallo', 'Bloqueado':'tc-bloq' };

const TC_TAG_CLASS = { unit_test:'tc-tag-unit', integration:'tc-tag-integ', end_to_end:'tc-tag-e2e' };
const TC_TAG_LABEL = { unit_test:'Unit', integration:'Integration', end_to_end:'E2E' };

function renderTabTestCases(h) {
  const tcs = h.testCases || [];

  const TAG_LABEL = { smoke:'Smoke', regression:'Regresión', integration:'Integración', end_to_end:'E2E', security:'Seguridad', performance:'Performance', ui:'UI', api:'API' };
  const TAG_CLASS = { smoke:'tc-tag-smoke', regression:'tc-tag-reg', integration:'tc-tag-integ', end_to_end:'tc-tag-e2e', security:'tc-tag-sec', performance:'tc-tag-perf', ui:'tc-tag-ui', api:'tc-tag-api' };
  const TIPO_ICON = { 'Funcional':'⚙️', 'No funcional':'📊', 'UI':'🖥️', 'Seguridad':'🔒', 'Integración':'🔌', 'Regresión':'🔄' };
  const PRIO_CLASS = { 'Alta':'tc-prio-alta', 'Media':'tc-prio-media', 'Baja':'tc-prio-baja' };

  const byTipo = {};
  tcs.forEach((tc, i) => {
    const t = tc.tipo || 'Funcional';
    if (!byTipo[t]) byTipo[t] = [];
    byTipo[t].push({ ...tc, _i: i });
  });

  const grupos = Object.entries(byTipo).map(([tipo, items]) => `
    <div class="tc-grupo">
      <div class="tc-grupo-header">
        <span class="tc-grupo-icon">${TIPO_ICON[tipo] || '🧪'}</span>
        <span class="tc-grupo-label">${esc(tipo)}</span>
        <span class="tc-grupo-count">${items.length}</span>
      </div>
      ${items.map(tc => {
        const tags = (tc.tags || []).map(t =>
          `<span class="tc-tag-pill ${TAG_CLASS[t] || ''}">${TAG_LABEL[t] || esc(t)}</span>`
        ).join('');
        const preList = (tc.precondiciones || []).map((p, pi) =>
          `<li>${esc(p)}</li>`).join('');
        const pasosList = (tc.pasos || []).map((p, pi) =>
          `<li><span class="tc-paso-num">${pi + 1}</span>${esc(p)}</li>`).join('');
        const datosRows = (tc.datosPrueba || []).map(d =>
          `<tr><td class="tc-dp-campo">${esc(d.campo)}</td><td class="tc-dp-valor"><code>${esc(d.valor)}</code></td><td><span class="tc-dp-tipo tc-dp-${d.tipo?.includes('inválido')||d.tipo?.includes('invalid')?'neg':'pos'}">${esc(d.tipo||'')}</span></td></tr>`
        ).join('');

        return `
        <div class="tc-card tc-card-clickable" data-tc-idx="${tc._i}" role="button" tabindex="0" title="Ver detalle completo">
          <div class="tc-card-summary">
            <div class="tc-card-left">
              <span class="tc-id">${esc(tc.id)}</span>
              <span class="tc-card-titulo">${esc(tc.titulo)}</span>
            </div>
            <div class="tc-card-right">
              ${tags}
              <span class="badge ${ESTADO_CLASS[tc.estado] || ''}">${esc(tc.estado)}</span>
              ${tc.criterioVinculado ? `<span class="badge badge-tag">${esc(tc.criterioVinculado)}</span>` : ''}
              <span class="tc-prio-dot ${PRIO_CLASS[tc.prioridad] || ''}" title="Prioridad: ${esc(tc.prioridad)}"></span>
              <svg class="tc-card-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <button class="btn-icon btn-icon-del tc-del-btn" data-del-tc="${tc._i}" title="Eliminar" type="button">✕</button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');

  return `<div class="tab-testcases">
    <div class="tab-toolbar">
      <div class="tc-toolbar-left">
        <span class="tab-count">${tcs.length} test case${tcs.length !== 1 ? 's' : ''}</span>
        <span class="tc-coverage-hint">Clic en un TC para ver sus detalles</span>
      </div>
      <div class="tc-toolbar-actions">
        ${tcs.length > 0 ? `
        <div class="tc-export-wrap" id="tc-export-wrap">
          <button class="btn btn-ghost btn-sm tc-export-btn" id="btn-export-tcs">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Exportar
          </button>
          <div class="tc-export-menu" id="tc-export-menu" aria-hidden="true">
            <button class="tc-export-opt" data-export-fmt="csv">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 8h6M5 5h6M5 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              CSV detallado
            </button>
            <button class="tc-export-opt" data-export-fmt="md">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              Markdown (.md)
            </button>
            <div class="tc-export-sep"></div>
            <button class="tc-export-opt" data-export-fmt="clip">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="4" y="2" width="8" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="4" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/></svg>
              Copiar al portapapeles
            </button>
          </div>
        </div>` : ''}
        <button class="btn btn-accent btn-sm" id="btn-add-tc">+ Añadir manual</button>
      </div>
    </div>
    <div id="tc-list-wrap">
      ${tcs.length === 0
        ? `<div class="tc-empty">Sin test cases. Generá los criterios primero para auto-generar los TCs, o añadí uno manual.</div>`
        : grupos}
    </div>
  </div>`;
}

// ─── TC DRAWER ───────────────────────────────────────────────────────────────

const DRAWER_TAG_LABEL = { smoke:'Smoke', regression:'Regresión', integration:'Integración', end_to_end:'E2E', security:'Seguridad', performance:'Performance', ui:'UI', api:'API' };
const DRAWER_TAG_CLASS = { smoke:'tc-tag-smoke', regression:'tc-tag-reg', integration:'tc-tag-integ', end_to_end:'tc-tag-e2e', security:'tc-tag-sec', performance:'tc-tag-perf', ui:'tc-tag-ui', api:'tc-tag-api' };
const DRAWER_PRIO_CLASS = { 'Alta':'tc-prio-alta', 'Media':'tc-prio-media', 'Baja':'tc-prio-baja' };

function abrirDrawerTC(tc, h, allTcs) {
  cerrarDrawerTC();

  const tags = (tc.tags || []).map(t =>
    `<span class="tc-tag-pill ${DRAWER_TAG_CLASS[t] || ''}">${DRAWER_TAG_LABEL[t] || esc(t)}</span>`
  ).join('');

  const preList = (tc.precondiciones || []).map(p => `<li>${esc(p)}</li>`).join('');
  const pasosList = (tc.pasos || []).map((p, i) =>
    `<li><span class="tc-paso-num">${i + 1}</span><span>${esc(p)}</span></li>`
  ).join('');
  const datosRows = (tc.datosPrueba || []).map(d =>
    `<tr>
      <td class="tc-dp-campo">${esc(d.campo)}</td>
      <td class="tc-dp-valor"><code>${esc(d.valor)}</code></td>
      <td><span class="tc-dp-tipo tc-dp-${d.tipo?.includes('inválido')||d.tipo?.includes('invalid')?'neg':'pos'}">${esc(d.tipo||'')}</span></td>
    </tr>`
  ).join('');

  // Navegación prev/next
  const idx = allTcs.findIndex(t => t.id === tc.id);
  const hasPrev = idx > 0;
  const hasNext = idx < allTcs.length - 1;

  const overlay = document.createElement('div');
  overlay.id = 'tc-drawer-overlay';
  overlay.className = 'tc-drawer-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Detalle: ${tc.titulo}`);
  overlay.innerHTML = `
    <div class="tc-drawer-backdrop" id="tc-drawer-backdrop"></div>
    <div class="tc-drawer" id="tc-drawer">

      <div class="tc-drawer-header">
        <div class="tc-drawer-header-top">
          <span class="tc-id tc-drawer-id">${esc(tc.id)}</span>
          <div class="tc-drawer-nav">
            <button class="tc-drawer-nav-btn" id="btn-tc-prev" ${!hasPrev ? 'disabled' : ''} title="TC anterior">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <span class="tc-drawer-nav-pos">${idx + 1} / ${allTcs.length}</span>
            <button class="tc-drawer-nav-btn" id="btn-tc-next" ${!hasNext ? 'disabled' : ''} title="TC siguiente">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <button class="tc-drawer-close" id="btn-tc-drawer-close" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
        <h2 class="tc-drawer-titulo">${esc(tc.titulo)}</h2>
        <div class="tc-drawer-meta">
          <span class="tc-drawer-meta-chip">${esc(tc.tipo || '—')}</span>
          <span class="tc-drawer-meta-sep">·</span>
          <span class="tc-drawer-meta-chip">
            <span class="tc-prio-dot ${DRAWER_PRIO_CLASS[tc.prioridad] || ''}"></span>
            ${esc(tc.prioridad || '—')}
          </span>
          <span class="tc-drawer-meta-sep">·</span>
          <span class="badge ${ESTADO_CLASS[tc.estado] || ''}">${esc(tc.estado || '—')}</span>
          ${tc.criterioVinculado ? `<span class="tc-drawer-meta-sep">·</span><span class="badge badge-tag">Criterio: ${esc(tc.criterioVinculado)}</span>` : ''}
        </div>
        ${tags ? `<div class="tc-drawer-tags">${tags}</div>` : ''}
      </div>

      <div class="tc-drawer-body">
        ${preList ? `
        <div class="tc-section">
          <div class="tc-section-label">📋 Precondiciones</div>
          <ul class="tc-list tc-pre-list">${preList}</ul>
        </div>` : ''}

        ${pasosList ? `
        <div class="tc-section">
          <div class="tc-section-label">▶ Pasos de ejecución</div>
          <ol class="tc-list tc-pasos-list tc-pasos-drawer">${pasosList}</ol>
        </div>` : ''}

        ${datosRows ? `
        <div class="tc-section">
          <div class="tc-section-label">🗂 Datos de prueba</div>
          <table class="tc-dp-table">
            <thead><tr><th>Campo</th><th>Valor</th><th>Tipo</th></tr></thead>
            <tbody>${datosRows}</tbody>
          </table>
        </div>` : ''}

        ${tc.resultadoEsperado ? `
        <div class="tc-section">
          <div class="tc-section-label">✅ Resultado esperado</div>
          <div class="tc-resultado">${esc(tc.resultadoEsperado)}</div>
        </div>` : ''}
      </div>
    </div>`;

  document.body.appendChild(overlay);
  // Forzar reflow para activar la animación
  requestAnimationFrame(() => overlay.classList.add('tc-drawer-overlay--open'));

  document.getElementById('btn-tc-drawer-close').onclick = cerrarDrawerTC;
  document.getElementById('tc-drawer-backdrop').onclick = cerrarDrawerTC;
  if (hasPrev) document.getElementById('btn-tc-prev').onclick = () => abrirDrawerTC(allTcs[idx - 1], h, allTcs);
  if (hasNext) document.getElementById('btn-tc-next').onclick = () => abrirDrawerTC(allTcs[idx + 1], h, allTcs);

  const onKey = e => { if (e.key === 'Escape') { cerrarDrawerTC(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

function cerrarDrawerTC() {
  const overlay = document.getElementById('tc-drawer-overlay');
  if (!overlay) return;
  overlay.classList.remove('tc-drawer-overlay--open');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

function renderTabMockups(h) {
  const imgs = h.imagenes || [];
  const links = (h.links || []).filter(l => l.tipo === 'Mockup' || l.tipo === 'Figma');
  return `<div class="tab-mockups">
    ${imgs.map(img => `
      <div class="mockup-item">
        <img src="${esc(img.src)}" alt="${esc(img.desc || 'Mockup')}" class="mockup-img">
        <div class="mockup-desc">${esc(img.desc || '')}</div>
      </div>`).join('')}
    ${links.map(l => `
      <div class="mockup-link-item">
        <span class="badge badge-tag">${esc(l.tipo)}</span>
        <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.desc || l.url)}</a>
      </div>`).join('')}
    ${!imgs.length && !links.length ? `<div class="empty-state"><h3>Sin mockups</h3><p>Agrega imágenes o links Figma al crear la historia</p></div>` : ''}
  </div>`;
}

function mostrarModalEnvioJira(h) {
  const proj   = state.proyectos.find(p => p.id === state.proyectoActivoId);
  let proyKey  = proj?.jiraKey || '';
  const isSent = !!(h.jiraIssueKey);

  let modal = document.getElementById('modal-jira-confirm');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-jira-confirm';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-box modal-box-sm">
        <div class="modal-header">
          <h3>Enviar a Jira</h3>
          <button class="modal-close" id="btn-close-jira-modal">✕</button>
        </div>
        <div class="modal-body" id="jira-modal-body"></div>
        <div class="modal-footer" id="jira-modal-footer">
          <button class="btn btn-ghost" id="btn-cancel-jira-send">Cancelar</button>
          <button class="btn btn-accent" id="btn-confirm-jira-send">🚀 Confirmar y enviar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  function renderBody() {
    document.getElementById('jira-modal-body').innerHTML = `
      ${isSent ? `<div class="jira-already-sent-warn">⚠ Esta historia ya fue enviada como <strong>${esc(h.jiraIssueKey)}</strong>. Se creará un issue duplicado.</div>` : ''}
      <p class="modal-msg">Se creará el siguiente issue en <strong>${esc(state.jiraCfg?.baseUrl || '')}</strong>:</p>
      <div class="jira-confirm-preview">
        <div class="jira-confirm-row">
          <span class="jira-confirm-label">Proyecto Jira</span>
          <div class="jira-proj-picker-inline">
            <strong id="jira-selected-key">${esc(proyKey || '—')}</strong>
            <button class="btn btn-ghost btn-xs" id="btn-jira-pick-proj" type="button">Buscar proyectos ↓</button>
          </div>
        </div>
        <div id="jira-proj-dropdown-wrap" class="hidden" style="margin:.25rem 0 .5rem 0"></div>
        <div class="jira-confirm-row">
          <span class="jira-confirm-label">Tipo de issue</span>
          <select id="jira-issue-type-sel" class="form-control" style="width:auto;font-size:.82rem;padding:.25rem .5rem">
            ${JIRA_TIPOS.map(t => `<option value="${esc(t)}"${t === (h.tipo || 'Story') ? ' selected' : ''}>${esc(t)}</option>`).join('')}
          </select>
        </div>
        <div class="jira-confirm-row">
          <span class="jira-confirm-label">Resumen</span>
          <em>${esc(h.resumen)}</em>
        </div>
        <div class="jira-confirm-row">
          <span class="jira-confirm-label">Prioridad</span>
          ${esc(h.prioridad || 'Medium')}${h.storyPoints != null ? ` · ${h.storyPoints} SP` : ''}
        </div>
        ${(h.criterios||[]).length ? `<div class="jira-confirm-row"><span class="jira-confirm-label">Criterios</span>${(h.criterios||[]).length} incluidos en descripción</div>` : ''}
      </div>
      <div id="jira-modal-result" class="test-result hidden" style="margin-top:.875rem"></div>`;

    document.getElementById('btn-jira-pick-proj').onclick = async () => {
      const wrap = document.getElementById('jira-proj-dropdown-wrap');
      if (!wrap.classList.contains('hidden')) { wrap.classList.add('hidden'); return; }
      wrap.innerHTML = `<span class="test-spinner" style="margin-right:.4rem"></span><span style="font-size:.82rem;color:var(--text-muted)">Cargando proyectos Jira…</span>`;
      wrap.classList.remove('hidden');
      try {
        const { listarProyectosJira } = await import('./jira.js');
        const projects = await listarProyectosJira();
        if (!projects.length) { wrap.innerHTML = `<span style="font-size:.82rem;color:var(--text-muted)">Sin proyectos disponibles</span>`; return; }
        wrap.innerHTML = `
          <div style="display:flex;gap:.4rem;align-items:center;flex-wrap:wrap">
            <select class="form-control" id="jira-proj-select" style="flex:1;min-width:180px;font-size:.82rem;padding:.25rem .5rem">
              ${projects.map(p => `<option value="${esc(p.key)}"${p.key === proyKey ? ' selected' : ''}>${esc(p.key)} — ${esc(p.name)}</option>`).join('')}
            </select>
            <button class="btn btn-sm btn-accent" id="btn-apply-jira-proj" type="button">Aplicar</button>
          </div>`;
        document.getElementById('btn-apply-jira-proj').onclick = async () => {
          const sel = document.getElementById('jira-proj-select');
          proyKey = sel.value;
          document.getElementById('jira-selected-key').textContent = proyKey;
          wrap.classList.add('hidden');
          if (proj) { proj.jiraKey = proyKey; guardar(); }
          // Fetch real issue types for selected project and update dropdown
          try {
            const { obtenerTiposIssue } = await import('./jira.js');
            const tipos = await obtenerTiposIssue(proyKey);
            if (tipos.length) {
              const typeSel = document.getElementById('jira-issue-type-sel');
              const current = typeSel?.value;
              if (typeSel) {
                typeSel.innerHTML = tipos.map(t => `<option value="${esc(t)}"${t === current ? ' selected' : ''}>${esc(t)}</option>`).join('');
              }
            }
          } catch { /* ignore — keep defaults */ }
        };
      } catch (err) {
        wrap.innerHTML = `<span style="color:var(--error-color);font-size:.82rem">✕ ${esc(err.message)}</span>`;
      }
    };
  }

  renderBody();
  modal.classList.remove('hidden');

  // Auto-load real issue types on open
  if (proyKey) {
    import('./jira.js').then(({ obtenerTiposIssue }) => obtenerTiposIssue(proyKey)).then(tipos => {
      if (!tipos.length) return;
      const sel = document.getElementById('jira-issue-type-sel');
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = tipos.map(t => `<option value="${esc(t)}"${t === current ? ' selected' : ''}>${esc(t)}</option>`).join('');
    }).catch(() => { /* keep defaults */ });
  }

  const closeModal = () => modal.classList.add('hidden');
  document.getElementById('btn-close-jira-modal').onclick = closeModal;
  document.getElementById('btn-cancel-jira-send').onclick = closeModal;

  document.getElementById('btn-confirm-jira-send').onclick = async () => {
    const confirmBtn  = document.getElementById('btn-confirm-jira-send');
    const cancelBtn   = document.getElementById('btn-cancel-jira-send');
    const resultEl    = document.getElementById('jira-modal-result');
    const selectedKey = proyKey;
    const selectedType = document.getElementById('jira-issue-type-sel')?.value || h.tipo;

    if (!selectedKey) {
      toast('Selecciona un proyecto Jira primero', 'warn');
      return;
    }

    confirmBtn.disabled = true;
    cancelBtn.disabled  = true;
    resultEl.className  = 'test-result test-result-loading';
    resultEl.innerHTML  = `<span class="test-spinner"></span> Creando issue en Jira…`;

    try {
      const { crearIssueEnJira } = await import('./jira.js');
      const hForSend = { ...h, tipo: selectedType };
      const result   = await crearIssueEnJira(hForSend, selectedKey);

      const issueKey = result.key;
      const issueUrl = `${state.jiraCfg.baseUrl}/browse/${issueKey}`;
      actualizarHistoria(h.id, { jiraIssueKey: issueKey, sincJira: true, jiraIssueUrl: issueUrl });
      h.jiraIssueKey = issueKey;
      h.sincJira     = true;
      h.jiraIssueUrl = issueUrl;

      resultEl.className = 'test-result test-result-ok';
      resultEl.innerHTML = `<strong>✓</strong> Issue creado: <a href="${esc(issueUrl)}" target="_blank" rel="noopener" style="color:inherit;font-weight:700">${esc(issueKey)}</a> — <a href="${esc(issueUrl)}" target="_blank" rel="noopener" style="color:inherit">Abrir en Jira ↗</a>`;

      confirmBtn.textContent = '✓ Enviado';
      cancelBtn.textContent  = 'Cerrar';
      cancelBtn.disabled     = false;
      toast(`Issue ${issueKey} creado en Jira ✓`);

      setTimeout(() => {
        closeModal();
        document.getElementById('tab-content').innerHTML = renderTab(h, 'jira');
        bindTabEvents(h, 'jira');
      }, 1800);
    } catch (err) {
      resultEl.className  = 'test-result test-result-error';
      resultEl.innerHTML  = `<strong>✕</strong> ${esc(err.message)}`;
      confirmBtn.disabled = false;
      cancelBtn.disabled  = false;
    }
  };
}

function buildJiraPayload(h) {
  const proj = state.proyectos.find(p => p.id === state.proyectoActivoId);
  const payload = {
    fields: {
      project:     { key: proj?.jiraKey || 'PROJ' },
      issuetype:   { name: h.tipo },
      summary:     h.resumen,
      description: {
        type: 'doc', version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: `Como ${h.como}, quiero ${h.quiero}, para ${h.para}.` }] }]
      },
      priority:    { name: h.prioridad },
      labels:      h.etiquetas || []
    }
  };
  if (h.storyPoints != null) payload.fields.story_points = h.storyPoints;
  return payload;
}

function renderTabJira(h) {
  const jiraCfg = state.jiraCfg;
  const proj    = state.proyectos.find(p => p.id === state.proyectoActivoId);
  const hasJira = !!(jiraCfg?.email && jiraCfg?.token);
  const proyKey = proj?.jiraKey || '—';

  if (!hasJira) {
    return `<div class="jira-no-cfg">
      <div class="jira-no-cfg-icon">🔗</div>
      <h4>Integración Jira no configurada</h4>
      <p>Agrega tus credenciales de Jira en Configuración para enviar historias directamente al tablero.</p>
      <a href="#/config" class="btn btn-outline btn-sm">⚙ Configurar Jira →</a>
    </div>`;
  }

  const isSent   = !!(h.jiraIssueKey);
  const issueUrl = isSent ? `${jiraCfg.baseUrl}/browse/${esc(h.jiraIssueKey)}` : null;
  const critsSummary = (h.criterios || []).slice(0, 3).map(c => `• ${c.titulo}`).join('\n');

  return `<div class="tab-jira">
    ${isSent ? `
    <div class="jira-sent-banner">
      <span class="jira-sent-icon">✓</span>
      <div class="jira-sent-info">
        <div class="jira-sent-title">Issue creado en Jira</div>
        <a href="${issueUrl}" target="_blank" rel="noopener" class="jira-sent-key">${esc(h.jiraIssueKey)}</a>
      </div>
      <a href="${issueUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Abrir en Jira ↗</a>
    </div>` : ''}

    <div class="jira-preview-card">
      <div class="jira-preview-title">Preview del issue</div>
      <div class="jira-preview-rows">
        <div class="jira-preview-row">
          <span class="jira-field-label">Proyecto</span>
          <span class="jira-field-val"><strong>${esc(proyKey)}</strong>${proj?.nombre ? ` — ${esc(proj.nombre)}` : ''}</span>
        </div>
        <div class="jira-preview-row">
          <span class="jira-field-label">Tipo</span>
          <span class="jira-field-val">${esc(h.tipo)}</span>
        </div>
        <div class="jira-preview-row">
          <span class="jira-field-label">Resumen</span>
          <span class="jira-field-val">${esc(h.resumen)}</span>
        </div>
        <div class="jira-preview-row">
          <span class="jira-field-label">Prioridad</span>
          <span class="jira-field-val">${esc(h.prioridad)}</span>
        </div>
        ${h.storyPoints != null ? `<div class="jira-preview-row"><span class="jira-field-label">Story Points</span><span class="jira-field-val">${h.storyPoints}</span></div>` : ''}
        ${(h.etiquetas||[]).length ? `<div class="jira-preview-row"><span class="jira-field-label">Labels</span><span class="jira-field-val">${(h.etiquetas||[]).map(t => `<span class="badge badge-tag">${esc(t)}</span>`).join(' ')}</span></div>` : ''}
        ${critsSummary ? `<div class="jira-preview-row"><span class="jira-field-label">Criterios</span><span class="jira-field-val jira-crits-preview">${esc(critsSummary)}</span></div>` : ''}
      </div>
    </div>

    <div id="jira-send-result" class="test-result hidden"></div>

    <div class="jira-tab-actions">
      <button class="btn btn-ghost btn-sm" id="btn-copiar-jira">📋 Copiar JSON</button>
      <button class="btn btn-accent" id="btn-enviar-jira">
        ${isSent ? '🔄 Crear nuevo issue' : '🚀 Enviar a Jira'}
      </button>
    </div>
  </div>`;
}

// ── HISTORIA EDIT ─────────────────────────────────────────────────────────────
export function renderHistoriaEdit(id) {
  const h = state.historias.find(h => h.id === id);
  if (!h) {
    document.getElementById('view').innerHTML = `<div class="empty-state"><h3>Historia no encontrada</h3><a href="#/historias" class="btn btn-outline">Volver</a></div>`;
    return;
  }

  document.getElementById('view').innerHTML = `
<div class="form-view">
  <div class="form-view-header">
    <h1 class="page-title">Editar Historia</h1>
    <p class="page-sub">${esc(h.id)} — Actualiza los campos y guarda los cambios</p>
  </div>
  <div class="form-card">
    <form id="form-editar" novalidate>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="hu-tipo">Tipo</label>
          <select id="hu-tipo" class="form-control">
            ${JIRA_TIPOS.map(t => `<option value="${t}"${t === h.tipo ? ' selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="hu-prioridad">Prioridad</label>
          <select id="hu-prioridad" class="form-control">
            ${JIRA_PRIORIDADES.map(p => `<option value="${p}"${p === h.prioridad ? ' selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="hu-sp">Story Points</label>
          <input type="number" id="hu-sp" class="form-control" value="${h.storyPoints != null ? h.storyPoints : ''}" placeholder="—" min="0" max="100">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="hu-resumen">Resumen * <span class="form-hint">max 255 caracteres</span></label>
        <input type="text" id="hu-resumen" class="form-control" value="${esc(h.resumen)}" maxlength="255" required>
        <div class="char-count" id="char-count">${h.resumen.length} / 255</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="hu-como">Como (rol) *</label>
          <input type="text" id="hu-como" class="form-control" value="${esc(h.como)}" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="hu-quiero">Quiero (acción) *</label>
          <input type="text" id="hu-quiero" class="form-control" value="${esc(h.quiero)}" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="hu-para">Para (objetivo) *</label>
        <input type="text" id="hu-para" class="form-control" value="${esc(h.para)}" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="hu-desc">Descripción y contexto</label>
        <textarea id="hu-desc" class="form-control" rows="3">${esc(h.descripcion || '')}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Etiquetas</label>
        <div class="tag-input-wrap" id="tag-input-wrap">
          <div class="tag-chips" id="tag-chips"></div>
          <input type="text" id="tag-input" class="tag-input" placeholder="Escribe y presiona Enter o coma…">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Links de referencia</label>
        <div id="links-list"></div>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-add-link">+ Agregar link</button>
      </div>

      <div class="form-group">
        <label class="checkbox-label" style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
          <input type="checkbox" id="regen-check" checked>
          <span>Regenerar criterios y test cases al guardar</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="window.location.hash='#/historias/${esc(h.id)}'">Cancelar</button>
        <button type="submit" class="btn btn-accent">Guardar cambios</button>
      </div>
    </form>
  </div>
</div>`;

  setupTagInput(h.etiquetas || []);
  setupLinksInput(h.links || []);
  setupEditFormValidation(h);
}

// ── FLUJOS UML / ESQUEMAS ─────────────────────────────────────────────────────
// ── API / MICROSERVICIO IMPORT ────────────────────────────────────────────────
export function renderAPIImportForm() {
  const cfg    = state.apiCfg;
  const hasApi = !!(cfg?.key);
  const PROVIDER_LABELS = { claude: 'Claude', openai: 'OpenAI', grok: 'Grok (xAI)', groq: 'Groq' };
  const aiStatusHtml = hasApi
    ? `<div class="ai-status ai-status-ok">✓ IA activa — ${esc(PROVIDER_LABELS[cfg.provider] || cfg.provider)} · ${esc(cfg.model)}</div>`
    : `<div class="ai-status ai-status-warn">⚠ Sin IA configurada. <a href="#/config" class="ai-cfg-link">Configurar API →</a></div>`;

  const FUENTES = [
    { id: 'swagger', icon: '📄', label: 'Swagger / OpenAPI',      placeholder: 'Pega aquí tu YAML o JSON de Swagger/OpenAPI…\n\nopenapi: 3.0.0\ninfo:\n  title: Mi API\npaths:\n  /users:\n    get:\n      summary: Lista de usuarios\n      responses:\n        "200":\n          description: OK' },
    { id: 'rest',    icon: '🌐', label: 'Documentación REST',      placeholder: 'Pega la documentación de tu API REST…\n\nEj:\nGET /api/v1/usuarios → Lista todos los usuarios activos. Responde con array de {id, nombre, email, rol}.\nPOST /api/v1/usuarios → Crea un usuario. Body: {nombre, email, password, rol}. Retorna 201 con el objeto creado.\nPUT /api/v1/usuarios/:id → Actualiza datos del usuario. Body parcial. Retorna 200.\nDELETE /api/v1/usuarios/:id → Desactiva usuario. Retorna 204.' },
    { id: 'contrato',icon: '🤝', label: 'Contrato de Microservicio', placeholder: 'Describe el contrato de tu microservicio…\n\nEj:\nMicroservicio: Servicio de Notificaciones\nEvento entrada: pedido.creado → {pedidoId, usuarioId, monto, items[]}\nAcción: enviar email de confirmación, registrar en log, emitir evento notificacion.enviada\nEvento salida: notificacion.enviada → {notificacionId, canal: "email", estado: "enviado"}\nSLA: procesamiento < 2s, retries: 3 intentos con backoff exponencial' },
  ];

  const CONSUMIDORES = [
    'Aplicación Frontend (Web)',
    'Aplicación Mobile (iOS/Android)',
    'Servicio Backend / API Gateway',
    'Servicio de terceros / partner',
    'CLI / herramienta interna',
  ];

  document.getElementById('view').innerHTML = `
<div class="form-view form-view-api">
  <div class="form-view-header">
    <h1 class="page-title">Historias Técnicas desde API / MS</h1>
    <p class="page-sub">Importa Swagger, documentación REST o contratos de microservicio y genera historias técnicas ISTQB con IA</p>
  </div>

  <div class="form-card">
    ${aiStatusHtml}

    <!-- SOURCE TABS -->
    <div class="form-group">
      <label class="form-label">Tipo de documentación</label>
      <div class="api-source-tabs">
        ${FUENTES.map((f, i) => `
        <button class="api-source-btn${i === 0 ? ' active' : ''}" data-fuente="${f.id}" type="button">
          <span>${f.icon}</span>
          <span>${f.label}</span>
        </button>`).join('')}
      </div>
    </div>

    <!-- FILE UPLOAD (Swagger only) -->
    <div id="api-file-wrap" class="form-group">
      <label class="form-label">Subir archivo <span class="form-hint">YAML / JSON (opcional)</span></label>
      <div class="api-file-drop" id="api-file-drop">
        <input type="file" id="api-file-input" accept=".yaml,.yml,.json" class="api-file-input" />
        <div class="api-file-label">
          <span class="api-file-icon">📎</span>
          <span>Arrastra un archivo o <strong>haz clic para seleccionar</strong></span>
          <span class="api-file-types">YAML · YML · JSON</span>
        </div>
        <div class="api-file-name hidden" id="api-file-name"></div>
      </div>
    </div>

    <!-- DOCUMENTATION TEXTAREA -->
    <div class="form-group">
      <label class="form-label" for="api-doc">
        Documentación *
        <span class="form-hint">Pega el contenido o escribe la descripción</span>
      </label>
      <textarea id="api-doc" class="form-control" rows="10"
        placeholder="${esc(FUENTES[0].placeholder)}"></textarea>
    </div>

    <!-- CONSUMER + CONTEXT ROW -->
    <div class="api-config-row">
      <div class="form-group">
        <label class="form-label" for="api-consumidor">Tipo de consumidor</label>
        <select id="api-consumidor" class="form-control">
          ${CONSUMIDORES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label" for="api-contexto">Contexto adicional <span class="form-hint">(opcional)</span></label>
        <input type="text" id="api-contexto" class="form-control"
          placeholder="Ej: sistema de e-commerce en Laravel, ambiente productivo AWS" />
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" onclick="window.location.hash='#/dashboard'">Cancelar</button>
      <button type="button" class="btn btn-accent" id="btn-gen-api">
        ${hasApi ? '🔌 Generar historias técnicas' : '⚠ Configurar API key →'}
      </button>
    </div>
  </div>

  <!-- PREVIEW SECTION -->
  <div id="api-preview-section" class="hidden">
    <div class="api-preview-header">
      <div>
        <h2 class="api-preview-title">Historias generadas</h2>
        <p class="api-preview-sub" id="api-preview-count"></p>
      </div>
      <div class="api-preview-actions">
        <button class="btn btn-ghost btn-sm" id="btn-api-regen">↺ Regenerar</button>
        <button class="btn btn-accent btn-sm" id="btn-api-save">Guardar historias →</button>
      </div>
    </div>
    <div id="api-stories-list" class="api-stories-list"></div>
  </div>
</div>`;

  const FUENTE_MAP = Object.fromEntries(FUENTES.map(f => [f.id, f]));
  let activeFuente = 'swagger';
  let generatedItems = [];

  const docEl    = document.getElementById('api-doc');
  const genBtn   = document.getElementById('btn-gen-api');
  const fileWrap = document.getElementById('api-file-wrap');

  // Source tab switching
  document.querySelectorAll('.api-source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.api-source-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFuente = btn.dataset.fuente;
      docEl.placeholder = FUENTE_MAP[activeFuente].placeholder;
      fileWrap.classList.toggle('hidden', activeFuente !== 'swagger');
    });
  });

  // File upload
  const fileInput = document.getElementById('api-file-input');
  const fileDrop  = document.getElementById('api-file-drop');
  const fileName  = document.getElementById('api-file-name');

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      docEl.value = e.target.result;
      fileName.textContent = '✓ ' + file.name;
      fileName.classList.remove('hidden');
    };
    reader.readAsText(file);
  });

  fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
  fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    fileDrop.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      docEl.value = ev.target.result;
      fileName.textContent = '✓ ' + file.name;
      fileName.classList.remove('hidden');
    };
    reader.readAsText(file);
  });


  async function runGeneration() {
    if (!hasApi) { navigate('/config'); return; }
    const doc = docEl.value.trim();
    if (!doc) { toast('Pega la documentación primero', 'warn'); return; }
    const consumidor = document.getElementById('api-consumidor').value;
    const contexto   = document.getElementById('api-contexto').value.trim();

    genBtn.disabled    = true;
    genBtn.textContent = '⏳ Generando…';
    toast('Analizando documentación con IA…', 'info');

    const { generarHistoriasTecnicasConIA } = await import('./import.js');
    const items = await generarHistoriasTecnicasConIA(activeFuente, consumidor, doc, contexto);

    genBtn.disabled    = false;
    genBtn.textContent = '🔌 Generar historias técnicas';

    if (!items || items.length === 0) return;

    generatedItems = items;
    renderPreview();
  }

  function renderPreview() {
    const section = document.getElementById('api-preview-section');
    const list    = document.getElementById('api-stories-list');
    const count   = document.getElementById('api-preview-count');

    section.classList.remove('hidden');
    count.textContent = `${generatedItems.length} historia${generatedItems.length !== 1 ? 's' : ''} listas para guardar`;

    list.innerHTML = generatedItems.map((item, idx) => {
      const tags = (Array.isArray(item.etiquetas) ? item.etiquetas : []).map(t =>
        `<span class="api-story-tag">${esc(t)}</span>`).join('');
      return `
<div class="api-story-card" data-idx="${idx}">
  <button class="api-story-remove" data-idx="${idx}" title="Eliminar esta historia" aria-label="Eliminar historia">×</button>
  <div class="api-story-header">
    <span class="api-story-tipo ${(item.tipo || 'Story').toLowerCase()}">${esc(item.tipo || 'Story')}</span>
    <span class="api-story-prioridad">${esc(item.prioridad || 'Medium')}</span>
  </div>
  <div class="api-story-title">${esc(item.titulo || item.title || 'Sin título')}</div>
  <div class="api-story-meta">
    <span><strong>Como</strong> ${esc(item.como || '')}</span>
    <span><strong>quiero</strong> ${esc(item.quiero || '')}</span>
    <span><strong>para</strong> ${esc(item.para || '')}</span>
  </div>
  ${item.descripcion ? `<div class="api-story-desc">${esc(item.descripcion)}</div>` : ''}
  ${tags ? `<div class="api-story-tags">${tags}</div>` : ''}
</div>`;
    }).join('');

    list.querySelectorAll('.api-story-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx, 10);
        generatedItems.splice(i, 1);
        if (generatedItems.length === 0) {
          section.classList.add('hidden');
        } else {
          renderPreview();
        }
      });
    });

    document.getElementById('btn-api-save').onclick = () => {
      import('./historias.js').then(({ crearHistoriasDesdeIA: fn }) => {
        const creadas = fn(generatedItems, 'ia', activeFuente);
        toast(`${creadas.length} historias técnicas guardadas`);
        navigate('/historias');
      });
    };

    document.getElementById('btn-api-regen').onclick = runGeneration;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  genBtn.addEventListener('click', runGeneration);
}

export function renderFlujosForm() {
  const cfg    = state.apiCfg;
  const hasApi = !!(cfg?.key);
  const PROVIDER_LABELS = { claude: 'Claude', openai: 'OpenAI', grok: 'Grok (xAI)', groq: 'Groq' };
  const aiStatusHtml = hasApi
    ? `<div class="ai-status ai-status-ok">✓ IA activa — ${esc(PROVIDER_LABELS[cfg.provider] || cfg.provider)} · ${esc(cfg.model)}</div>`
    : `<div class="ai-status ai-status-warn">⚠ Sin IA configurada — los diagramas se generan con IA. <a href="#/config" class="ai-cfg-link">Configurar API →</a></div>`;

  const TIPOS = [
    { value: 'Secuencia',  label: 'Diagrama de Secuencia',  icon: '🔄' },
    { value: 'Flujo',      label: 'Flujo de Proceso',        icon: '📊' },
    { value: 'CasoDeUso',  label: 'Casos de Uso',            icon: '🎯' },
    { value: 'Clases',     label: 'Diagrama de Clases',      icon: '🏗️' },
    { value: 'ER',         label: 'Entidad-Relación (ER)',   icon: '🗄️' },
    { value: 'BPMN',       label: 'Proceso BPMN',            icon: '🔵' },
  ];

  document.getElementById('view').innerHTML = `
<div class="form-view form-view-flujos">
  <div class="form-view-header">
    <h1 class="page-title">Flujos UML y Esquemas</h1>
    <p class="page-sub">Genera diagramas UML, BPMN y esquemas de flujo a partir de documentación escrita del proyecto</p>
  </div>

  <div class="form-card">
    ${aiStatusHtml}

    <div class="flujo-form-row">
      <div class="form-group">
        <label class="form-label">Tipo de diagrama</label>
        <select id="flujo-tipo" class="form-control">
          ${TIPOS.map(t => `<option value="${esc(t.value)}">${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">Título <span class="form-hint">(opcional)</span></label>
        <input type="text" id="flujo-titulo" class="form-control" placeholder="Ej: Flujo de autenticación de usuarios">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">
        Documentación del proyecto *
        <span class="form-hint">Describe actores, módulos, procesos y reglas de negocio</span>
      </label>
      <textarea id="flujo-doc" class="form-control" rows="9"
        placeholder="Ej: El sistema tiene dos actores: Usuario y Administrador. El usuario puede iniciar sesión con email y contraseña. Si falla 3 veces consecutivas la cuenta se bloquea 15 minutos. El administrador puede desbloquear cuentas, gestionar usuarios y ver reportes de actividad…"></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" onclick="window.location.hash='#/dashboard'">Cancelar</button>
      <button type="button" class="btn btn-accent" id="btn-gen-flujo" ${!hasApi ? 'disabled' : 'disabled'}>
        ${hasApi ? '📊 Generar diagrama con IA' : '⚠ Configura tu API primero'}
      </button>
    </div>
  </div>

  <div id="flujo-result-section" class="hidden">
    <div class="flujo-result-header">
      <h2 class="flujo-result-title" id="flujo-result-titulo">Diagrama generado</h2>
      <div class="flujo-result-actions">
        <button class="btn btn-ghost btn-sm" id="btn-copy-mermaid">📋 Copiar código</button>
        <button class="btn btn-ghost btn-sm" id="btn-open-live">↗ Abrir en Mermaid Live</button>
      </div>
    </div>

    <div class="flujo-diagram-wrap" id="flujo-diagram-preview"></div>

    <div class="flujo-code-section">
      <div class="flujo-code-header">
        <span>Código Mermaid</span>
        <span class="form-hint">Compatible con Figma, Confluence, Lucidchart y editores UML</span>
      </div>
      <pre class="flujo-code-block" id="flujo-code-block"></pre>
    </div>
  </div>
</div>`;

  const docEl  = document.getElementById('flujo-doc');
  const genBtn = document.getElementById('btn-gen-flujo');

  if (hasApi) {
    docEl.addEventListener('input', () => { genBtn.disabled = !docEl.value.trim(); });
  }

  genBtn.addEventListener('click', async () => {
    if (!hasApi) { navigate('/config'); return; }
    const tipo   = document.getElementById('flujo-tipo').value;
    const titulo = document.getElementById('flujo-titulo').value.trim();
    const doc    = docEl.value.trim();
    if (!doc) { toast('Escribe la documentación del proyecto primero', 'warn'); return; }

    genBtn.disabled    = true;
    genBtn.textContent = '⏳ Generando…';
    toast('Generando diagrama con IA…', 'info');

    const { generarFlujosConIA } = await import('./import.js');
    const code = await generarFlujosConIA(tipo, titulo, doc);

    genBtn.disabled    = false;
    genBtn.textContent = '📊 Generar diagrama con IA';

    if (!code) return;

    const resultSection = document.getElementById('flujo-result-section');
    resultSection.classList.remove('hidden');

    const tipoLabel = document.getElementById('flujo-tipo').selectedOptions[0]?.text || tipo;
    document.getElementById('flujo-result-titulo').textContent = titulo || tipoLabel;
    document.getElementById('flujo-code-block').textContent = code;

    await _renderizarMermaid(code, 'flujo-diagram-preview');

    document.getElementById('btn-copy-mermaid').onclick = () => {
      navigator.clipboard.writeText(code)
        .then(() => toast('Código Mermaid copiado ✓'))
        .catch(() => toast('No se pudo copiar', 'warn'));
    };
    document.getElementById('btn-open-live').onclick = () => {
      const b64 = btoa(unescape(encodeURIComponent(code)));
      window.open(`https://mermaid.live/edit#base64:${b64}`, '_blank', 'noopener');
    };

    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

async function _renderizarMermaid(code, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="flujo-loading"><span class="test-spinner"></span> Renderizando diagrama…</div>`;

  try {
    if (!window.mermaid) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    }
    const { svg } = await window.mermaid.render('mermaid-svg-' + Date.now(), code);
    container.innerHTML = svg;
  } catch {
    container.innerHTML = `<div class="flujo-render-error">
      <div style="font-size:1.25rem;margin-bottom:.375rem">⚠</div>
      <div>No se pudo renderizar en el navegador.</div>
      <div style="margin-top:.25rem;font-size:.78rem">Copia el código y ábrelo en <strong>Mermaid Live</strong> para visualizarlo.</div>
    </div>`;
  }
}

function setupEditFormValidation(h) {
  const resumen = document.getElementById('hu-resumen');
  const como    = document.getElementById('hu-como');
  const quiero  = document.getElementById('hu-quiero');
  const para    = document.getElementById('hu-para');
  const counter = document.getElementById('char-count');

  [resumen, como, quiero, para].forEach(el => el.addEventListener('input', () => {
    counter.textContent = `${resumen.value.length} / 255`;
  }));

  document.getElementById('form-editar').addEventListener('submit', e => {
    e.preventDefault();
    if (!resumen.value.trim() || !como.value.trim() || !quiero.value.trim() || !para.value.trim()) {
      toast('Completa todos los campos obligatorios', 'warn');
      return;
    }

    const tagsRaw = document.getElementById('tag-input').dataset.tags;
    const etiquetas = tagsRaw ? JSON.parse(tagsRaw) : [];

    const formLinks = [...document.querySelectorAll('.link-row')].map(row => ({
      tipo: row.querySelector('.link-tipo').value,
      url:  row.querySelector('.link-url').value.trim(),
      desc: row.querySelector('.link-desc').value.trim()
    })).filter(l => l.url);

    const dataLinks = (h.links || []).filter(l => l.url && l.url.startsWith('data:'));

    const cambios = {
      tipo:        document.getElementById('hu-tipo').value,
      resumen:     resumen.value.trim(),
      como:        como.value.trim(),
      quiero:      quiero.value.trim(),
      para:        para.value.trim(),
      descripcion: document.getElementById('hu-desc').value.trim(),
      etiquetas,
      prioridad:   document.getElementById('hu-prioridad').value,
      storyPoints: document.getElementById('hu-sp').value || null,
      links:       [...dataLinks, ...formLinks]
    };

    if (document.getElementById('regen-check').checked) {
      const updated = { ...h, ...cambios };
      cambios.criterios = generarCriterios(updated);
      cambios.testCases = generarTestCases(updated);
    }

    actualizarHistoria(h.id, cambios);
    toast('Historia actualizada');
    navigate(`/historias/${h.id}`);
  });
}

// ── IMPORTAR DESDE DOCUMENTO ──────────────────────────────────────────────────
export function renderDocImportForm() {
  const cfg    = state.apiCfg;
  const hasApi = !!(cfg?.key);
  const PROVIDER_LABELS = { claude: 'Claude', openai: 'OpenAI', grok: 'Grok (xAI)', groq: 'Groq' };
  const aiStatusHtml = hasApi
    ? `<div class="ai-status ai-status-ok">✓ IA activa — ${esc(PROVIDER_LABELS[cfg.provider] || cfg.provider)} · ${esc(cfg.model)}</div>`
    : `<div class="ai-status ai-status-warn">⚠ Sin IA configurada. <a href="#/config" class="ai-cfg-link">Configurar API →</a></div>`;

  const TIPOS_DOC = [
    { id: 'prd',       icon: '📋', label: 'PRD / Especificación funcional' },
    { id: 'acta',      icon: '📝', label: 'Acta de reunión / levantamiento' },
    { id: 'requisitos',icon: '📐', label: 'Documento de requisitos' },
    { id: 'negocio',   icon: '💼', label: 'Reglas de negocio' },
    { id: 'tecnico',   icon: '⚙️',  label: 'Documento técnico / arquitectura' },
  ];

  document.getElementById('view').innerHTML = `
<div class="form-view form-view-doc">
  <div class="form-view-header">
    <h1 class="page-title">Historias desde Documento</h1>
    <p class="page-sub">Sube un PDF, Word o TXT con tus requisitos y la IA generará las historias de usuario ISTQB automáticamente</p>
  </div>

  <div class="form-card">
    ${aiStatusHtml}

    <!-- TIPO DE DOCUMENTO -->
    <div class="form-group">
      <label class="form-label">Tipo de documento</label>
      <div class="doc-type-tabs">
        ${TIPOS_DOC.map((t, i) => `
        <button class="doc-type-btn${i === 0 ? ' active' : ''}" data-tipo="${esc(t.id)}" type="button">
          <span>${t.icon}</span><span>${esc(t.label)}</span>
        </button>`).join('')}
      </div>
    </div>

    <!-- FILE DROP ZONE -->
    <div class="form-group">
      <label class="form-label">Archivo de requisitos *</label>
      <div class="doc-drop-zone" id="doc-drop-zone">
        <input type="file" id="doc-file-input" accept=".pdf,.docx,.doc,.txt,.md" class="doc-file-input" />
        <div class="doc-drop-content" id="doc-drop-content">
          <div class="doc-drop-icon">📄</div>
          <div class="doc-drop-title">Arrastrá el archivo aquí o <strong>hacé clic para seleccionar</strong></div>
          <div class="doc-drop-types">PDF · DOCX · TXT · MD</div>
        </div>
        <div class="doc-file-preview hidden" id="doc-file-preview">
          <div class="doc-file-preview-icon" id="doc-preview-icon">📄</div>
          <div class="doc-file-preview-info">
            <div class="doc-file-name" id="doc-preview-name"></div>
            <div class="doc-file-meta" id="doc-preview-meta"></div>
          </div>
          <button class="doc-file-remove" id="doc-file-remove" type="button" title="Quitar archivo">✕</button>
        </div>
      </div>
    </div>

    <!-- TEXTO EXTRAÍDO (preview editable) -->
    <div class="form-group hidden" id="doc-texto-wrap">
      <label class="form-label">
        Texto extraído <span class="form-hint">Revisá y editá antes de enviar a la IA</span>
      </label>
      <div class="doc-texto-toolbar">
        <span class="doc-char-count" id="doc-char-count">0 caracteres</span>
        <button class="btn btn-ghost btn-xs" id="btn-doc-clear-texto" type="button">Limpiar</button>
      </div>
      <textarea id="doc-texto" class="form-control doc-texto-area" rows="10"
        placeholder="El texto del documento aparecerá aquí para que puedas revisarlo antes de enviar a la IA…"></textarea>
    </div>

    <!-- NOTAS ADICIONALES -->
    <div class="form-group">
      <label class="form-label" for="doc-notas">
        Instrucciones adicionales para la IA <span class="form-hint">(opcional)</span>
      </label>
      <input type="text" id="doc-notas" class="form-control"
        placeholder="Ej: enfocate solo en el módulo de pagos, genera historias para el rol de administrador…" />
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" onclick="window.location.hash='#/dashboard'">Cancelar</button>
      <button type="button" class="btn btn-accent btn-doc-gen" id="btn-doc-gen" disabled>
        📄 Extraer texto del archivo
      </button>
    </div>
  </div>

  <!-- RESULTADO -->
  <div id="doc-result-section" class="hidden">
    <div class="doc-result-header">
      <h2 class="doc-result-title">Historias generadas</h2>
      <p class="doc-result-sub" id="doc-result-sub"></p>
    </div>
    <div id="doc-historias-list" class="doc-historias-list"></div>
    <div class="doc-result-actions">
      <button class="btn btn-ghost" id="btn-doc-volver" type="button">← Volver</button>
      <button class="btn btn-accent" id="btn-doc-guardar" type="button">Guardar todas →</button>
    </div>
  </div>

</div>`;

  // ── Estado local ────────────────────────────────────────────────────────────
  let _file     = null;
  let _tipo     = TIPOS_DOC[0].id;
  let _textoExtracted = '';
  let _items    = [];
  let _step     = 'upload'; // 'upload' | 'preview' | 'result'

  // ── Tipo de documento ───────────────────────────────────────────────────────
  document.querySelectorAll('.doc-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.doc-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _tipo = btn.dataset.tipo;
    });
  });

  // ── File input ──────────────────────────────────────────────────────────────
  const dropZone    = document.getElementById('doc-drop-zone');
  const fileInput   = document.getElementById('doc-file-input');
  const dropContent = document.getElementById('doc-drop-content');
  const filePreview = document.getElementById('doc-file-preview');
  const genBtn      = document.getElementById('btn-doc-gen');

  function iconForExt(name) {
    const e = name.split('.').pop().toLowerCase();
    return e === 'pdf' ? '📕' : e === 'docx' || e === 'doc' ? '📘' : '📄';
  }

  function setFile(f) {
    _file = f;
    _step = 'upload';
    document.getElementById('doc-texto-wrap').classList.add('hidden');
    document.getElementById('doc-result-section').classList.add('hidden');
    dropContent.classList.add('hidden');
    filePreview.classList.remove('hidden');
    document.getElementById('doc-preview-icon').textContent = iconForExt(f.name);
    document.getElementById('doc-preview-name').textContent = f.name;
    document.getElementById('doc-preview-meta').textContent =
      (f.size / 1024).toFixed(1) + ' KB · ' + f.type;
    genBtn.disabled = false;
    genBtn.textContent = '📄 Extraer texto del archivo';
  }

  function clearFile() {
    _file = null;
    _step = 'upload';
    fileInput.value = '';
    dropContent.classList.remove('hidden');
    filePreview.classList.add('hidden');
    document.getElementById('doc-texto-wrap').classList.add('hidden');
    document.getElementById('doc-result-section').classList.add('hidden');
    genBtn.disabled = true;
    genBtn.textContent = '📄 Extraer texto del archivo';
  }

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  });
  document.getElementById('doc-file-remove').addEventListener('click', clearFile);

  // Drag & drop
  ['dragover', 'dragenter'].forEach(ev =>
    dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('doc-drop-active'); })
  );
  ['dragleave', 'drop'].forEach(ev =>
    dropZone.addEventListener(ev, () => dropZone.classList.remove('doc-drop-active'))
  );
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  });

  // ── Actualizar contador de caracteres ───────────────────────────────────────
  document.getElementById('doc-texto')?.addEventListener('input', e => {
    document.getElementById('doc-char-count').textContent =
      e.target.value.length.toLocaleString() + ' caracteres';
  });
  document.getElementById('btn-doc-clear-texto')?.addEventListener('click', () => {
    document.getElementById('doc-texto').value = '';
    document.getElementById('doc-char-count').textContent = '0 caracteres';
    _textoExtracted = '';
  });

  // ── Botón principal ─────────────────────────────────────────────────────────
  genBtn.addEventListener('click', async () => {
    if (_step === 'upload') {
      // PASO 1: extraer texto
      if (!_file) return;
      genBtn.disabled = true;
      genBtn.textContent = '⏳ Extrayendo texto…';
      try {
        _textoExtracted = await extraerTextoDeArchivo(_file);
        if (!_textoExtracted.trim()) {
          toast('No se pudo extraer texto del archivo. Probá con otro formato.', 'warn');
          genBtn.disabled = false;
          genBtn.textContent = '📄 Extraer texto del archivo';
          return;
        }
        // Mostrar preview editable
        const textoArea = document.getElementById('doc-texto');
        textoArea.value = _textoExtracted;
        document.getElementById('doc-char-count').textContent =
          _textoExtracted.length.toLocaleString() + ' caracteres';
        document.getElementById('doc-texto-wrap').classList.remove('hidden');
        _step = 'preview';
        genBtn.disabled = !hasApi;
        genBtn.textContent = hasApi ? '✨ Generar historias con IA' : '⚠ Configura tu API primero';
      } catch (err) {
        toast('Error al leer el archivo: ' + err.message, 'error');
        genBtn.disabled = false;
        genBtn.textContent = '📄 Extraer texto del archivo';
      }

    } else if (_step === 'preview') {
      // PASO 2: generar con IA
      if (!hasApi) { toast('Configurá tu API key en ⚙ Configuración', 'warn'); return; }
      const texto = document.getElementById('doc-texto').value.trim();
      if (!texto) { toast('El texto está vacío', 'warn'); return; }
      const notas = document.getElementById('doc-notas').value.trim();
      genBtn.disabled = true;
      genBtn.textContent = '⏳ Generando con IA…';
      toast('Analizando documento con IA…', 'info');

      _items = await generarHistoriasDesdeDoc(_tipo, notas, texto);

      if (!_items || !_items.length) {
        genBtn.disabled = false;
        genBtn.textContent = '✨ Generar historias con IA';
        return;
      }

      // Mostrar resultado
      _step = 'result';
      document.getElementById('doc-result-section').classList.remove('hidden');
      document.getElementById('doc-result-sub').textContent =
        `${_items.length} historias generadas desde "${_file?.name || 'documento'}"`;

      const lista = document.getElementById('doc-historias-list');
      lista.innerHTML = _items.map((item, i) => `
        <div class="doc-hu-item" data-index="${i}">
          <label class="doc-hu-check-row">
            <input type="checkbox" class="doc-hu-check" data-index="${i}" checked>
            <div class="doc-hu-info">
              <div class="doc-hu-titulo">${esc(item.titulo || item.resumen || 'Historia ' + (i+1))}</div>
              <div class="doc-hu-meta">
                <span class="badge badge-tipo-jira">${esc(item.tipo || 'Story')}</span>
                <span class="badge badge-${(item.prioridad||'medium').toLowerCase()}">${esc(item.prioridad || 'Medium')}</span>
                <span class="doc-hu-como">Como ${esc(item.como)} · quiero ${esc(item.quiero)}</span>
              </div>
            </div>
          </label>
        </div>`).join('');

      genBtn.disabled = true;
      genBtn.textContent = '✓ Generado';
      document.getElementById('doc-result-section').scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ── Guardar seleccionadas ───────────────────────────────────────────────────
  document.getElementById('btn-doc-guardar')?.addEventListener('click', () => {
    const checked = [...document.querySelectorAll('.doc-hu-check:checked')]
      .map(cb => _items[Number(cb.dataset.index)])
      .filter(Boolean);
    if (!checked.length) { toast('Seleccioná al menos una historia', 'warn'); return; }
    import('./historias.js').then(({ crearHistoriasDesdeIA }) => {
      const creadas = crearHistoriasDesdeIA(checked, 'ia', 'documento');
      toast(`${creadas.length} historias guardadas`);
      navigate('/historias');
    });
  });

  document.getElementById('btn-doc-volver')?.addEventListener('click', () => {
    _step = 'preview';
    document.getElementById('doc-result-section').classList.add('hidden');
    genBtn.disabled = false;
    genBtn.textContent = '✨ Generar historias con IA';
  });
}
