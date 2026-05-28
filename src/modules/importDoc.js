/**
 * importDoc.js — Extracción de texto desde PDF / DOCX / TXT
 * y generación de Historias de Usuario ISTQB con IA.
 */
import { state } from './state.js';
import { toast } from './toast.js';
import { crearHistoriasDesdeIA, parseHistoriasIA } from './historias.js';
import { navigate } from './router.js';
import { API_URLS, getContextoProyecto } from './import.js';

// ── PROMPT ────────────────────────────────────────────────────────────────────
const SISTEMA_DOC = `Eres un analista de software ISTQB senior experto en transformar documentos de requisitos, especificaciones funcionales, PRDs, actas de reunión y documentación de negocio en historias de usuario estructuradas y trazables.`;

function buildDocPrompt(tipoDoc, notas, texto) {
  return `Analiza el siguiente documento de tipo "${tipoDoc}" y genera historias de usuario ISTQB en ESPAÑOL.

DOCUMENTO:
"""
${texto.slice(0, 12000)}
"""
${notas ? `\nINSTRUCCIONES ADICIONALES DEL ANALISTA:\n${notas}` : ''}
${getContextoProyecto()}

REGLAS:
- Genera entre 4 y 10 historias según la complejidad del documento
- Cada historia debe estar directamente trazada a un requisito o funcionalidad del documento
- "como" → rol real del usuario mencionado o inferido del documento
- "quiero" → acción funcional concreta extraída del documento
- "para" → objetivo de negocio explícito o implícito
- "descripcion" → incluye palabras clave técnicas del documento que justifiquen la historia
- Asigna prioridad según el orden de aparición e importancia en el documento
- SOLO el array JSON, sin texto adicional

Responde ÚNICAMENTE con un array JSON válido:
[{"titulo":"Título descriptivo","como":"rol","quiero":"acción","para":"objetivo","descripcion":"contexto técnico y palabras clave","prioridad":"High","tipo":"Story","etiquetas":["doc"]}]`;
}

// ── EXTRACCIÓN DE TEXTO ───────────────────────────────────────────────────────

/**
 * Extrae texto de un archivo PDF usando pdf.js.
 */
async function extractPDF(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  // Worker inline para evitar problemas de CORS con Vite
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  return pages.join('\n\n');
}

/**
 * Extrae texto de un archivo DOCX usando mammoth.js.
 */
async function extractDOCX(file) {
  const mammoth    = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result     = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Lee un archivo .txt directamente.
 */
function extractTXT(file) {
  return file.text();
}

/**
 * Dispatcher principal: detecta tipo de archivo y extrae texto.
 * @returns {Promise<string>} texto extraído
 */
export async function extraerTextoDeArchivo(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf')              return extractPDF(file);
  if (ext === 'docx')             return extractDOCX(file);
  if (['txt', 'md'].includes(ext)) return extractTXT(file);
  throw new Error(`Formato .${ext} no soportado. Usá PDF, DOCX o TXT.`);
}

// ── GENERACIÓN IA ─────────────────────────────────────────────────────────────
async function callOpenAICompat(cfg, messages) {
  const url = API_URLS[cfg.provider];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, messages, max_tokens: 4096 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Error API ${cfg.provider}`);
  return data.choices[0].message.content;
}

export async function generarHistoriasDesdeDoc(tipoDoc, notas, texto) {
  const cfg = state.apiCfg;
  if (!cfg?.key) { toast('Configura tu API key primero', 'warn'); return null; }

  const prompt = buildDocPrompt(tipoDoc, notas, texto);

  try {
    let text;
    if (cfg.provider === 'claude') {
      const res = await fetch(API_URLS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: cfg.model, max_tokens: 4096,
          system: SISTEMA_DOC,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error API Claude');
      text = data.content[0].text;
    } else {
      text = await callOpenAICompat(cfg, [
        { role: 'system', content: SISTEMA_DOC },
        { role: 'user',   content: prompt },
      ]);
    }

    const items = parseHistoriasIA(text);
    if (!items) throw new Error('La IA no devolvió un JSON válido. Intenta de nuevo.');
    return items;
  } catch (err) {
    toast('Error IA: ' + err.message, 'error');
    return null;
  }
}
