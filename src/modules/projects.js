import { state, PROYECTOS_DEFAULT } from './state.js';
import { guardar } from './storage.js';
import { navigate } from './router.js';
import { toast } from './toast.js';
import { esc, formatDate } from './utils.js';

let _ctxProjId = null;
let _editingProjId = null;

const PROJ_COLORS = [
  '#e87722', '#7c3aed', '#059669', '#2563eb',
  '#dc2626', '#0891b2', '#be185d', '#d97706',
];

function proyectoColor(proj) {
  const idx = state.proyectos.findIndex(p => p.id === proj.id);
  return PROJ_COLORS[idx % PROJ_COLORS.length];
}

function huCountForProject(id) {
  return state.historias.filter(h => h.proyectoId === id).length;
}

export function renderProjects() {
  const view = document.getElementById('view');
  const projs = state.proyectos;

  view.innerHTML = `
<div class="projects-page">
  <div class="projects-hero">
    <div class="projects-hero-text">
      <h1 class="page-title">Mis Proyectos</h1>
      <p class="page-sub">Selecciona un proyecto para continuar o crea uno nuevo</p>
    </div>
    <button class="btn btn-accent" id="btn-new-project">+ Nuevo proyecto</button>
  </div>

  <div class="projects-grid" id="projects-grid">
    ${projs.map(p => renderProjectCard(p, proyectoColor(p))).join('')}
    <div class="project-card project-card-new" id="btn-new-project-card" role="button" tabindex="0" aria-label="Crear nuevo proyecto">
      <div class="project-card-new-icon">+</div>
      <div class="project-card-new-label">Nuevo proyecto</div>
    </div>
  </div>
</div>

<div class="modal-overlay hidden" id="modal-context">
  <div class="modal-box">
    <div class="modal-header">
      <h3>Documentos de contexto</h3>
      <button class="modal-close" id="btn-close-ctx-modal">✕</button>
    </div>
    <div class="modal-body" id="ctx-modal-body"></div>
  </div>
</div>

<div class="modal-overlay hidden" id="modal-project">
  <div class="modal-box">
    <div class="modal-header">
      <h3 id="modal-project-title">Nuevo proyecto</h3>
      <button class="modal-close" id="btn-close-modal-project">✕</button>
    </div>
    <div class="modal-body">
      <form id="form-project" novalidate>
        <div class="form-group">
          <label class="form-label" for="proj-nombre">Nombre *</label>
          <input type="text" id="proj-nombre" class="form-control" placeholder="Mi Proyecto" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="proj-desc">Descripción</label>
          <textarea id="proj-desc" class="form-control" rows="2" placeholder="Descripción breve del proyecto"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="proj-key">Clave Jira</label>
            <input type="text" id="proj-key" class="form-control" placeholder="PROJ" maxlength="10">
          </div>
          <div class="form-group">
            <label class="form-label" for="proj-url">URL Jira (opcional)</label>
            <input type="url" id="proj-url" class="form-control" placeholder="https://...">
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" id="btn-cancel-project">Cancelar</button>
          <button type="submit" class="btn btn-accent">Crear proyecto</button>
        </div>
      </form>
    </div>
  </div>
</div>`;

  document.getElementById('btn-new-project').addEventListener('click', () => openModal());
  document.getElementById('btn-new-project-card').addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal-project').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-project').addEventListener('click', closeModal);
  document.getElementById('form-project').addEventListener('submit', crearProyecto);
  document.getElementById('btn-close-ctx-modal').addEventListener('click', () => {
    document.getElementById('modal-context').classList.add('hidden');
  });
  document.getElementById('projects-grid').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    if (editBtn) { e.stopPropagation(); openModal(editBtn.dataset.editId); return; }
    const ctxBtn = e.target.closest('[data-ctx-id]');
    if (ctxBtn) { e.stopPropagation(); openContextModal(ctxBtn.dataset.ctxId); return; }
    const card = e.target.closest('.project-card[data-id]');
    if (card) activarProyecto(card.dataset.id);
  });
  document.getElementById('projects-grid').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.project-card[data-id]');
      if (card) activarProyecto(card.dataset.id);
    }
  });
}

function renderProjectCard(p, color) {
  const count = huCountForProject(p.id);
  const activo = state.proyectoActivoId === p.id ? ' project-card-active' : '';
  const ctxCount = (p.contexto || []).length;
  return `
<div class="project-card${activo}" data-id="${esc(p.id)}" role="button" tabindex="0"
     aria-label="Proyecto ${esc(p.nombre)}" style="--proj-color: ${color}">
  <div class="project-card-header">
    <div class="project-card-key" style="background: ${color}">${esc(p.jiraKey || p.nombre.substring(0,3).toUpperCase())}</div>
    ${activo ? '<span class="project-card-active-badge">✓ Activo</span>' : ''}
  </div>
  <div class="project-card-name">${esc(p.nombre)}</div>
  <div class="project-card-desc">${esc(p.descripcion || 'Sin descripción')}</div>
  <div class="project-card-meta">
    <span class="project-card-count">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 4h9M2 7h6M2 10h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      ${count} historia${count !== 1 ? 's' : ''}
    </span>
    <span>${formatDate(p.creado)}</span>
  </div>
  <div class="project-card-actions">
    <button class="proj-ctx-btn" data-ctx-id="${esc(p.id)}" title="Gestionar documentos de contexto para IA">
      📄 Contexto IA
      ${ctxCount > 0 ? `<span class="proj-ctx-badge">${ctxCount}</span>` : ''}
    </button>
    <button class="proj-edit-btn" data-edit-id="${esc(p.id)}" title="Editar proyecto">✏ Editar</button>
  </div>
</div>`;
}

function openModal(editId) {
  _editingProjId = editId || null;
  const titleEl   = document.getElementById('modal-project-title');
  const submitBtn = document.querySelector('#form-project [type="submit"]');
  document.getElementById('form-project').reset();

  if (_editingProjId) {
    const proj = state.proyectos.find(p => p.id === _editingProjId);
    if (!proj) return;
    titleEl.textContent          = 'Editar proyecto';
    submitBtn.textContent        = 'Guardar cambios';
    document.getElementById('proj-nombre').value = proj.nombre;
    document.getElementById('proj-desc').value   = proj.descripcion || '';
    document.getElementById('proj-key').value    = proj.jiraKey || '';
    document.getElementById('proj-url').value    = proj.jiraUrl || '';
  } else {
    titleEl.textContent   = 'Nuevo proyecto';
    submitBtn.textContent = 'Crear proyecto';
  }
  document.getElementById('modal-project').classList.remove('hidden');
  document.getElementById('proj-nombre').focus();
}

function closeModal() {
  _editingProjId = null;
  document.getElementById('modal-project').classList.add('hidden');
  document.getElementById('form-project').reset();
}

function crearProyecto(e) {
  e.preventDefault();
  const nombre = document.getElementById('proj-nombre').value.trim();
  if (!nombre) { toast('Ingresa un nombre para el proyecto', 'warn'); return; }

  if (_editingProjId) {
    const proj = state.proyectos.find(p => p.id === _editingProjId);
    if (!proj) return;
    proj.nombre      = nombre;
    proj.descripcion = document.getElementById('proj-desc').value.trim();
    proj.jiraKey     = document.getElementById('proj-key').value.trim().toUpperCase();
    proj.jiraUrl     = document.getElementById('proj-url').value.trim();
    guardar();
    closeModal();
    renderProjects();
    toast('Proyecto actualizado ✓');
    return;
  }

  const proj = {
    id: 'proj-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    nombre,
    descripcion: document.getElementById('proj-desc').value.trim(),
    jiraKey: document.getElementById('proj-key').value.trim().toUpperCase(),
    jiraUrl: document.getElementById('proj-url').value.trim(),
    creado: new Date().toISOString(),
    contexto: []
  };
  state.proyectos.push(proj);
  guardar();
  closeModal();
  activarProyecto(proj.id);
}

function activarProyecto(id) {
  state.proyectoActivoId = id;
  // Limpiar selección al cambiar de proyecto para evitar operar
  // sobre historias de un proyecto distinto al activo.
  state.seleccionadas.clear();
  state.modoSeleccion = false;
  guardar();
  navigate('/dashboard');
}

// ── CONTEXT DOCUMENTS ─────────────────────────────────────────────────────────
function openContextModal(projId) {
  const proj = state.proyectos.find(p => p.id === projId);
  if (!proj) return;
  if (!proj.contexto) proj.contexto = [];
  _ctxProjId = projId;
  renderContextModalBody(proj);
  document.getElementById('modal-context').classList.remove('hidden');
}

function renderContextModalBody(proj) {
  const docs = proj.contexto || [];
  const body = document.getElementById('ctx-modal-body');

  body.innerHTML = `
<p style="font-size:.82rem;color:var(--text-muted);margin-bottom:1rem;line-height:1.5">
  Estos documentos se incluyen en los prompts de IA para generar historias más alineadas al negocio de
  <strong>${esc(proj.nombre)}</strong>.
</p>
${docs.length ? `
<div class="ctx-doc-list">
  ${docs.map((doc, i) => `
    <div class="ctx-doc-item">
      <span class="ctx-doc-icon">📄</span>
      <div class="ctx-doc-info">
        <div class="ctx-doc-name">${esc(doc.nombre)}</div>
        <div class="ctx-doc-meta">${doc.texto.length.toLocaleString()} caracteres · ${formatDate(doc.creadoEn)}</div>
      </div>
      <button class="btn-icon btn-icon-del" data-del-ctx="${i}" title="Eliminar">✕</button>
    </div>`).join('')}
</div>` : `<div style="text-align:center;padding:.75rem 0 1.25rem;color:var(--text-muted);font-size:.84rem">Sin documentos de contexto</div>`}

<div class="ctx-add-section">
  <div class="ctx-add-section-label">Agregar documento</div>
  <div class="ctx-add-tabs">
    <button class="ctx-tab-btn active" id="ctx-tab-texto">Pegar texto</button>
    <button class="ctx-tab-btn" id="ctx-tab-archivo">Subir archivo</button>
  </div>
  <div id="ctx-panel-texto">
    <div class="form-group">
      <label class="form-label" for="ctx-nombre">Nombre *</label>
      <input type="text" id="ctx-nombre" class="form-control" placeholder="Ej: Requisitos, PRD, Glosario…">
    </div>
    <div class="form-group">
      <label class="form-label" for="ctx-texto">Contenido *</label>
      <textarea id="ctx-texto" class="form-control" rows="5" placeholder="Pega aquí el contexto: reglas de negocio, glosario, requisitos técnicos…"></textarea>
    </div>
    <button class="btn btn-accent btn-sm" id="btn-add-ctx-texto">Agregar texto</button>
  </div>
  <div id="ctx-panel-archivo" class="hidden">
    <div class="form-group">
      <label class="form-label">Archivo (.txt, .md, .json, .csv) *</label>
      <input type="file" id="ctx-file-input" class="form-control" accept=".txt,.md,.json,.csv" style="padding:.3rem .5rem">
    </div>
    <button class="btn btn-accent btn-sm" id="btn-add-ctx-archivo" disabled>Agregar archivo</button>
  </div>
</div>`;

  // Delete doc
  body.querySelectorAll('[data-del-ctx]').forEach(btn => {
    btn.addEventListener('click', () => {
      proj.contexto.splice(Number(btn.dataset.delCtx), 1);
      guardar();
      renderContextModalBody(proj);
      syncContextBadge(proj);
      toast('Documento eliminado');
    });
  });

  // Tabs
  document.getElementById('ctx-tab-texto').addEventListener('click', () => {
    document.getElementById('ctx-tab-texto').classList.add('active');
    document.getElementById('ctx-tab-archivo').classList.remove('active');
    document.getElementById('ctx-panel-texto').classList.remove('hidden');
    document.getElementById('ctx-panel-archivo').classList.add('hidden');
  });
  document.getElementById('ctx-tab-archivo').addEventListener('click', () => {
    document.getElementById('ctx-tab-archivo').classList.add('active');
    document.getElementById('ctx-tab-texto').classList.remove('active');
    document.getElementById('ctx-panel-archivo').classList.remove('hidden');
    document.getElementById('ctx-panel-texto').classList.add('hidden');
  });

  // Add text
  document.getElementById('btn-add-ctx-texto').addEventListener('click', () => {
    const nombre = document.getElementById('ctx-nombre').value.trim();
    const texto  = document.getElementById('ctx-texto').value.trim();
    if (!nombre || !texto) { toast('Completa el nombre y el contenido', 'warn'); return; }
    proj.contexto.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,4), nombre, texto, creadoEn: new Date().toISOString() });
    guardar();
    renderContextModalBody(proj);
    syncContextBadge(proj);
    toast('Documento agregado');
  });

  // Add file
  let _fileReady = null;
  const fileInput = document.getElementById('ctx-file-input');
  const addFileBtn = document.getElementById('btn-add-ctx-archivo');
  fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) { _fileReady = null; addFileBtn.disabled = true; return; }
    const texto = await file.text();
    _fileReady = { nombre: file.name, texto };
    addFileBtn.disabled = false;
  });
  addFileBtn.addEventListener('click', () => {
    if (!_fileReady) return;
    proj.contexto.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ..._fileReady, creadoEn: new Date().toISOString() });
    guardar();
    renderContextModalBody(proj);
    syncContextBadge(proj);
    toast('Archivo agregado');
    _fileReady = null;
  });
}

function syncContextBadge(proj) {
  document.querySelectorAll(`.proj-ctx-btn[data-ctx-id="${proj.id}"]`).forEach(btn => {
    let badge = btn.querySelector('.proj-ctx-badge');
    const n = (proj.contexto || []).length;
    if (n > 0) {
      if (badge) badge.textContent = n;
      else btn.insertAdjacentHTML('beforeend', `<span class="proj-ctx-badge">${n}</span>`);
    } else {
      badge?.remove();
    }
  });
}
