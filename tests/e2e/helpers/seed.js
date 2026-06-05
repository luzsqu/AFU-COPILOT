/**
 * Helpers compartidos entre todos los specs de Playwright.
 * Centraliza el seed de localStorage para mantener consistencia.
 */

export const SK = 'analista-hu-v2';

// Credenciales de prueba: usuario "tester" / contraseña "test"
export const TEST_USER = { username: 'tester', passwordHash: 'dGVzdA==' };
export const TEST_CREDS = { username: 'tester', password: 'test' };

export const NOW = new Date('2026-01-15T10:00:00Z').toISOString();

// ── Entidades base ────────────────────────────────────────────────────────────

export function makeProyecto(overrides = {}) {
  return {
    id: 'proj-test-001',
    nombre: 'Proyecto Test',
    descripcion: 'Proyecto para pruebas automatizadas',
    jiraKey: 'PT',
    jiraUrl: '',
    creado: NOW,
    templateId: null,
    contexto: [],
    ...overrides,
  };
}

export function makeHistoria(n = 1, overrides = {}) {
  return {
    id: `HU-TEST-${String(n).padStart(3, '0')}`,
    proyectoId: 'proj-test-001',
    tipo: 'Story',
    resumen: `Historia de prueba ${n}`,
    como: 'usuario autenticado',
    quiero: `realizar la acción número ${n}`,
    para: 'verificar el sistema correctamente',
    descripcion: `Descripción de la historia ${n}`,
    etiquetas: ['test'],
    prioridad: 'High',
    storyPoints: null,
    links: [],
    criterios: [
      {
        id: 'E1', tipo: 'positivo', titulo: 'Camino feliz',
        pasos: [
          { kw: 'Escenario', texto: `Completar historia ${n} con datos válidos` },
          { kw: 'Dado', texto: 'que el usuario está autenticado' },
          { kw: 'Cuando', texto: `realiza la acción número ${n}` },
          { kw: 'Entonces', texto: 'el sistema responde exitosamente' },
        ],
      },
      {
        id: 'E2', tipo: 'negativo', titulo: 'Datos inválidos',
        pasos: [
          { kw: 'Escenario', texto: `Intentar historia ${n} con datos inválidos` },
          { kw: 'Dado', texto: 'que el usuario accede a la funcionalidad' },
          { kw: 'Cuando', texto: 'envía datos inválidos' },
          { kw: 'Entonces', texto: 'el sistema muestra error' },
        ],
      },
    ],
    testCases: [
      {
        id: `TC-HU-TEST-${String(n).padStart(3, '0')}-001`,
        titulo: 'Flujo principal — smoke',
        tipo: 'Funcional',
        prioridad: 'Alta',
        estado: 'No ejecutado',
        tags: ['smoke'],
        criterioVinculado: 'E1',
        precondiciones: ['El usuario está autenticado'],
        pasos: ['Acceder a la funcionalidad', 'Completar el formulario con datos válidos', 'Confirmar la acción'],
        datosPrueba: [{ campo: 'campo1', valor: 'valor_valido', tipo: 'válido' }],
        resultadoEsperado: 'El sistema procesa la acción y muestra confirmación',
      },
      {
        id: `TC-HU-TEST-${String(n).padStart(3, '0')}-002`,
        titulo: 'Datos inválidos — negativo',
        tipo: 'Funcional',
        prioridad: 'Media',
        estado: 'No ejecutado',
        tags: ['regression'],
        criterioVinculado: 'E2',
        precondiciones: ['El usuario accede a la funcionalidad'],
        pasos: ['Ingresar datos inválidos', 'Intentar confirmar'],
        datosPrueba: [{ campo: 'campo1', valor: '', tipo: 'inválido' }],
        resultadoEsperado: 'El sistema muestra mensaje de error descriptivo',
      },
    ],
    imagenes: [],
    creadoEn: NOW,
    actualizado: NOW,
    origen: 'manual',
    fuente: null,
    ...overrides,
  };
}

/**
 * Genera el objeto completo de estado para inyectar en localStorage.
 * @param {object} opts
 * @param {number} opts.historias  - cuántas historias generar (default 3)
 * @param {object} opts.extraProj - campos extra para el proyecto
 * @param {object[]} opts.customHistorias - historias personalizadas (reemplaza las generadas)
 */
export function makeSeedData({ historias = 3, extraProj = {}, customHistorias } = {}) {
  const proyecto = makeProyecto(extraProj);
  const hus = customHistorias
    ?? Array.from({ length: historias }, (_, i) => makeHistoria(i + 1));

  return {
    usuario: TEST_USER,
    proyectos: [proyecto],
    historias: hus,
    epicas: [],
    proyectoActivoId: proyecto.id,
    prefs: { vista: 'cards', darkMode: false },
    apiCfg: null,
    jiraCfg: null,
    tabActual: 'resumen',
    modoSeleccion: false,
    seleccionadas: [],
    idActual: null,
  };
}

/**
 * Inyecta el seed en localStorage antes de cargar la página.
 * Usar en page.addInitScript.
 */
export function injectSeed(data) {
  return ({ key, data: d }) => {
    localStorage.setItem(key, JSON.stringify(d));
  };
}
