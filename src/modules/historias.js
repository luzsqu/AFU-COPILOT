import { state } from './state.js';
import { generarId } from './utils.js';
import { guardar } from './storage.js';
import { generarCriterios } from './gherkin.js';
import { generarTestCases } from './testcases.js';

export function crearHistoriaData(campos) {
  const {
    tipo, resumen, descripcion, etiquetas, prioridad,
    storyPoints, links, como, quiero, para, proyectoId
  } = campos;

  const h = {
    id: generarId(),
    proyectoId: proyectoId || state.proyectoActivoId || '',
    tipo:        tipo       || 'Story',
    resumen:     resumen    || '',
    como:        como       || '',
    quiero:      quiero     || '',
    para:        para       || '',
    descripcion: descripcion || '',
    etiquetas:   Array.isArray(etiquetas) ? etiquetas : [],
    prioridad:   prioridad  || 'Medium',
    storyPoints: storyPoints != null ? Number(storyPoints) : null,
    links:       Array.isArray(links) ? links : [],
    criterios:   [],
    testCases:   [],
    imagenes:    [],
    creadoEn:    new Date().toISOString(),
    actualizado: new Date().toISOString(),
    origen:      'manual'
  };

  h.criterios  = generarCriterios(h);
  h.testCases  = generarTestCases(h);
  state.historias.unshift(h);
  guardar();
  return h;
}

export function actualizarHistoria(id, cambios) {
  const idx = state.historias.findIndex(h => h.id === id);
  if (idx < 0) return null;
  Object.assign(state.historias[idx], cambios, { actualizado: new Date().toISOString() });
  guardar();
  return state.historias[idx];
}

export function eliminarHistoriaById(id) {
  state.historias = state.historias.filter(h => h.id !== id);
  guardar();
}

export function duplicarHistoria(id) {
  const orig = state.historias.find(h => h.id === id);
  if (!orig) return null;
  const copia = JSON.parse(JSON.stringify(orig));
  copia.id       = generarId();
  copia.creadoEn = new Date().toISOString();
  copia.actualizado = copia.creadoEn;
  copia.resumen  = copia.resumen + ' (copia)';
  state.historias.unshift(copia);
  guardar();
  return copia;
}

export function parseHistoriasIA(text) {
  if (!text) return null;
  let jsonStr = text.trim();

  const blockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blockMatch) jsonStr = blockMatch[1].trim();
  else {
    const arrMatch = jsonStr.match(/(\[[\s\S]*\])/);
    if (arrMatch) jsonStr = arrMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (Array.isArray(parsed)) return parsed;
    // handle {"historias":[...]}, {"items":[...]}, {"stories":[...]}
    const nested = parsed.historias || parsed.items || parsed.stories || parsed.data;
    if (Array.isArray(nested)) return nested;
    return null;
  } catch { return null; }
}

export function crearHistoriasDesdeIA(items, origen, fuente) {
  const creadas = [];
  items.forEach(item => {
    const resumen = String(item.titulo || item.title || 'Historia sin título').trim();
    const como    = String(item.como   || item.as    || 'usuario').trim();
    const quiero  = String(item.quiero || item.want  || 'realizar esta acción').trim();
    const para    = String(item.para   || item.so_that || 'obtener valor').trim();
    const desc    = String(item.descripcion || item.description || '').trim();
    const prioridad = ['Highest','High','Medium','Low','Lowest'].includes(item.prioridad) ? item.prioridad : 'Medium';
    const tipo    = ['Story','Task','Bug','Epic','Sub-task'].includes(item.tipo) ? item.tipo : 'Story';

    const h = {
      id: generarId(),
      proyectoId: state.proyectoActivoId || '',
      tipo, resumen, como, quiero, para, descripcion: desc,
      etiquetas: Array.isArray(item.etiquetas) ? item.etiquetas : [], prioridad, storyPoints: null, links: [],
      criterios: [], testCases: [], imagenes: [],
      creadoEn: new Date().toISOString(), actualizado: new Date().toISOString(),
      origen, fuente: fuente || ''
    };
    h.criterios = generarCriterios(h);
    h.testCases = generarTestCases(h);
    state.historias.unshift(h);
    creadas.push(h);
  });
  guardar();
  return creadas;
}

export function cargarEjemplosData() {
  const demos = [
    {
      tipo:'Story', resumen: 'Inicio de sesión con email y contraseña',
      como: 'usuario registrado en el sistema',
      quiero: 'iniciar sesión con mi email y contraseña',
      para: 'acceder a mi panel de usuario de forma segura',
      descripcion: 'Login mediante email y password. Validar formato de email, bloqueo tras 3 intentos fallidos, redirección al dashboard. Requiere HTTPS.',
      etiquetas: ['autenticacion','seguridad'], prioridad: 'High', storyPoints: 5, links: []
    },
    {
      tipo:'Story', resumen: 'Pago con tarjeta de crédito en checkout',
      como: 'cliente con carrito de compra activo',
      quiero: 'realizar el pago con mi tarjeta de crédito mediante la pasarela de pago API',
      para: 'completar mi compra de forma rápida y segura',
      descripcion: 'Integración con API de pasarela de pago. Manejo de transacción rechazada, pago fallido, fondos insuficientes y timeout del servicio externo. Cumplimiento PCI DSS.',
      etiquetas: ['pago','integracion','api'], prioridad: 'Highest', storyPoints: 8, links: []
    },
    {
      tipo:'Story', resumen: 'Exportar reporte de ventas a PDF',
      como: 'administrador con rol de reportes',
      quiero: 'exportar el reporte mensual de ventas en formato PDF',
      para: 'compartir los resultados con la dirección ejecutiva',
      descripcion: 'Generación de reporte PDF asíncrona. Con más de 10.000 registros debe procesarse en background. Verificar permisos de acceso al módulo de reportes.',
      etiquetas: ['reporte','exportar'], prioridad: 'Medium', storyPoints: 3, links: []
    }
  ];

  demos.forEach(d => {
    const h = {
      id: generarId(),
      proyectoId: state.proyectoActivoId || '',
      tipo: d.tipo, resumen: d.resumen, como: d.como, quiero: d.quiero, para: d.para,
      descripcion: d.descripcion, etiquetas: d.etiquetas || [], prioridad: d.prioridad,
      storyPoints: d.storyPoints || null, links: d.links || [],
      criterios: [], testCases: [], imagenes: [],
      creadoEn: new Date().toISOString(), actualizado: new Date().toISOString(), origen: 'manual'
    };
    h.criterios = generarCriterios(h);
    h.testCases = generarTestCases(h);
    state.historias.unshift(h);
  });
  guardar();
}
