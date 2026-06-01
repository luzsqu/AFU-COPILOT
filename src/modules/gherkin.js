import { esc } from './utils.js';
import { state } from './state.js';

const KW_MAP = {
  autenticacion: ['login','autenti','password','contraseña','iniciar sesión','iniciar sesion','sign in'],
  email:         ['email','correo','e-mail'],
  pago:          ['pago','cobro','tarjeta','transacción','transaccion','factura','compra'],
  api:           ['api ','servicio externo','webhook','endpoint','rest ','integra'],
  responsive:    ['responsive','móvil','movil','tablet','celular','dispositivo'],
  permisos:      ['permiso','rol ','autoriza','acceso restri','restrict'],
  archivo:       ['archivo','fichero','upload','subir','adjunto','documento','pdf','excel','csv'],
  reporte:       ['reporte','informe','report','exportar pdf','generar pdf'],
  busqueda:      ['búsqueda','busqueda','buscar','filtro','filtrar','search'],
  notificacion:  ['notificación','notificacion','alerta','aviso','push']
};

function detectar(texto) {
  const t = texto.toLowerCase();
  return Object.entries(KW_MAP)
    .filter(([, ws]) => ws.some(w => t.includes(w)))
    .map(([k]) => k);
}

function mkSc(id, tipo, titulo, pasos) { return { id, tipo, titulo, pasos }; }
function p(kw, texto) { return { kw, texto }; }

export function generarCriterios(h) {
  const titulo = h.resumen || h.titulo || '';
  const texto  = [titulo, h.como, h.quiero, h.para, h.descripcion].join(' ');
  const kws    = detectar(texto);
  const c      = [];

  c.push(mkSc('E1','positivo','Camino feliz — caso positivo',[
    p('Escenario',`Completar "${esc(titulo)}" con datos válidos`),
    p('Dado',`que el usuario "${esc(h.como)}" está autenticado en el sistema`),
    p('Y',`que dispone de los permisos necesarios para la acción`),
    p('Cuando',esc(h.quiero)),
    p('Y',`todos los datos proporcionados son válidos y completos`),
    p('Entonces',`el sistema completa la acción exitosamente`),
    p('Y',`se muestra mensaje de confirmación al usuario`),
    p('Y',`el estado del sistema se actualiza correctamente`)
  ]));
  c.push(mkSc('E2','negativo','Datos inválidos — caso negativo',[
    p('Escenario',`Intentar "${esc(titulo)}" con datos inválidos`),
    p('Dado',`que el usuario "${esc(h.como)}" accede a la funcionalidad`),
    p('Cuando',`envía el formulario con datos inválidos o incompletos`),
    p('Entonces',`el sistema rechaza la acción`),
    p('Y',`muestra mensajes de error descriptivos en los campos correspondientes`),
    p('Y',`no modifica ningún dato persistente`),
    p('Y',`el usuario puede corregir y reintentar`)
  ]));
  c.push(mkSc('E3','boundary','Condiciones límite — boundary',[
    p('Escenario',`Validar condiciones límite en "${esc(titulo)}"`),
    p('Dado',`que el usuario accede al formulario de la funcionalidad`),
    p('Cuando',`ingresa valores en los límites mínimo y máximo permitidos`),
    p('Entonces',`el sistema acepta el valor en el límite mínimo válido`),
    p('Y',`el sistema acepta el valor en el límite máximo válido`),
    p('Y',`el sistema rechaza campos vacíos con mensaje de campo obligatorio`),
    p('Y',`el sistema rechaza cadenas que superen 255 caracteres`),
    p('Y',`el sistema rechaza caracteres especiales no permitidos`)
  ]));
  c.push(mkSc('E-NF','nf','Calidad no funcional — ISTQB',[
    p('Escenario',`Verificar requisitos no funcionales de "${esc(titulo)}"`),
    p('Dado',`que la funcionalidad está desplegada en el entorno de QA`),
    p('Cuando',`el usuario realiza la acción principal bajo carga normal`),
    p('Entonces',`el tiempo de respuesta es menor o igual a 3 segundos (p95)`),
    p('Y',`la comunicación se realiza exclusivamente por HTTPS/TLS 1.2+`),
    p('Y',`la interfaz cumple con WCAG 2.1 nivel AA de accesibilidad`),
    p('Y',`no se exponen datos sensibles en logs ni en la interfaz`)
  ]));

  if (kws.includes('autenticacion')) c.push(mkSc('E-AUTH','condicional','Bloqueo por intentos fallidos',[
    p('Escenario',`Bloquear cuenta tras múltiples intentos fallidos`),
    p('Dado',`que el usuario intenta autenticarse con credenciales incorrectas`),
    p('Cuando',`realiza 3 intentos fallidos consecutivos`),
    p('Entonces',`el sistema bloquea la cuenta temporalmente por 15 minutos`),
    p('Y',`notifica al usuario por email sobre el bloqueo`),
    p('Y',`el evento queda registrado en el log de auditoría de seguridad`)
  ]));
  if (kws.includes('email')) c.push(mkSc('E-EMAIL','condicional','Validación de formato de email',[
    p('Escenario',`Validar formato de dirección de correo electrónico`),
    p('Dado',`que el usuario ingresa una dirección de email`),
    p('Cuando',`el email no cumple el formato RFC 5321`),
    p('Entonces',`el sistema muestra el error "Dirección de email no válida"`),
    p('Y',`el campo es marcado visualmente como inválido`),
    p('Cuando',`el email cumple el formato correcto (usuario@dominio.tld)`),
    p('Entonces',`el campo se marca como válido y no bloquea el envío`)
  ]));
  if (kws.includes('pago')) c.push(mkSc('E-PAGO','condicional','Transacción rechazada',[
    p('Escenario',`Manejar rechazo de transacción de pago`),
    p('Dado',`que el usuario inicia un proceso de pago`),
    p('Cuando',`la pasarela devuelve error de fondos insuficientes o tarjeta rechazada`),
    p('Entonces',`el sistema muestra un mensaje de error claro`),
    p('Y',`no se debita ningún importe de la cuenta del usuario`),
    p('Y',`el pedido permanece en estado "pendiente de pago"`),
    p('Y',`el usuario puede reintentar con otro método de pago`)
  ]));
  if (kws.includes('api')) c.push(mkSc('E-API','condicional','Fallo de servicio externo',[
    p('Escenario',`Gestionar fallo o timeout de servicio externo`),
    p('Dado',`que el sistema depende de un servicio externo (API)`),
    p('Cuando',`el servicio devuelve un error 5xx o supera el timeout de 5s`),
    p('Entonces',`el sistema muestra un mensaje de error amigable al usuario`),
    p('Y',`activa circuit-breaker o reintentos automáticos (máx. 3)`),
    p('Y',`registra el error con correlationId en los logs`)
  ]));
  if (kws.includes('responsive')) c.push(mkSc('E-RES','condicional','Compatibilidad responsive',[
    p('Escenario',`Verificar visualización correcta en dispositivos móviles`),
    p('Dado',`que el usuario accede desde un dispositivo con viewport ≤ 768px`),
    p('Cuando',`carga la página de la funcionalidad`),
    p('Entonces',`el layout se adapta sin scroll horizontal`),
    p('Y',`los elementos táctiles tienen área mínima de 44×44px`),
    p('Y',`el texto es legible sin zoom (mínimo 16px)`)
  ]));
  if (kws.includes('permisos')) c.push(mkSc('E-PERM','condicional','Acceso denegado por permisos insuficientes',[
    p('Escenario',`Denegar acceso a usuario sin permisos necesarios`),
    p('Dado',`que el usuario intenta acceder a una función restringida`),
    p('Cuando',`no tiene el rol o permiso requerido en el sistema`),
    p('Entonces',`el sistema devuelve HTTP 403 Forbidden`),
    p('Y',`muestra "No tienes permisos para realizar esta acción"`),
    p('Y',`no se expone información sensible en el mensaje de error`)
  ]));
  if (kws.includes('archivo')) c.push(mkSc('E-ARCH','condicional','Validación de carga de archivo',[
    p('Escenario',`Validar tipo y tamaño de archivo`),
    p('Dado',`que el usuario selecciona un archivo para subir`),
    p('Cuando',`el archivo excede el tamaño máximo permitido (10 MB)`),
    p('Entonces',`el sistema rechaza con "Archivo demasiado grande (máx. 10 MB)"`),
    p('Cuando',`el archivo tiene formato no permitido (.exe, .bat…)`),
    p('Entonces',`el sistema rechaza con "Formato de archivo no permitido"`)
  ]));
  if (kws.includes('reporte')) c.push(mkSc('E-REP','condicional','Generación de reporte con volumen alto',[
    p('Escenario',`Generar reporte con conjunto de datos grande`),
    p('Dado',`que el sistema tiene más de 10.000 registros en el período`),
    p('Cuando',`el usuario solicita generar el reporte completo`),
    p('Entonces',`el sistema genera el reporte de forma asíncrona`),
    p('Y',`muestra indicador de progreso al usuario`),
    p('Y',`notifica cuando el reporte está listo para descargar`)
  ]));
  if (kws.includes('busqueda')) c.push(mkSc('E-SRCH','condicional','Búsqueda sin resultados y caracteres especiales',[
    p('Escenario',`Manejar búsqueda sin resultados`),
    p('Dado',`que el usuario realiza una búsqueda en el sistema`),
    p('Cuando',`el término no coincide con ningún registro`),
    p('Entonces',`muestra "No se encontraron resultados para tu búsqueda"`),
    p('Cuando',`el término contiene caracteres especiales o SQL injection`),
    p('Entonces',`el sistema sanitiza la entrada y no retorna datos no autorizados`)
  ]));
  if (kws.includes('notificacion')) c.push(mkSc('E-NOTIF','condicional','Fallo en envío de notificación',[
    p('Escenario',`Gestionar fallo en el envío de notificación`),
    p('Dado',`que el sistema debe enviar una notificación al usuario`),
    p('Cuando',`el servicio de notificaciones falla o está no disponible`),
    p('Entonces',`el sistema registra el fallo en la cola de reintento`),
    p('Y',`reintenta hasta 3 veces con backoff exponencial`)
  ]));

  return c;
}

// ─── GENERACIÓN DE CRITERIOS CON IA + CONTEXTO DEL PROYECTO ─────────────────

const PROMPT_CRITERIOS = (h, contexto) => `Eres un analista QA certificado ISTQB Foundation Level.
Genera criterios de aceptación en formato Gherkin para la siguiente historia de usuario.

HISTORIA DE USUARIO:
- ID: ${h.id}
- Como: ${h.como}
- Quiero: ${h.quiero}
- Para: ${h.para}
${h.descripcion ? `- Descripción: ${h.descripcion}` : ''}
${contexto}

INSTRUCCIONES:
Genera entre 4 y 7 escenarios Gherkin siguiendo ISTQB Foundation Level.
Incluye SIEMPRE: E1 (positivo/happy path), E2 (negativo/datos inválidos), E3 (boundary/límites) y E-NF (no funcional).
Agrega escenarios adicionales solo si el contexto del negocio los justifica.
Usa el contexto del proyecto para que los escenarios reflejen las reglas de negocio reales.

Responde ÚNICAMENTE con un array JSON válido, sin texto ni markdown extra:
[{
  "id": "E1",
  "tipo": "positivo",
  "titulo": "Título del escenario",
  "pasos": [
    {"kw": "Escenario", "texto": "descripción corta"},
    {"kw": "Dado", "texto": "condición previa"},
    {"kw": "Y", "texto": "otra condición (opcional)"},
    {"kw": "Cuando", "texto": "acción del usuario"},
    {"kw": "Entonces", "texto": "resultado esperado"},
    {"kw": "Y", "texto": "resultado adicional (opcional)"}
  ]
}]`;

const API_URLS_GHERKIN = {
  openai:    '/proxy/openai/v1/chat/completions',
  claude:    '/proxy/anthropic/v1/messages',
  groq:      '/proxy/groq/openai/v1/chat/completions',
  grok:      '/proxy/grok/v1/chat/completions',
};

/** Verifica si la generación con IA está disponible para criterios */
export function puedeCriteriosConIA() {
  const cfg  = state.apiCfg;
  const proj = state.proyectos.find(p => p.id === state.proyectoActivoId);
  return !!(cfg?.key && proj?.contexto?.length);
}

/** Genera criterios Gherkin usando IA + contexto del proyecto.
 *  Devuelve array con el mismo formato que generarCriterios().
 *  Lanza error si la llamada falla (el caller debe manejar el fallback). */
export async function generarCriteriosConIA(h) {
  const cfg  = state.apiCfg;
  const proj = state.proyectos.find(p => p.id === state.proyectoActivoId);
  if (!cfg?.key || !proj?.contexto?.length) throw new Error('Sin API key o sin contexto de proyecto');

  const ctxTexto = proj.contexto.map(c => `=== ${c.nombre} ===\n${c.texto}`).join('\n\n');
  const contextoBloque = `\nCONTEXTO DEL PROYECTO (úsalo para alinear los escenarios al negocio real):\n${ctxTexto}`;
  const prompt = PROMPT_CRITERIOS(h, contextoBloque);

  let rawText;

  if (cfg.provider === 'claude') {
    const res = await fetch('/proxy/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: cfg.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Error Claude ${res.status}`);
    rawText = data.content[0].text;
  } else {
    const url = API_URLS_GHERKIN[cfg.provider] || `/proxy/${cfg.provider}/v1/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Error API ${res.status}`);
    rawText = data.choices[0].message.content;
  }

  // Parsear JSON — limpiar posibles bloques markdown
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('La IA no devolvió un JSON válido');
  const parsed = JSON.parse(jsonMatch[0]);

  // Validar y normalizar estructura
  return parsed.map((sc, i) => ({
    id:     sc.id    || `E${i + 1}`,
    tipo:   sc.tipo  || 'positivo',
    titulo: sc.titulo || `Escenario ${i + 1}`,
    pasos:  Array.isArray(sc.pasos) ? sc.pasos : []
  }));
}
