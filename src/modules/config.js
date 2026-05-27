import { state, MODELS } from './state.js';
import { guardar, guardarConfigIA, borrarConfigIA, guardarConfigJira, borrarConfigJira } from './storage.js';
import { toast } from './toast.js';
import { esc } from './utils.js';
import { API_URLS } from './import.js';

const PROVIDER_LABELS = { claude: 'Claude', openai: 'OpenAI', grok: 'Grok (xAI)', groq: 'Groq' };

export function renderConfig() {
  const jiraCfg   = state.jiraCfg || null;
  const hasJira   = !!(jiraCfg?.email && jiraCfg?.token);
  const cfg = state.apiCfg || null;
  const provider = cfg?.provider || 'groq';
  const modelos = MODELS[provider] || MODELS.groq;
  const hasKey = !!(cfg?.key);

  document.getElementById('view').innerHTML = `
<div class="config-wrap">
  <div class="config-header">
    <h1 class="page-title">Configuración</h1>
    <p class="page-sub">Personaliza el comportamiento del asistente y tus preferencias</p>
  </div>

  <!-- ── INTELIGENCIA ARTIFICIAL ──────────────────── -->
  <div class="config-section">
    <div class="config-section-label">Inteligencia Artificial</div>
    <div class="config-card">
      <div class="config-body">

        <div class="api-estado-row">
          <div>
            <div class="api-estado-titulo">Estado del API</div>
            <div class="api-estado-sub">
              ${hasKey
                ? `Proveedor: <strong>${esc(PROVIDER_LABELS[cfg.provider] || cfg.provider)}</strong> · Modelo: <strong>${esc(cfg.model)}</strong>`
                : 'Sin clave configurada — las funciones de IA no estarán disponibles'}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem">
            ${hasKey ? `<button type="button" class="btn btn-outline btn-sm" id="btn-test-api">Probar conexión</button>` : ''}
            <span class="api-status ${hasKey ? 'api-status-ok' : 'api-status-missing'}">
              ${hasKey ? '● Configurado' : '○ Sin configurar'}
            </span>
          </div>
        </div>

        <div id="test-result" class="test-result hidden"></div>

        <form id="form-api" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cfg-provider">Proveedor</label>
              <select id="cfg-provider" class="form-control">
                <option value="groq"${provider === 'groq'   ? ' selected' : ''}>Groq — tier gratuito</option>
                <option value="grok"${provider === 'grok'   ? ' selected' : ''}>Grok (xAI) — tier gratuito</option>
                <option value="claude"${provider === 'claude' ? ' selected' : ''}>Claude (Anthropic)</option>
                <option value="openai"${provider === 'openai' ? ' selected' : ''}>OpenAI</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="cfg-model">Modelo</label>
              <select id="cfg-model" class="form-control">
                ${modelos.map(m => `<option value="${esc(m)}"${cfg?.model === m ? ' selected' : ''}>${esc(m)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="cfg-key">
              API Key <span class="form-hint">(se guarda solo en este navegador)</span>
            </label>
            <div class="input-wrap">
              <input type="password" id="cfg-key" class="form-control"
                placeholder="${hasKey ? '••••••••••••••••' : 'Pega tu API key aquí…'}"
                autocomplete="off" spellcheck="false">
              <button type="button" class="input-toggle" id="btn-toggle-key" aria-label="Mostrar clave">👁</button>
            </div>
            <div class="form-hint" style="margin-top:.35rem" id="key-hint">${providerHint(provider)}</div>
          </div>

          <div class="form-actions">
            ${hasKey ? `<button type="button" class="btn btn-ghost" id="btn-clear-api">Eliminar clave</button>` : ''}
            <button type="submit" class="btn btn-accent">Guardar configuración</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ── JIRA ──────────────────────────────────── -->
  <div class="config-section">
    <div class="config-section-label">Integración Jira</div>
    <div class="config-card">
      <div class="config-body">

        <div class="api-estado-row">
          <div>
            <div class="api-estado-titulo">Estado de Jira</div>
            <div class="api-estado-sub">
              ${hasJira
                ? `Workspace: <strong>${esc(jiraCfg.baseUrl)}</strong> · ${esc(jiraCfg.email)}`
                : 'Sin credenciales — no se pueden enviar historias a Jira'}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem">
            ${hasJira ? `<button type="button" class="btn btn-outline btn-sm" id="btn-test-jira">Probar conexión</button>` : ''}
            <span class="api-status ${hasJira ? 'api-status-ok' : 'api-status-missing'}">
              ${hasJira ? '● Configurado' : '○ Sin configurar'}
            </span>
          </div>
        </div>

        <div id="jira-test-result" class="test-result hidden"></div>

        <form id="form-jira" novalidate>
          <div class="form-group">
            <label class="form-label" for="jira-url">URL del workspace Jira *</label>
            <input type="url" id="jira-url" class="form-control"
              placeholder="https://tuempresa.atlassian.net"
              value="${hasJira ? esc(jiraCfg.baseUrl) : ''}">
            <div class="form-hint jira-env-hint" style="margin-top:.4rem">
              ⚠ Agrega también <code>VITE_JIRA_BASE_URL=https://tuempresa.atlassian.net</code> en el archivo <code>.env</code> y reinicia <code>npm run dev</code>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="jira-email">Email Atlassian *</label>
              <input type="email" id="jira-email" class="form-control"
                placeholder="tu@email.com"
                value="${hasJira ? esc(jiraCfg.email) : ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="jira-token">
                API Token * <span class="form-hint">(id.atlassian.com → Security)</span>
              </label>
              <div class="input-wrap">
                <input type="password" id="jira-token" class="form-control"
                  placeholder="${hasJira ? '••••••••••••••••' : 'Pega tu API token…'}"
                  autocomplete="off" spellcheck="false">
                <button type="button" class="input-toggle" id="btn-toggle-jira-token" aria-label="Mostrar token">👁</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="jira-sp-field">
              Campo Story Points <span class="form-hint">(ej: customfield_10016 — opcional)</span>
            </label>
            <div style="display:flex;gap:.5rem;align-items:flex-start">
              <input type="text" id="jira-sp-field" class="form-control"
                placeholder="customfield_10016"
                value="${hasJira && jiraCfg.spField ? esc(jiraCfg.spField) : ''}">
              <button type="button" class="btn btn-ghost btn-sm" id="btn-detect-sp"
                style="white-space:nowrap;flex-shrink:0" ${!hasJira ? 'disabled' : ''}>
                Auto-detectar
              </button>
            </div>
          </div>

          <div class="form-actions">
            ${hasJira ? `<button type="button" class="btn btn-ghost" id="btn-clear-jira">Eliminar credenciales</button>` : ''}
            <button type="submit" class="btn btn-accent">Guardar configuración Jira</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ── PREFERENCIAS ──────────────────────────── -->
  <div class="config-section">
    <div class="config-section-label">Preferencias</div>
    <div class="config-card">
      <div class="config-row">
        <div>
          <div class="config-row-label">Modo oscuro</div>
          <div class="config-row-sub">Cambia entre tema claro y oscuro</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="cfg-dark-mode" ${state.prefs.darkMode ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="config-row">
        <div>
          <div class="config-row-label">Vista predeterminada de historias</div>
          <div class="config-row-sub">Cards o lista al abrir el módulo</div>
        </div>
        <select id="cfg-vista" class="form-control" style="width:120px">
          <option value="cards"${state.prefs.vista === 'cards' ? ' selected' : ''}>Cards</option>
          <option value="lista"${state.prefs.vista === 'lista' ? ' selected' : ''}>Lista</option>
        </select>
      </div>
    </div>
  </div>

  <!-- ── CUENTA ─────────────────────────────────── -->
  <div class="config-section">
    <div class="config-section-label">Cuenta</div>
    <div class="config-card">
      <div class="config-row">
        <div><div class="config-row-label">Usuario</div><div class="config-row-sub">Credenciales guardadas localmente</div></div>
        <span class="config-row-val">${esc(state.usuario?.username || '—')}</span>
      </div>
      <div class="config-row">
        <div><div class="config-row-label">Proyectos</div></div>
        <span class="config-row-val">${state.proyectos.length} proyecto${state.proyectos.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="config-row">
        <div><div class="config-row-label">Historias totales</div></div>
        <span class="config-row-val">${state.historias.length} historia${state.historias.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  </div>

  <!-- ── ACERCA DE ──────────────────────────────── -->
  <div class="config-section">
    <div class="config-section-label">Acerca de</div>
    <div class="config-card">
      <div class="config-row">
        <div>
          <div class="config-row-label">Analista HU</div>
          <div class="config-row-sub">Herramienta de análisis ISTQB Foundation Level</div>
        </div>
        <span class="config-row-val" style="font-size:.78rem;background:var(--accent-soft);color:var(--accent);padding:.2rem .5rem;border-radius:5px;font-weight:600">v2.0</span>
      </div>
      <div class="config-row">
        <div>
          <div class="config-row-label">Almacenamiento</div>
          <div class="config-row-sub">Todos los datos se guardan localmente en tu navegador (localStorage)</div>
        </div>
        <span class="config-row-val">100% local</span>
      </div>
    </div>
  </div>

</div>`;

  // Provider change → update model list + hint
  document.getElementById('cfg-provider').addEventListener('change', e => {
    const prov = e.target.value;
    const sel = document.getElementById('cfg-model');
    sel.innerHTML = (MODELS[prov] || MODELS.groq)
      .map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    const hint = document.getElementById('key-hint');
    if (hint) hint.textContent = providerHint(prov);
  });

  // Toggle key visibility
  document.getElementById('btn-toggle-key').addEventListener('click', () => {
    const inp = document.getElementById('cfg-key');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  // Save API config
  document.getElementById('form-api').addEventListener('submit', e => {
    e.preventDefault();
    const key   = document.getElementById('cfg-key').value.trim();
    const prov  = document.getElementById('cfg-provider').value;
    const model = document.getElementById('cfg-model').value;
    if (!key && !hasKey) { toast('Ingresa una API key', 'warn'); return; }
    guardarConfigIA({ provider: prov, key: key || cfg?.key || '', model });
    toast('Configuración guardada ✓');
    renderConfig();
  });

  // Clear API key
  document.getElementById('btn-clear-api')?.addEventListener('click', () => {
    borrarConfigIA();
    toast('API key eliminada');
    renderConfig();
  });

  // Probar conexión
  document.getElementById('btn-test-api')?.addEventListener('click', () => probarConexion(cfg));

  // Dark mode toggle
  document.getElementById('cfg-dark-mode').addEventListener('change', e => {
    state.prefs.darkMode = e.target.checked;
    document.documentElement.classList.toggle('dark', state.prefs.darkMode);
    guardar();
  });

  // Vista toggle
  document.getElementById('cfg-vista').addEventListener('change', e => {
    state.prefs.vista = e.target.value;
    guardar();
    toast('Preferencia guardada');
  });

  // ── JIRA ──────────────────────────────────────────────
  document.getElementById('btn-toggle-jira-token')?.addEventListener('click', () => {
    const inp = document.getElementById('jira-token');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('form-jira').addEventListener('submit', e => {
    e.preventDefault();
    const baseUrl  = document.getElementById('jira-url').value.trim().replace(/\/$/, '');
    const email    = document.getElementById('jira-email').value.trim();
    const token    = document.getElementById('jira-token').value.trim();
    const spField  = document.getElementById('jira-sp-field').value.trim();
    if (!baseUrl || !email) { toast('Completa la URL y el email', 'warn'); return; }
    if (!token && !hasJira) { toast('Ingresa el API token', 'warn'); return; }
    guardarConfigJira({ baseUrl, email, token: token || jiraCfg?.token || '', spField: spField || '' });
    toast('Configuración Jira guardada ✓');
    renderConfig();
  });

  document.getElementById('btn-clear-jira')?.addEventListener('click', () => {
    borrarConfigJira();
    toast('Credenciales Jira eliminadas');
    renderConfig();
  });

  document.getElementById('btn-test-jira')?.addEventListener('click', () => probarJira());
  document.getElementById('btn-detect-sp')?.addEventListener('click', () => detectarSP());
}

function providerHint(prov) {
  return {
    groq:   'Obtén tu key gratis en console.groq.com — empieza con "gsk_"',
    grok:   'Obtén tu key gratis en console.x.ai — empieza con "xai-"',
    claude: 'Obtén tu key en console.anthropic.com — empieza con "sk-ant-"',
    openai: 'Obtén tu key en platform.openai.com — empieza con "sk-"'
  }[prov] || '';
}

function showTestResult(tipo, msg) {
  const el = document.getElementById('test-result');
  if (!el) return;
  el.className = `test-result test-result-${tipo}`;
  el.innerHTML = tipo === 'loading'
    ? `<span class="test-spinner"></span> ${esc(msg)}`
    : `<strong>${tipo === 'ok' ? '✓' : '✕'}</strong> ${esc(msg)}`;
}

async function probarJira() {
  const btn = document.getElementById('btn-test-jira');
  if (btn) btn.disabled = true;
  showJiraResult('loading', 'Conectando con Jira…');
  try {
    const { testJiraConnection } = await import('./jira.js');
    const me = await testJiraConnection();
    showJiraResult('ok', `Conexión exitosa · ${esc(me.displayName)} (${esc(me.emailAddress)})`);
  } catch (err) {
    showJiraResult('error', err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function detectarSP() {
  const btn = document.getElementById('btn-detect-sp');
  if (!btn) return;
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Detectando…';
  try {
    const { detectarCampoSP } = await import('./jira.js');
    const fieldId = await detectarCampoSP();
    if (fieldId) {
      document.getElementById('jira-sp-field').value = fieldId;
      toast(`Campo SP detectado: ${fieldId}`);
    } else {
      toast('No se encontró automáticamente — ingrésalo manualmente', 'warn');
    }
  } catch (err) {
    toast('Error al detectar: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

function showJiraResult(tipo, msg) {
  const el = document.getElementById('jira-test-result');
  if (!el) return;
  el.className = `test-result test-result-${tipo}`;
  el.innerHTML = tipo === 'loading'
    ? `<span class="test-spinner"></span> ${msg}`
    : `<strong>${tipo === 'ok' ? '✓' : '✕'}</strong> ${msg}`;
}

async function probarConexion(cfg) {
  const btn = document.getElementById('btn-test-api');
  if (!cfg?.key) return;

  btn.disabled = true;
  showTestResult('loading', 'Conectando…');

  const prov  = cfg.provider;
  const model = cfg.model;
  const key   = cfg.key;

  try {
    let ok = false;
    let reply = '';

    if (prov === 'claude') {
      const res = await fetch(API_URLS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model, max_tokens: 30, messages: [{ role: 'user', content: 'Responde solo "OK".' }] })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${d.error?.message || JSON.stringify(d.error || d)}`);
      reply = d.content?.[0]?.text || '(sin texto)';
      ok = true;
    } else {
      const url = API_URLS[prov];
      if (!url) throw new Error(`Proveedor "${prov}" no reconocido`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, max_tokens: 30, messages: [{ role: 'user', content: 'Responde solo "OK".' }] })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${d.error?.message || JSON.stringify(d.error || d)}`);
      reply = d.choices?.[0]?.message?.content || '(sin texto)';
      ok = true;
    }

    showTestResult('ok', `Conexión exitosa con ${PROVIDER_LABELS[prov] || prov} · ${model}. Respuesta: "${reply.trim()}"`);
  } catch (err) {
    showTestResult('error', err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}
