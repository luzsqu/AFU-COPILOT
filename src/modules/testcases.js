import { generarId } from './utils.js';

const TC_TIPOS_MAP = {
  positivo:    'Funcional',
  negativo:    'Funcional',
  boundary:    'Funcional',
  nf:          'No funcional',
  condicional: 'Funcional'
};

const TC_PRIORITY_MAP = {
  positivo:    'Alta',
  negativo:    'Alta',
  boundary:    'Media',
  nf:          'Media',
  condicional: 'Media'
};

// Tags de cobertura: unit_test cubre lógica interna, integration cubre flujos entre capas, end_to_end cubre el flujo completo de usuario
const TC_TAGS_MAP = {
  positivo:    ['end_to_end'],
  negativo:    ['integration'],
  boundary:    ['unit_test'],
  nf:          ['end_to_end'],
  condicional: ['integration']
};

function parsePasos(pasos) {
  const pre = [], steps = [], expected = [];
  let phase = 'pre';
  for (const p of (pasos || [])) {
    if (p.kw === 'Escenario' || p.kw === 'Scenario') continue;
    if      (p.kw === 'Dado'     || p.kw === 'Given')    { phase = 'pre';  pre.push(p.texto); }
    else if (p.kw === 'Cuando'   || p.kw === 'When')     { phase = 'step'; steps.push(p.texto); }
    else if (p.kw === 'Entonces' || p.kw === 'Then')     { phase = 'exp';  expected.push(p.texto); }
    else if (p.kw === 'Y'        || p.kw === 'And') {
      if      (phase === 'pre')  pre.push(p.texto);
      else if (phase === 'step') steps.push(p.texto);
      else                       expected.push(p.texto);
    }
  }
  return { pre, steps, expected };
}

export function generarTestCases(h) {
  const criterios = h.criterios || [];
  return criterios.map((c, i) => {
    const { pre, steps, expected } = parsePasos(c.pasos);
    const tipo = TC_TIPOS_MAP[c.tipo] || 'Funcional';
    const prio = TC_PRIORITY_MAP[c.tipo] || 'Media';
    const tags = TC_TAGS_MAP[c.tipo] || ['integration'];

    return {
      id:                `TC-${h.id}-${String(i + 1).padStart(3, '0')}`,
      titulo:            c.titulo,
      tipo,
      prioridad:         prio,
      tags,
      precondiciones:    pre,
      pasos:             steps,
      datosPrueba:       [],
      resultadoEsperado: expected.join(' | '),
      criterioVinculado: c.id,
      estado:            'No ejecutado'
    };
  });
}

export function mkTestCase(huId, n) {
  return {
    id:                `TC-${huId}-${String(n).padStart(3, '0')}`,
    titulo:            '',
    tipo:              'Funcional',
    prioridad:         'Media',
    tags:              [],
    precondiciones:    [],
    pasos:             [],
    datosPrueba:       [],
    resultadoEsperado: '',
    criterioVinculado: '',
    estado:            'No ejecutado'
  };
}

export const TC_ESTADOS    = ['No ejecutado','Pasó','Falló','Bloqueado'];
export const TC_TIPOS_LIST = ['Funcional','No funcional','UI','Seguridad','Integración'];
export const TC_PRIORIDADES = ['Alta','Media','Baja'];
export const TC_TAGS       = ['unit_test','integration','end_to_end'];
