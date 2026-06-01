import { state, TC_TIPOS } from './state.js';
import { escHtml } from './utils.js';
import { toast } from './toast.js';

function idsToExport() {
  if (state.seleccionadas.size > 0) return [...state.seleccionadas];
  return state.historias
    .filter(h => h.proyectoId === state.proyectoActivoId)
    .map(h => h.id);
}

function getHists() {
  return idsToExport().map(id => state.historias.find(h => h.id === id)).filter(Boolean);
}

function descargar(contenido, nombre, tipo = 'text/markdown') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export function huMd(h) {
  let md = `# ${h.id} — ${h.resumen}\n\n`;
  md += `**Tipo:** ${h.tipo} | **Prioridad:** ${h.prioridad} | **Creada:** ${new Date(h.creadoEn).toLocaleDateString('es-ES')}\n\n`;
  if (h.etiquetas?.length) md += `**Etiquetas:** ${h.etiquetas.join(', ')}\n\n`;
  md += `## Historia de Usuario\n\n- **Como** ${h.como},\n- **quiero** ${h.quiero},\n- **para** ${h.para}.\n\n`;
  if (h.descripcion) md += `> ${h.descripcion}\n\n`;

  if ((h.criterios || []).length) {
    md += `## Criterios de Aceptación (Gherkin)\n\n`;
    h.criterios.forEach(c => {
      md += `### ${c.id} — ${c.titulo}\n\n\`\`\`gherkin\n`;
      c.pasos.forEach(p => { md += `  ${p.kw === 'And' ? '  And' : p.kw} ${p.texto}\n`; });
      md += `\`\`\`\n\n`;
    });
  }

  if ((h.testCases || []).length) {
    md += `## Test Cases\n\n| ID | Título | Tipo | Prioridad | Estado |\n|---|---|---|---|---|\n`;
    h.testCases.forEach(tc => {
      md += `| ${tc.id} | ${tc.titulo} | ${tc.tipo} | ${tc.prioridad} | ${tc.estado} |\n`;
    });
    md += '\n';
  }

  md += '\n---\n\n';
  return md;
}

export function exportarTodo() {
  const lista = getHists();
  if (!lista.length) { toast('No hay historias para exportar', 'warn'); return; }
  let md = `# Historias de Usuario — Exportación ISTQB\n\n**Fecha:** ${new Date().toLocaleDateString('es-ES')} | **Total:** ${lista.length}\n\n---\n\n`;
  md += lista.map(huMd).join('');
  descargar(md, `historias-${Date.now()}.md`);
  toast(`${lista.length} historias exportadas a Markdown`);
}

export function exportarPDF() {
  const lista = getHists();
  if (!lista.length) { toast('No hay historias para exportar', 'warn'); return; }

  const pagesHtml = lista.map((h, hi) => {
    const tcBlocks = (h.criterios || []).map((c, ci) => {
      const tcId = `${h.id}-TC-${String(ci + 1).padStart(3, '0')}`;
      const t = TC_TIPOS[c.tipo] || { label: c.tipo.toUpperCase(), bg: '#fef3c7', color: '#92400e' };
      const lines = (c.pasos || []).map(p => {
        const cls = { Scenario:'#c2410c', Given:'#b45309', When:'#15803d', Then:'#b91c1c', And:'#6b7280' };
        return `<div><span style="color:${cls[p.kw]||'#374151'};font-weight:600;min-width:72pt;display:inline-block">${escHtml(p.kw)}</span> ${escHtml(p.texto)}</div>`;
      }).join('');
      return `<div style="margin-bottom:8pt;break-inside:avoid">
        <div style="display:flex;gap:6pt;align-items:center;margin-bottom:3pt">
          <span style="font-size:7pt;font-weight:700;background:#fef3c7;padding:1pt 4pt;border-radius:3pt">${escHtml(tcId)}</span>
          <span style="font-size:7pt;font-weight:700;padding:1pt 4pt;border-radius:3pt;background:${t.bg};color:${t.color}">${t.label}</span>
          <span style="font-size:8pt;font-weight:600">${escHtml(c.titulo)}</span>
        </div>
        <pre style="margin:0;background:#f9fafb;border-left:2.5pt solid #0f766e;padding:5pt 8pt;font-size:8pt;line-height:1.6;white-space:pre-wrap">${lines}</pre>
      </div>`;
    }).join('');

    return `<div class="page">
      <div style="border-bottom:2pt solid #0f766e;padding-bottom:8pt;margin-bottom:12pt;display:flex;justify-content:space-between">
        <div>
          <div style="font-size:8pt;color:#0f766e;font-weight:700;margin-bottom:2pt">${escHtml(h.id)}</div>
          <div style="font-size:15pt;font-weight:800;color:#18181b">${escHtml(h.resumen)}</div>
          <div style="font-size:8pt;color:#71717a;margin-top:3pt">
            ${escHtml(h.tipo)} · ${escHtml(h.prioridad)} · ${new Date(h.creadoEn).toLocaleDateString('es-ES')}
          </div>
        </div>
        <div style="text-align:right;font-size:8pt;color:#71717a">
          ${(h.criterios||[]).length} criterios
        </div>
      </div>
      <div style="background:#f0fdf4;border-left:3pt solid #0f766e;padding:7pt;font-size:9pt;margin-bottom:12pt">
        Como <strong>${escHtml(h.como)}</strong>, quiero ${escHtml(h.quiero)}, para ${escHtml(h.para)}.
      </div>
      <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#0f766e;margin-bottom:8pt">Criterios de Aceptación (${(h.criterios||[]).length} escenarios)</div>
      ${tcBlocks}
      <div style="margin-top:12pt;padding-top:4pt;border-top:0.5pt solid #e4e4e7;font-size:7pt;color:#a1a1aa;display:flex;justify-content:space-between">
        <span>Analista HU — ISTQB Foundation Level</span>
        <span>Historia ${hi+1}/${lista.length} · ${new Date().toLocaleDateString('es-ES')}</span>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Test Cases ISTQB</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{margin:1.5cm;size:A4}
    body{font-family:Arial,sans-serif;font-size:10pt;color:#18181b;background:#fff}
    .page{page-break-after:always;max-width:100%}.page:last-child{page-break-after:auto}
    </style></head><body>${pagesHtml}
    <script>window.onload=()=>{window.print()}<\/script></body></html>`;

  const w = window.open('', '_blank');
  if (!w) { toast('El navegador bloqueó la ventana emergente', 'warn'); return; }
  w.document.write(html);
  w.document.close();
  toast(`PDF generado: ${lista.length} historia${lista.length !== 1 ? 's' : ''}`);
}

export function exportarCSV() {
  const lista = getHists();
  if (!lista.length) { toast('No hay historias para exportar', 'warn'); return; }

  const cols = ['HU_ID','Summary','Issue_Type','Priority','Story_Points','Como','Quiero','Para','Descripcion','Labels','TC_ID','TC_Titulo','TC_Tipo','TC_Prioridad','TC_Estado'];
  const rows = [cols];

  lista.forEach(h => {
    const tcs = h.testCases || [];
    if (tcs.length) {
      tcs.forEach(tc => {
        rows.push([
          h.id, h.resumen, h.tipo, h.prioridad, h.storyPoints ?? '',
          h.como, h.quiero, h.para, h.descripcion || '',
          (h.etiquetas||[]).join(';'),
          tc.id, tc.titulo, tc.tipo, tc.prioridad, tc.estado
        ]);
      });
    } else {
      rows.push([
        h.id, h.resumen, h.tipo, h.prioridad, h.storyPoints ?? '',
        h.como, h.quiero, h.para, h.descripcion || '',
        (h.etiquetas||[]).join(';'),
        '','','','',''
      ]);
    }
  });

  const csv = rows.map(r =>
    r.map(cell => {
      const s = String(cell ?? '');
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')
  ).join('\r\n');

  descargar('﻿' + csv, `test-cases-istqb-${Date.now()}.csv`, 'text/csv;charset=utf-8');
  toast(`CSV descargado: ${rows.length - 1} filas`);
}

// ─── EXPORTAR TCs DE UNA SOLA HISTORIA ─────────────────────────────────────

function csvCell(val) {
  const s = String(val ?? '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** CSV detallado: un TC por fila con precondiciones, pasos, datos y resultado */
export function exportarTCsDeHU(h) {
  const tcs = h.testCases || [];
  if (!tcs.length) { toast('Sin test cases para exportar', 'warn'); return; }

  const cols = [
    'TC_ID','HU_ID','HU_Titulo',
    'Titulo','Tipo','Prioridad','Estado',
    'Tags','Criterio_Vinculado',
    'Precondiciones','Pasos','Datos_Prueba','Resultado_Esperado'
  ];

  const rows = [cols, ...tcs.map(tc => [
    tc.id,
    h.id,
    h.resumen,
    tc.titulo,
    tc.tipo,
    tc.prioridad,
    tc.estado,
    (tc.tags || []).join(';'),
    tc.criterioVinculado || '',
    (tc.precondiciones || []).join(' | '),
    (tc.pasos || []).map((p, i) => `${i + 1}. ${p}`).join(' | '),
    (tc.datosPrueba || []).map(d => `${d.campo}=${d.valor}(${d.tipo || ''})`).join(' | '),
    tc.resultadoEsperado || ''
  ])];

  const csv = rows.map(r => r.map(csvCell).join(',')).join('\r\n');
  descargar('﻿' + csv, `TC_${h.id}.csv`, 'text/csv;charset=utf-8');
  toast(`${tcs.length} test cases exportados a CSV`);
}

/** Markdown completo: agrupado por tipo, con todos los detalles */
export function tcsMd(h) {
  const tcs = h.testCases || [];
  let md = `# Test Cases — ${h.id}: ${h.resumen}\n\n`;
  md += `> **Proyecto:** ${h.proyectoId || '—'} | **Fecha:** ${new Date().toLocaleDateString('es-ES')} | **Total TCs:** ${tcs.length}\n\n---\n\n`;

  const byTipo = {};
  tcs.forEach(tc => {
    const t = tc.tipo || 'Funcional';
    (byTipo[t] = byTipo[t] || []).push(tc);
  });

  Object.entries(byTipo).forEach(([tipo, items]) => {
    md += `## ${tipo} (${items.length})\n\n`;
    items.forEach(tc => {
      md += `### ${tc.id} — ${tc.titulo}\n\n`;
      md += `**Tipo:** ${tc.tipo} | **Prioridad:** ${tc.prioridad} | **Estado:** ${tc.estado}`;
      if (tc.criterioVinculado) md += ` | **Criterio:** ${tc.criterioVinculado}`;
      if (tc.tags?.length) md += ` | **Tags:** \`${tc.tags.join('` `')}\``;
      md += '\n\n';

      if (tc.precondiciones?.length) {
        md += `**Precondiciones:**\n`;
        tc.precondiciones.forEach(p => { md += `- ${p}\n`; });
        md += '\n';
      }

      if (tc.pasos?.length) {
        md += `**Pasos de ejecución:**\n`;
        tc.pasos.forEach((p, i) => { md += `${i + 1}. ${p}\n`; });
        md += '\n';
      }

      if (tc.datosPrueba?.length) {
        md += `**Datos de prueba:**\n\n| Campo | Valor | Tipo |\n|---|---|---|\n`;
        tc.datosPrueba.forEach(d => { md += `| ${d.campo} | \`${d.valor}\` | ${d.tipo || '—'} |\n`; });
        md += '\n';
      }

      if (tc.resultadoEsperado) {
        md += `**Resultado esperado:**\n> ${tc.resultadoEsperado}\n\n`;
      }

      md += '---\n\n';
    });
  });
  return md;
}

export function exportarTCsMd(h) {
  const tcs = h.testCases || [];
  if (!tcs.length) { toast('Sin test cases para exportar', 'warn'); return; }
  descargar(tcsMd(h), `TC_${h.id}.md`);
  toast(`${tcs.length} test cases exportados a Markdown`);
}

export function copiarTCsClipboard(h) {
  const tcs = h.testCases || [];
  if (!tcs.length) { toast('Sin test cases para copiar', 'warn'); return; }
  navigator.clipboard.writeText(tcsMd(h))
    .then(() => toast(`${tcs.length} test cases copiados al portapapeles ✓`))
    .catch(() => toast('No se pudo copiar — intentá desde HTTPS', 'warn'));
}
