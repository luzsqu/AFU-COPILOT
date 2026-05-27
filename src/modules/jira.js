import { state } from './state.js';

const _DEV = import.meta.env.DEV;

function b64(email, token) {
  return btoa(`${email}:${token}`);
}

async function jiraFetch(path, options = {}) {
  const cfg = state.jiraCfg;
  if (!cfg?.email || !cfg?.token) throw new Error('Credenciales Jira no configuradas');

  if (_DEV) {
    // Server-side proxy: avoids browser XSRF/CORS issues completely
    const res = await fetch('/api/jira-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: cfg.baseUrl,
        path,
        method: options.method || 'GET',
        auth:   b64(cfg.email, cfg.token),
        body:   options.body || null
      })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(text || `HTTP ${res.status}`); }
    if (!res.ok) {
      const msg = data.errors
        ? Object.values(data.errors).join(' · ')
        : (data.errorMessages?.join(' · ') || data.message || `HTTP ${res.status}`);
      throw new Error(msg);
    }
    return data;
  }

  // Production: direct call (only works locally)
  const res = await fetch(`${(cfg.baseUrl || '').replace(/\/$/, '')}${path}`, {
    ...options,
    credentials: 'omit',
    headers: {
      'Authorization': `Basic ${b64(cfg.email, cfg.token)}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(text || `HTTP ${res.status}`); }
  if (!res.ok) {
    const msg = data.errors
      ? Object.values(data.errors).join(' · ')
      : (data.errorMessages?.join(' · ') || data.message || `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

export async function testJiraConnection() {
  return jiraFetch('/rest/api/2/myself');
}

export async function listarProyectosJira() {
  return jiraFetch('/rest/api/2/project');
}

export async function obtenerTiposIssue(projectKey) {
  const meta = await jiraFetch(`/rest/api/2/issue/createmeta?projectKeys=${encodeURIComponent(projectKey)}&expand=projects.issuetypes`);
  const p = (meta.projects || [])[0];
  return (p?.issuetypes || []).map(t => t.name);
}

export async function detectarCampoSP() {
  const fields = await jiraFetch('/rest/api/2/field');
  const match = fields.find(f =>
    f.name.toLowerCase().includes('story point') ||
    f.id === 'story_points' ||
    f.id === 'customfield_10016' ||
    f.id === 'customfield_10028'
  );
  return match?.id || null;
}

function buildDescription(h) {
  const lines = [
    `Como *${h.como}*, quiero _${h.quiero}_, para _${h.para}_.`,
    ''
  ];
  if (h.descripcion) lines.push(h.descripcion, '');
  const crits = h.criterios || [];
  if (crits.length) {
    lines.push('h3. Criterios de Aceptación', '');
    crits.slice(0, 8).forEach(c => {
      lines.push(`*${c.titulo}*`);
      (c.pasos || []).forEach(p => {
        lines.push(`${p.kw === 'And' ? '  ' : ''}${p.kw} ${p.texto}`);
      });
      lines.push('');
    });
  }
  return lines.join('\n');
}

export async function crearIssueEnJira(h, projectKey) {
  const cfg = state.jiraCfg;
  if (!cfg?.email || !cfg?.token) throw new Error('Configura Jira primero en ⚙ Configuración');

  const base = {
    project:   { key: projectKey },
    issuetype: { name: h.tipo || 'Task' },
    summary:   h.resumen,
  };

  const full = {
    ...base,
    description: buildDescription(h),
    priority:    { name: h.prioridad || 'Medium' },
    labels:      (h.etiquetas || []).map(t => t.replace(/\s+/g, '_'))
  };
  if (h.storyPoints != null && cfg.spField) full[cfg.spField] = Number(h.storyPoints);

  // Progressive fallback: full → base+description → base only
  // Handles Next-gen projects where priority/labels aren't on the create screen
  const attempts = [
    { fields: full },
    { fields: { ...base, description: buildDescription(h) } },
    { fields: base }
  ];

  let lastErr;
  for (const payload of attempts) {
    try {
      return await jiraFetch('/rest/api/2/issue', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      lastErr = err;
      // Only retry if a field is rejected as unavailable — not for auth/project/issuetype errors
      if (_isOptionalFieldError(err.message)) continue;
      throw err;
    }
  }
  throw lastErr;
}

function _isOptionalFieldError(msg) {
  const m = msg.toLowerCase();
  return m.includes('cannot be set') ||
         m.includes('not on the appropriate screen') ||
         m.includes('priority') ||
         m.includes('labels') ||
         m.includes('customfield');
}
