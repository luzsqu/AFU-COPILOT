/**
 * testcases.js
 * Genera test cases INDEPENDIENTES de los criterios de aceptación Gherkin.
 *
 * Criterios (gherkin.js)  → especificación comportamental: QUÉ debe pasar
 * Test cases (aquí)       → verificación ejecutable: CÓMO comprobarlo,
 *                           con datos concretos, pasos numerados y cobertura real
 */

export const TC_ESTADOS     = ['No ejecutado', 'Pasó', 'Falló', 'Bloqueado'];
export const TC_TIPOS_LIST  = ['Funcional', 'No funcional', 'UI', 'Seguridad', 'Integración', 'Regresión'];
export const TC_PRIORIDADES = ['Alta', 'Media', 'Baja'];
export const TC_TAGS        = ['smoke', 'regression', 'integration', 'end_to_end', 'security', 'performance', 'ui', 'api'];

// ── helpers ───────────────────────────────────────────────────────────────────

function tc(huId, n, fields) {
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
    estado:            'No ejecutado',
    ...fields
  };
}

function dp(campo, valor, tipo = 'válido') {
  return { campo, valor, tipo };
}

const KW_MAP = {
  autenticacion: ['login', 'autenti', 'password', 'contraseña', 'iniciar sesión', 'iniciar sesion', 'sign in'],
  email:         ['email', 'correo', 'e-mail'],
  pago:          ['pago', 'cobro', 'tarjeta', 'transacción', 'transaccion', 'factura', 'compra'],
  api:           ['api ', 'servicio externo', 'webhook', 'endpoint', 'rest ', 'integra'],
  responsive:    ['responsive', 'móvil', 'movil', 'tablet', 'celular', 'dispositivo'],
  permisos:      ['permiso', 'rol ', 'autoriza', 'acceso restri', 'restrict'],
  archivo:       ['archivo', 'fichero', 'upload', 'subir', 'adjunto', 'documento', 'pdf', 'excel', 'csv'],
  reporte:       ['reporte', 'informe', 'report', 'exportar pdf', 'generar pdf'],
  busqueda:      ['búsqueda', 'busqueda', 'buscar', 'filtro', 'filtrar', 'search'],
  notificacion:  ['notificación', 'notificacion', 'alerta', 'aviso', 'push'],
  crud:          ['crear', 'crear ', 'editar', 'eliminar', 'actualizar', 'registrar', 'agregar', 'añadir', 'guardar'],
  listado:       ['listado', 'lista ', 'tabla', 'grilla', 'grid', 'paginacion', 'paginación'],
  formulario:    ['formulario', 'form ', 'campo', 'ingres', 'completar', 'llenar']
};

function detectar(texto) {
  const t = texto.toLowerCase();
  return new Set(
    Object.entries(KW_MAP)
      .filter(([, ws]) => ws.some(w => t.includes(w)))
      .map(([k]) => k)
  );
}

// ── generador principal ───────────────────────────────────────────────────────

export function generarTestCases(h) {
  const accion  = h.quiero  || 'realizar la acción';
  const rol     = h.como    || 'usuario';
  const titulo  = h.resumen || h.titulo || 'funcionalidad';
  const desc    = [titulo, h.como, h.quiero, h.para, h.descripcion].join(' ');
  const kws     = detectar(desc);

  const tcs = [];
  let   n   = 1;

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 1 — SMOKE / CAMINO FELIZ (vinculado a E1)
  // ─────────────────────────────────────────────────────────────────────────
  tcs.push(tc(h.id, n++, {
    titulo:            `[Smoke] ${titulo} — flujo principal exitoso`,
    tipo:              'Funcional',
    prioridad:         'Alta',
    tags:              ['smoke', 'end_to_end'],
    criterioVinculado: 'E1',
    precondiciones: [
      `El ${rol} tiene cuenta activa y permisos necesarios`,
      'El entorno de pruebas está disponible y con datos de prueba cargados',
      'El usuario está autenticado en el sistema'
    ],
    pasos: [
      `Navegar a la sección correspondiente a "${titulo}"`,
      `Ingresar los datos requeridos con valores válidos y completos`,
      `Ejecutar la acción principal: ${accion}`,
      'Verificar que el sistema procesa la solicitud',
      'Verificar el mensaje de confirmación o redirección esperada'
    ],
    datosPrueba: [
      dp('Rol', rol, 'válido'),
      dp('Datos de entrada', 'Completos y válidos', 'válido'),
      dp('Estado previo', 'Sistema con datos de prueba estándar', 'válido')
    ],
    resultadoEsperado: `El sistema completa la acción "${accion}" correctamente. Se muestra confirmación al usuario. El estado del sistema queda actualizado de forma persistente. Tiempo de respuesta < 3s.`
  }));

  tcs.push(tc(h.id, n++, {
    titulo:            `[Funcional] ${titulo} — campos mínimos obligatorios`,
    tipo:              'Funcional',
    prioridad:         'Alta',
    tags:              ['regression'],
    criterioVinculado: 'E1',
    precondiciones: [
      `El ${rol} está autenticado`,
      'Solo se completarán los campos marcados como obligatorios (*)'
    ],
    pasos: [
      'Acceder al formulario / pantalla de la funcionalidad',
      'Dejar en blanco todos los campos opcionales',
      'Completar únicamente los campos obligatorios con valores válidos mínimos',
      `Ejecutar: ${accion}`,
      'Verificar que el sistema acepta la operación con campos mínimos'
    ],
    datosPrueba: [
      dp('Campos opcionales', '(vacíos / no completados)', 'omitido'),
      dp('Campos obligatorios', 'Valores mínimos válidos', 'válido')
    ],
    resultadoEsperado: 'El sistema permite completar la operación solo con los campos obligatorios. No se muestra error de validación para campos opcionales vacíos.'
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 2 — NEGATIVOS / VALIDACIÓN (vinculado a E2)
  // ─────────────────────────────────────────────────────────────────────────
  tcs.push(tc(h.id, n++, {
    titulo:            `[Negativo] ${titulo} — campos obligatorios vacíos`,
    tipo:              'Funcional',
    prioridad:         'Alta',
    tags:              ['regression'],
    criterioVinculado: 'E2',
    precondiciones: [`El ${rol} accede al formulario de la funcionalidad`],
    pasos: [
      'Abrir la pantalla/formulario de la funcionalidad',
      'NO completar ningún campo',
      `Intentar ejecutar: ${accion} (clic en botón principal / envío)`,
      'Verificar mensajes de error en cada campo obligatorio',
      'Verificar que no se guardó ningún dato en el sistema'
    ],
    datosPrueba: [
      dp('Todos los campos', '(vacíos)', 'inválido')
    ],
    resultadoEsperado: 'El sistema bloquea el envío. Muestra mensaje de error específico para cada campo obligatorio vacío. No se persiste ningún dato. El usuario puede corregir sin perder los datos ya ingresados.'
  }));

  tcs.push(tc(h.id, n++, {
    titulo:            `[Negativo] ${titulo} — datos con formato incorrecto`,
    tipo:              'Funcional',
    prioridad:         'Alta',
    tags:              ['regression'],
    criterioVinculado: 'E2',
    precondiciones: [`El ${rol} accede al formulario de la funcionalidad`],
    pasos: [
      'Completar los campos con datos que NO cumplen el formato esperado',
      `Intentar ejecutar: ${accion}`,
      'Verificar mensajes de error de formato en los campos inválidos',
      'Corregir los datos con formato válido',
      `Volver a ejecutar: ${accion}`,
      'Verificar que el sistema acepta los datos corregidos'
    ],
    datosPrueba: [
      dp('Campo numérico', 'abc!@#', 'inválido — texto en campo numérico'),
      dp('Campo texto', '   ', 'inválido — solo espacios'),
      dp('Campo fecha', '99/99/9999', 'inválido — fecha inexistente'),
      dp('Campo texto corregido', 'Valor válido estándar', 'válido')
    ],
    resultadoEsperado: 'El sistema muestra error descriptivo por campo. Al corregir y reenviar, el sistema acepta los datos válidos y completa la operación correctamente.'
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 3 — BOUNDARY (vinculado a E3)
  // ─────────────────────────────────────────────────────────────────────────
  tcs.push(tc(h.id, n++, {
    titulo:            `[Boundary] ${titulo} — valor mínimo permitido`,
    tipo:              'Funcional',
    prioridad:         'Media',
    tags:              ['regression'],
    criterioVinculado: 'E3',
    precondiciones: [`El ${rol} tiene acceso a la funcionalidad`],
    pasos: [
      'Acceder al formulario/pantalla de la funcionalidad',
      'Ingresar el valor mínimo permitido en los campos numéricos/texto',
      `Ejecutar: ${accion}`,
      'Verificar que el sistema acepta el valor mínimo',
      'Intentar ingresar un valor por debajo del mínimo (mínimo − 1)',
      'Verificar que el sistema rechaza el valor fuera de límite'
    ],
    datosPrueba: [
      dp('Valor en límite mínimo', '1 (o el mínimo definido)', 'válido — boundary'),
      dp('Valor bajo el mínimo', '0 (o mínimo − 1)', 'inválido — fuera de rango')
    ],
    resultadoEsperado: 'El valor en el límite mínimo es aceptado. El valor fuera del mínimo es rechazado con mensaje claro: "El valor mínimo permitido es X".'
  }));

  tcs.push(tc(h.id, n++, {
    titulo:            `[Boundary] ${titulo} — valor máximo y desbordamiento`,
    tipo:              'Funcional',
    prioridad:         'Media',
    tags:              ['regression'],
    criterioVinculado: 'E3',
    precondiciones: [`El ${rol} tiene acceso a la funcionalidad`],
    pasos: [
      'Ingresar el valor exactamente en el límite máximo permitido',
      `Ejecutar: ${accion} — verificar que el sistema acepta el valor máximo`,
      'Ingresar un valor que supere el máximo (máximo + 1 o 255+ caracteres)',
      'Verificar el rechazo con mensaje de error',
      'Intentar pegar texto con caracteres especiales (< > " \' -- ;)',
      'Verificar que el sistema sanitiza la entrada'
    ],
    datosPrueba: [
      dp('Valor en límite máximo', '255 chars / MAX definido', 'válido — boundary'),
      dp('Valor sobre el máximo', '256 chars / MAX+1', 'inválido — overflow'),
      dp('Caracteres especiales', `< > " ' -- ; DROP TABLE`, 'inválido — sanitización')
    ],
    resultadoEsperado: 'El valor máximo es aceptado. Valores sobre el máximo son rechazados. Caracteres especiales son sanitizados sin error en servidor. No hay SQL injection ni XSS.'
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 4 — NO FUNCIONALES (vinculado a E-NF)
  // ─────────────────────────────────────────────────────────────────────────
  tcs.push(tc(h.id, n++, {
    titulo:            `[Performance] ${titulo} — tiempo de respuesta bajo carga`,
    tipo:              'No funcional',
    prioridad:         'Media',
    tags:              ['performance'],
    criterioVinculado: 'E-NF',
    precondiciones: [
      'Herramienta de medición de tiempos activa (DevTools / k6 / JMeter)',
      'Entorno de QA con datos representativos (≥ 1.000 registros)',
      '1 usuario concurrente para prueba individual'
    ],
    pasos: [
      'Abrir DevTools → pestaña Network → registrar tiempos',
      `Ejecutar la acción principal: ${accion}`,
      'Registrar el tiempo de respuesta total (TTFB + carga)',
      'Repetir 5 veces y calcular el promedio y percentil p95',
      'Simular carga de 10 usuarios concurrentes y medir degradación'
    ],
    datosPrueba: [
      dp('Umbral individual', '< 3 segundos (p95)', 'criterio de aceptación'),
      dp('Umbral bajo carga (10u)', '< 5 segundos (p95)', 'criterio de aceptación'),
      dp('Usuarios concurrentes', '10', 'parámetro de carga')
    ],
    resultadoEsperado: 'Tiempo de respuesta p95 < 3s para un usuario. Bajo 10 usuarios concurrentes el tiempo p95 < 5s. No hay timeouts ni errores 5xx durante la prueba de carga.'
  }));

  tcs.push(tc(h.id, n++, {
    titulo:            `[Seguridad] ${titulo} — control de acceso y sesión`,
    tipo:              'Seguridad',
    prioridad:         'Alta',
    tags:              ['security', 'regression'],
    criterioVinculado: 'E-NF',
    precondiciones: [
      'Dos usuarios de prueba: uno con permisos (ROL_A) y uno sin permisos (ROL_B)',
      'Acceso a las herramientas de red del navegador'
    ],
    pasos: [
      'Iniciar sesión con usuario SIN permisos (ROL_B)',
      `Intentar acceder directamente a la URL de "${titulo}"`,
      'Verificar que el sistema devuelve HTTP 403 o redirige al login',
      'Iniciar sesión con usuario CON permisos (ROL_A)',
      'Copiar la URL / token de la sesión activa',
      'Cerrar sesión (logout)',
      'Intentar reutilizar la URL / token de la sesión cerrada',
      'Verificar que el token ya no es válido'
    ],
    datosPrueba: [
      dp('Usuario sin permisos', 'ROL_B / sin acceso', 'control de acceso'),
      dp('Usuario con permisos', 'ROL_A / con acceso', 'control de acceso'),
      dp('Token de sesión expirado', 'Token copiado post-logout', 'invalidación')
    ],
    resultadoEsperado: 'Usuario sin permisos recibe 403/redirect. Token post-logout es inválido (401). No se accede a datos sin autenticación válida. No hay exposición de datos sensibles en responses.'
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 5 — CONDICIONALES según keywords detectados en la historia
  // ─────────────────────────────────────────────────────────────────────────

  if (kws.has('autenticacion')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Seguridad] Login — bloqueo por intentos fallidos`,
      tipo:              'Seguridad',
      prioridad:         'Alta',
      tags:              ['security', 'regression'],
      criterioVinculado: 'E-AUTH',
      precondiciones: ['Usuario con cuenta activa en el sistema'],
      pasos: [
        'Navegar a la pantalla de login',
        'Ingresar usuario correcto + contraseña INCORRECTA → clic en "Ingresar"',
        'Registrar el mensaje de error mostrado',
        'Repetir el paso anterior 2 veces más (total: 3 intentos fallidos)',
        'Verificar si el sistema bloquea la cuenta o muestra CAPTCHA',
        'Esperar el tiempo de desbloqueo (si aplica) e intentar con contraseña correcta'
      ],
      datosPrueba: [
        dp('Usuario', 'usuario_valido@test.com', 'válido'),
        dp('Contraseña intento 1', 'wrong_pass_1', 'inválido'),
        dp('Contraseña intento 2', 'wrong_pass_2', 'inválido'),
        dp('Contraseña intento 3', 'wrong_pass_3', 'inválido'),
        dp('Contraseña correcta', 'Pass@Correcto2024', 'válido')
      ],
      resultadoEsperado: 'Tras 3 intentos fallidos: cuenta bloqueada temporalmente o CAPTCHA activado. Mensaje claro al usuario. El intento con contraseña correcta tras desbloqueo es exitoso. Evento registrado en logs de auditoría.'
    }));
  }

  if (kws.has('email')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Funcional] Validación de formato de correo electrónico`,
      tipo:              'Funcional',
      prioridad:         'Media',
      tags:              ['regression', 'ui'],
      criterioVinculado: 'E-EMAIL',
      precondiciones: ['Campo de email visible en el formulario'],
      pasos: [
        'Ingresar email sin arroba: "usuariosindominio"',
        'Intentar continuar / perder el foco del campo',
        'Verificar mensaje de error de formato',
        'Ingresar email sin dominio: "usuario@"',
        'Verificar mensaje de error de formato',
        'Ingresar email válido: "usuario@dominio.com"',
        'Verificar que el campo se marca como válido'
      ],
      datosPrueba: [
        dp('Email inválido 1', 'usuariosindominio', 'inválido — sin @'),
        dp('Email inválido 2', 'usuario@', 'inválido — sin dominio'),
        dp('Email inválido 3', '@dominio.com', 'inválido — sin usuario'),
        dp('Email inválido 4', 'usuario@dominio', 'inválido — sin TLD'),
        dp('Email válido', 'usuario@dominio.com', 'válido — formato RFC 5321')
      ],
      resultadoEsperado: 'Emails con formato inválido muestran error descriptivo inline. Email con formato RFC 5321 válido es aceptado sin error. No se permite envío del formulario con email inválido.'
    }));
  }

  if (kws.has('pago')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Funcional] Pago — transacción rechazada por fondos insuficientes`,
      tipo:              'Funcional',
      prioridad:         'Alta',
      tags:              ['regression', 'integration'],
      criterioVinculado: 'E-PAGO',
      precondiciones: [
        'Entorno conectado a pasarela de pago en modo sandbox',
        'Tarjeta de prueba configurada para rechazo: 4000000000000002'
      ],
      pasos: [
        'Iniciar el proceso de pago con el monto correspondiente',
        'Ingresar los datos de la tarjeta de prueba de rechazo',
        'Confirmar el pago',
        'Verificar el mensaje de error mostrado al usuario',
        'Verificar que el pedido permanece sin cobrar',
        'Ingresar una tarjeta de prueba válida y confirmar pago',
        'Verificar que el pago exitoso actualiza el estado del pedido'
      ],
      datosPrueba: [
        dp('Tarjeta de rechazo (fondos)', '4000000000000002', 'inválido — sandbox'),
        dp('Tarjeta de rechazo (expirada)', '4000000000000069', 'inválido — sandbox'),
        dp('Tarjeta válida', '4242424242424242', 'válido — sandbox'),
        dp('CVV', '123', 'válido'),
        dp('Vencimiento', '12/27', 'válido')
      ],
      resultadoEsperado: 'Tarjeta rechazada: mensaje claro sin datos técnicos. No se débita ningún importe. Pedido en estado "pendiente de pago". Con tarjeta válida: pago aprobado, pedido actualizado, comprobante generado.'
    }));
  }

  if (kws.has('archivo')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Funcional] Carga de archivo — validación de tipo y tamaño`,
      tipo:              'Funcional',
      prioridad:         'Media',
      tags:              ['regression', 'ui'],
      criterioVinculado: 'E-ARCH',
      precondiciones: ['Formulario con componente de carga de archivos disponible'],
      pasos: [
        'Intentar subir un archivo .exe (tipo no permitido)',
        'Verificar mensaje de error de tipo de archivo',
        'Intentar subir un archivo que supere el límite de tamaño (ej. > 10 MB)',
        'Verificar mensaje de error de tamaño',
        'Subir un archivo con tipo permitido (PDF/DOCX/XLSX) y tamaño válido (< 1 MB)',
        'Verificar que el archivo se sube correctamente y aparece en la lista'
      ],
      datosPrueba: [
        dp('Archivo inválido (tipo)', 'malware.exe (2 KB)', 'inválido — tipo no permitido'),
        dp('Archivo inválido (tamaño)', 'documento_grande.pdf (15 MB)', 'inválido — > límite'),
        dp('Archivo válido', 'requisitos.pdf (500 KB)', 'válido'),
        dp('Límite de tamaño', '10 MB', 'referencia')
      ],
      resultadoEsperado: 'Tipo no permitido: error "Formato no válido. Se aceptan: PDF, DOCX, XLSX". Tamaño excedido: error "El archivo supera el límite de 10 MB". Archivo válido: carga exitosa con nombre visible y opción de eliminar.'
    }));
  }

  if (kws.has('busqueda')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Funcional] Búsqueda — sin resultados y caracteres especiales`,
      tipo:              'Funcional',
      prioridad:         'Media',
      tags:              ['regression', 'security'],
      criterioVinculado: 'E-SRCH',
      precondiciones: ['Datos de prueba cargados en el sistema', 'Buscador visible en la pantalla'],
      pasos: [
        'Ingresar un término que NO existe en el sistema ("xyzabc999")',
        'Ejecutar la búsqueda',
        'Verificar el mensaje de "sin resultados"',
        `Ingresar términos con caracteres especiales: ' OR '1'='1`,
        'Ejecutar la búsqueda',
        'Verificar que no retorna datos no autorizados y no genera error 500',
        'Ingresar término que SÍ existe parcialmente',
        'Verificar que el sistema encuentra registros que contienen el término'
      ],
      datosPrueba: [
        dp('Término inexistente', 'xyzabc999', 'búsqueda sin resultados'),
        dp('SQL injection', `' OR '1'='1`, 'seguridad — sanitización'),
        dp('XSS attempt', '<script>alert(1)</script>', 'seguridad — sanitización'),
        dp('Término válido parcial', 'Navi (para "Navegación")', 'búsqueda parcial')
      ],
      resultadoEsperado: 'Sin resultados: mensaje "No se encontraron resultados para tu búsqueda". SQL injection: sanitizado, sin datos no autorizados, sin error 500. Búsqueda parcial: retorna registros que contienen el término.'
    }));
  }

  if (kws.has('permisos')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Seguridad] Control de permisos por rol — acceso denegado`,
      tipo:              'Seguridad',
      prioridad:         'Alta',
      tags:              ['security', 'regression'],
      criterioVinculado: 'E-PERM',
      precondiciones: [
        'Usuario A: rol sin permisos para esta funcionalidad',
        'Usuario B: rol con permisos completos'
      ],
      pasos: [
        'Iniciar sesión como Usuario A (sin permisos)',
        `Intentar acceder a la URL/endpoint de "${titulo}"`,
        'Verificar que recibe HTTP 403 o mensaje de acceso denegado',
        'Verificar que NO se muestra información sensible en el error',
        'Cerrar sesión e iniciar como Usuario B (con permisos)',
        `Acceder a "${titulo}" — verificar acceso completo`,
        'Intentar manipular el rol directamente en la URL/parámetros',
        'Verificar que la manipulación es ignorada'
      ],
      datosPrueba: [
        dp('Usuario sin permisos', 'rol_basico@test.com', 'control de acceso'),
        dp('Usuario con permisos', 'rol_admin@test.com', 'control de acceso'),
        dp('Manipulación de rol', '?role=admin en URL', 'intento de escalada de privilegios')
      ],
      resultadoEsperado: 'Usuario sin permisos: HTTP 403 o mensaje genérico (sin detalles técnicos). Usuario con permisos: acceso completo. Manipulación de parámetros: ignorada por el servidor, sin escalada de privilegios.'
    }));
  }

  if (kws.has('api')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Integración] API — manejo de timeout y error de servicio externo`,
      tipo:              'Integración',
      prioridad:         'Media',
      tags:              ['integration', 'regression'],
      criterioVinculado: 'E-API',
      precondiciones: [
        'Acceso a herramienta de mock de APIs (Postman Mock / WireMock)',
        'Configurar el mock para simular timeout de 6 segundos'
      ],
      pasos: [
        'Configurar el servicio externo mock para responder con error 500',
        `Ejecutar la acción que depende del servicio: ${accion}`,
        'Verificar que el sistema muestra mensaje de error amigable (no técnico)',
        'Configurar el mock para timeout (6s > umbral de 5s)',
        'Ejecutar nuevamente la acción',
        'Verificar que el sistema activa el manejo de timeout',
        'Restaurar el servicio mock a funcionamiento normal',
        'Verificar que la funcionalidad vuelve a operar correctamente'
      ],
      datosPrueba: [
        dp('Respuesta mock', 'HTTP 500 Internal Server Error', 'error de servicio'),
        dp('Timeout configurado', '6000ms (> umbral de 5s)', 'timeout'),
        dp('Respuesta normal', 'HTTP 200 con payload válido', 'recuperación')
      ],
      resultadoEsperado: 'Error 500: mensaje amigable al usuario, error registrado en logs con correlationId. Timeout: mensaje de "servicio no disponible", reintentos automáticos (máx. 3). Recuperación: funcionalidad disponible tras restaurar el servicio.'
    }));
  }

  if (kws.has('crud') || kws.has('formulario')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Regresión] ${titulo} — persistencia y consistencia de datos`,
      tipo:              'Funcional',
      prioridad:         'Media',
      tags:              ['regression', 'integration'],
      criterioVinculado: 'E1',
      precondiciones: [
        'Base de datos de prueba disponible',
        `El ${rol} tiene permisos de creación y edición`
      ],
      pasos: [
        `Ejecutar la acción: ${accion} con datos específicos de prueba`,
        'Verificar la confirmación visual en la interfaz',
        'Navegar a otra sección y regresar',
        'Verificar que los datos persisten correctamente',
        'Recargar la página (F5) y verificar persistencia',
        'Verificar que los datos son correctos en la base de datos (vía API o consulta directa)',
        'Verificar que no existen registros duplicados'
      ],
      datosPrueba: [
        dp('Datos de prueba', 'Set único e identificable para el test', 'válido'),
        dp('Verificación', 'GET /api/recurso/{id} o consulta BD', 'validación directa')
      ],
      resultadoEsperado: 'Los datos persisten correctamente tras navegación y recarga. No se crean registros duplicados. Los datos en BD coinciden exactamente con los ingresados. No hay discrepancias entre UI y BD.'
    }));
  }

  if (kws.has('responsive')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[UI] ${titulo} — compatibilidad responsive (móvil / tablet)`,
      tipo:              'UI',
      prioridad:         'Media',
      tags:              ['ui', 'regression'],
      criterioVinculado: 'E-RES',
      precondiciones: [
        'DevTools del navegador disponible',
        'Dispositivos de prueba o emulador: iPhone 14 (390px), iPad (768px), Desktop (1440px)'
      ],
      pasos: [
        'Abrir DevTools → Device Toolbar → seleccionar iPhone 14 (390px)',
        `Navegar a la funcionalidad "${titulo}"`,
        'Verificar que no hay scroll horizontal',
        'Verificar que los botones son tocables (≥ 44×44px)',
        'Cambiar a tablet (768px) y verificar el layout',
        'Cambiar a desktop (1440px) y verificar que se usa el espacio correctamente',
        'Verificar en Chrome y Firefox en cada viewport'
      ],
      datosPrueba: [
        dp('Viewport móvil', '390×844px (iPhone 14)', 'responsive'),
        dp('Viewport tablet', '768×1024px (iPad)', 'responsive'),
        dp('Viewport desktop', '1440×900px', 'responsive'),
        dp('Navegadores', 'Chrome 120+ / Firefox 120+', 'compatibilidad')
      ],
      resultadoEsperado: 'Sin scroll horizontal en ningún viewport. Elementos interactivos con área mínima 44×44px en móvil. Texto legible sin zoom. Layout se adapta correctamente en los 3 breakpoints. Sin superposiciones de elementos.'
    }));
  }

  if (kws.has('notificacion')) {
    tcs.push(tc(h.id, n++, {
      titulo:            `[Integración] Notificaciones — entrega y fallo con reintento`,
      tipo:              'Integración',
      prioridad:         'Media',
      tags:              ['integration', 'regression'],
      criterioVinculado: 'E-NOTIF',
      precondiciones: [
        'Cuenta de email de prueba accesible',
        'Servicio de notificaciones en modo sandbox'
      ],
      pasos: [
        `Ejecutar la acción que desencadena la notificación: ${accion}`,
        'Verificar en la bandeja del destinatario que la notificación llega (< 2 min)',
        'Simular fallo del servicio de notificaciones (mock → timeout)',
        'Ejecutar nuevamente la acción desencadenante',
        'Verificar que el sistema registra el fallo en cola de reintentos',
        'Restaurar el servicio y verificar que el reintento entrega la notificación'
      ],
      datosPrueba: [
        dp('Email destinatario', 'qa_test@testmail.com', 'destino de prueba'),
        dp('Fallo simulado', 'Timeout del servicio de notificaciones', 'error controlado'),
        dp('Tiempo máximo entrega', '< 2 minutos', 'SLA')
      ],
      resultadoEsperado: 'Flujo normal: notificación recibida en < 2 minutos con contenido correcto. Fallo: error registrado en cola de reintentos (máx. 3 intentos con backoff). Tras restauración: notificación entregada.'
    }));
  }

  return tcs;
}

// ── test case manual vacío ────────────────────────────────────────────────────
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
