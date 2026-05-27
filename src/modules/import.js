import { state } from './state.js';
import { toast } from './toast.js';
import { crearHistoriasDesdeIA, crearHistoriaData, parseHistoriasIA } from './historias.js';
import { navigate } from './router.js';

export const PROMPT_BASE = `Actúa como analista de software experto en ISTQB y metodologías ágiles.
Analiza el contenido y genera historias de usuario completas en ESPAÑOL.

Responde ÚNICAMENTE con un array JSON válido (sin texto adicional, sin bloques markdown):
[{"titulo":"Título descriptivo","como":"rol del usuario","quiero":"acción que desea realizar","para":"objetivo de negocio","descripcion":"palabras clave técnicas: login, email, pago, API, archivo, reporte, búsqueda, notificación, permisos, responsive","prioridad":"Medium","tipo":"Story"}]

Reglas:
- Genera entre 3 y 8 historias según la complejidad
- "prioridad": Highest, High, Medium, Low o Lowest
- "tipo": Story, Task, Bug, Epic o Sub-task
- SOLO el array JSON, sin texto adicional`;

const _DEV = import.meta.env.DEV;

export const API_URLS = {
  anthropic: _DEV ? '/proxy/anthropic/v1/messages'              : 'https://api.anthropic.com/v1/messages',
  groq:      _DEV ? '/proxy/groq/openai/v1/chat/completions'    : 'https://api.groq.com/openai/v1/chat/completions',
  openai:    _DEV ? '/proxy/openai/v1/chat/completions'         : 'https://api.openai.com/v1/chat/completions',
  grok:      _DEV ? '/proxy/xai/v1/chat/completions'            : 'https://api.x.ai/v1/chat/completions'
};

function getContextoProyecto() {
  const proj = state.proyectos.find(p => p.id === state.proyectoActivoId);
  if (!proj?.contexto?.length) return '';
  const textos = proj.contexto.map(c => `=== ${c.nombre} ===\n${c.texto}`).join('\n\n');
  return `\n\nCONTEXTO DEL PROYECTO (úsalo para alinear las historias al negocio del cliente):\n${textos}`;
}

async function callOpenAICompat(cfg, messages, maxTokens = 4096) {
  const url = API_URLS[cfg.provider];
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, messages, max_tokens: maxTokens })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Error API ${cfg.provider}`);
  return data.choices[0].message.content;
}

export async function generarConIA(base64, mimeType, notas) {
  const cfg = state.apiCfg;
  if (!cfg || !cfg.key) { toast('Configura tu API key primero', 'warn'); return; }

  toast('Generando historias con IA…', 'info');

  const providerLabel = { claude: 'Claude', openai: 'OpenAI', grok: 'Grok (xAI)', groq: 'Groq' }[cfg.provider] || cfg.provider;

  try {
    let text;

    const ctx = getContextoProyecto();
    if (cfg.provider === 'claude') {
      const userContent = [{ type: 'text', text: PROMPT_BASE + ctx + (notas ? '\n\nNotas del usuario: ' + notas : '') }];
      if (base64) userContent.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } });
      const response = await fetch(API_URLS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model: cfg.model, max_tokens: 4096, messages: [{ role: 'user', content: userContent }] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error API Claude');
      text = data.content[0].text;
    } else {
      const promptText = PROMPT_BASE + ctx + (notas ? '\n\nNotas del usuario: ' + notas : '');
      const messages = [{ role: 'user', content: promptText }];
      text = await callOpenAICompat(cfg, messages);
    }

    const items = parseHistoriasIA(text);
    if (!items) throw new Error('Respuesta no válida de la IA');
    const creadas = crearHistoriasDesdeIA(items, 'ia', 'texto');
    toast(`${creadas.length} historias generadas con ${providerLabel}`);
    navigate('/historias');
  } catch (err) {
    toast('Error IA: ' + err.message, 'error');
  }
}

// ── FLUJOS UML ────────────────────────────────────────────────────────────────
const SISTEMA_FLUJOS = `Eres un arquitecto de software experto en modelado UML, diagramas BPMN y notación Mermaid.js. Tu especialidad es transformar descripciones textuales de sistemas en diagramas precisos, claros y técnicamente correctos.`;

const INSTRUCCIONES_TIPO = {
  Secuencia:  'Usa sequenceDiagram. Muestra interacciones cronológicas entre actores y sistemas con ->, ->>, -->.',
  Flujo:      'Usa flowchart TD. Nodos rectangulares para acciones, rombos {Decisión} para bifurcaciones.',
  CasoDeUso:  'Usa flowchart LR. Actores como A([👤 Nombre]) a la izquierda, casos de uso como B((Acción)) en centro, relaciones con -->.',
  Clases:     'Usa classDiagram. Atributos (+publico, -privado), métodos() y relaciones (<|-- herencia, o-- composición).',
  ER:         'Usa erDiagram. Entidades, atributos y cardinalidades (||--o{, }|--|{).',
  BPMN:       'Usa flowchart LR con subgraph para cada carril/rol. Muestra el flujo entre participantes.'
};

export async function generarFlujosConIA(tipo, titulo, documentacion) {
  const cfg = state.apiCfg;
  if (!cfg?.key) return null;

  const prompt = `Analiza la documentación y genera un diagrama ${tipo} en formato Mermaid.js.

DOCUMENTACIÓN:
${documentacion}
${titulo ? `\nTÍTULO: "${titulo}"` : ''}

TIPO: ${tipo}
${INSTRUCCIONES_TIPO[tipo] || INSTRUCCIONES_TIPO.Flujo}

REGLAS CRÍTICAS:
- Responde ÚNICAMENTE con código Mermaid válido
- NO uses triple backticks ni la palabra "mermaid" al inicio
- Máximo 18 nodos, textos concisos (máx 5 palabras por nodo)
- Código 100% compatible con Mermaid.js v10
- Empieza directamente con el tipo de diagrama (sequenceDiagram, flowchart, classDiagram, erDiagram…)`;

  try {
    let text;
    if (cfg.provider === 'claude') {
      const res = await fetch(API_URLS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: cfg.model, max_tokens: 2048,
          system: SISTEMA_FLUJOS,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error API Claude');
      text = data.content[0].text;
    } else {
      text = await callOpenAICompat(cfg, [
        { role: 'system', content: SISTEMA_FLUJOS },
        { role: 'user',   content: prompt }
      ], 2048);
    }

    // Strip code block markers if the model wrapped anyway
    let code = text.trim();
    const blockMatch = code.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
    if (blockMatch) code = blockMatch[1].trim();
    return code;
  } catch (err) {
    toast('Error IA: ' + err.message, 'error');
    return null;
  }
}

// ── HISTORIAS TÉCNICAS DESDE API / MICROSERVICIO ──────────────────────────────
const SISTEMA_API = `Eres un analista técnico ISTQB senior especializado en integración de sistemas, APIs REST, microservicios y contratos de interfaz. Tu especialidad es transformar documentación técnica en historias de usuario técnicas estructuradas, concretas y trazables a endpoints o contratos reales.`;

const buildAPIPrompt = (tipoFuente, tipoConsumidor, documentacion, contextoTecnico) => {
  const fuenteLabel = { swagger: 'Swagger/OpenAPI', rest: 'Documentación REST', contrato: 'Contrato de Microservicio' }[tipoFuente] || tipoFuente;
  return `Analiza la siguiente documentación de tipo "${fuenteLabel}" y genera historias de usuario técnicas en ESPAÑOL.

TIPO DE CONSUMIDOR: ${tipoConsumidor}
${contextoTecnico ? `\nCONTEXTO ADICIONAL: ${contextoTecnico}` : ''}

DOCUMENTACIÓN:
${documentacion}

INSTRUCCIONES:
- "como" → consumidor técnico específico (ej: "aplicación frontend Vue.js", "servicio de pagos", "cliente móvil iOS")
- "quiero" → operación/endpoint/capacidad concreta (ej: "consumir el endpoint POST /auth/login para obtener un JWT")
- "para" → valor de integración (ej: "autenticar usuarios sin gestionar credenciales directamente")
- "descripcion" → método HTTP, path/contrato, parámetros clave, respuesta esperada, errores posibles
- "etiquetas" → contexto técnico relevante: "api", "microservicio", "rest", nombre del módulo o dominio
- Genera entre 4 y 10 historias según cantidad de endpoints/operaciones
- SOLO el array JSON, sin texto adicional

Responde ÚNICAMENTE con un array JSON válido (sin texto adicional, sin bloques markdown):
[{"titulo":"Título técnico descriptivo","como":"consumidor técnico","quiero":"operación técnica concreta","para":"valor de integración","descripcion":"Endpoint: [ruta]. Params: [lista]. Respuesta: [estructura]. Errores: [lista].","prioridad":"Medium","tipo":"Story","etiquetas":["api","modulo"]}]`;
};

export async function generarHistoriasTecnicasConIA(tipoFuente, tipoConsumidor, documentacion, contextoTecnico) {
  const cfg = state.apiCfg;
  if (!cfg?.key) return null;

  const prompt = buildAPIPrompt(tipoFuente, tipoConsumidor, documentacion, contextoTecnico) + getContextoProyecto();

  try {
    let text;
    if (cfg.provider === 'claude') {
      const res = await fetch(API_URLS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: cfg.model, max_tokens: 4096,
          system: SISTEMA_API,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Error API Claude');
      text = data.content[0].text;
    } else {
      text = await callOpenAICompat(cfg, [
        { role: 'system', content: SISTEMA_API },
        { role: 'user',   content: prompt }
      ], 4096);
    }

    const items = parseHistoriasIA(text);
    if (!items) {
      console.error('[AFU] parseHistoriasIA falló. Respuesta cruda:', text);
      throw new Error('La IA no devolvió JSON válido. Revisa la consola del navegador.');
    }
    return items;
  } catch (err) {
    toast('Error IA: ' + err.message, 'error');
    return null;
  }
}

const SYSTEM_VISION = `Eres un analista de software ISTQB senior especializado en análisis visual de mockups y wireframes. Tu habilidad principal es extraer información funcional precisa de capturas de pantalla y convertirla en historias de usuario estructuradas, concretas y trazables a elementos reales de la UI.`;

const buildVisionPrompt = (tipoMockup, notas) =>
`Analiza VISUALMENTE la imagen adjunta de un mockup de pantalla tipo "${tipoMockup}".

PASO 1 — LECTURA: Identifica cada elemento interactivo o funcional que VES:
• Botones (y su etiqueta exacta)
• Campos de formulario y sus labels
• Secciones, paneles o tabs con títulos visibles
• Tablas o listas con sus columnas
• Filtros, buscadores o selectores
• Mensajes de estado, alertas o indicadores
• Navegación, breadcrumbs, menús

PASO 2 — GENERACIÓN: Por cada elemento o grupo funcional del PASO 1, crea UNA historia de usuario. Los títulos y descripciones DEBEN mencionar elementos específicos que VES en la imagen, NO generalidades.

Responde ÚNICAMENTE con un array JSON válido (sin texto adicional, sin bloques markdown):
[
  {
    "titulo": "Nombre concreto de la función que muestra la UI",
    "como": "rol específico del usuario que opera esta pantalla",
    "quiero": "acción concreta que permite este elemento de la UI",
    "para": "beneficio de negocio específico",
    "descripcion": "Elementos visuales observados: [nombra botones, campos o secciones concretas que justifican esta historia]",
    "prioridad": "High",
    "tipo": "Story"
  }
]

Valores permitidos — prioridad: Highest, High, Medium, Low, Lowest | tipo: Story, Task, Bug, Epic, Sub-task
Genera entre 4 y 8 historias. SOLO el array JSON.${notas ? `\n\nContexto del analista: ${notas}` : ''}`;

export async function generarHistoriasDesdeImagenConIA(base64, mimeType, tipoMockup, notas) {
  const cfg = state.apiCfg;
  if (!cfg || !cfg.key) return null;

  const prompt = buildVisionPrompt(tipoMockup, notas) + getContextoProyecto();

  try {
    let text;
    if (cfg.provider === 'claude') {
      const response = await fetch(API_URLS.anthropic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: 4096,
          system: SYSTEM_VISION,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error API Claude');
      text = data.content[0].text;
    } else {
      // OpenAI y Grok comparten el formato multimodal
      const messages = [
        { role: 'system', content: SYSTEM_VISION },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: prompt }
        ]}
      ];
      text = await callOpenAICompat(cfg, messages);
    }

    const items = parseHistoriasIA(text);
    if (!items) {
      console.error('[AFU] parseHistoriasIA falló. Respuesta cruda del modelo:', text);
      throw new Error('La IA no devolvió JSON válido. Revisa la consola del navegador para ver la respuesta.');
    }
    return items;
  } catch (err) {
    toast('Error IA: ' + err.message, 'error');
    return null;
  }
}
