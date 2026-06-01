/**
 * Templates de dominio para proyectos.
 * Cada template pre-carga el contexto IA del proyecto con reglas de negocio,
 * terminología y entidades típicas del dominio.
 */
export const TEMPLATES = [
  {
    id: 'ecommerce',
    nombre: 'E-commerce',
    emoji: '🛒',
    color: '#f97316',
    descripcion: 'Tienda online con catálogo, carrito, checkout y pagos',
    tags: ['carrito', 'producto', 'pago', 'envío', 'usuario', 'pedido'],
    contexto: `DOMINIO: E-commerce / Tienda Online

ENTIDADES PRINCIPALES:
- Producto: tiene SKU, nombre, descripción, precio, stock, categoría, imágenes
- Carrito: pertenece a un usuario, contiene ítems (producto + cantidad + precio snapshot)
- Pedido (Order): estados → Pendiente > Confirmado > En preparación > Enviado > Entregado / Cancelado
- Usuario: puede ser anónimo (guest) o registrado; tiene perfil, direcciones y métodos de pago
- Pago: integración con pasarela (ej. Stripe, PayU, MercadoPago); estados → Pendiente / Aprobado / Rechazado / Reembolsado
- Envío: proveedor logístico, número de tracking, fecha estimada

REGLAS DE NEGOCIO CLAVE:
- Stock se reserva al confirmar el pedido y se descuenta al marcar como preparado
- Si el pago es rechazado, el stock reservado se libera automáticamente
- Descuentos y cupones se aplican al subtotal antes de impuestos
- El carrito expira a las 24h para usuarios anónimos
- Las devoluciones tienen un plazo máximo de 30 días desde la entrega
- Los precios incluyen IVA; la factura se genera automáticamente al confirmar el pago

ACTORES:
- Cliente (usuario final), Administrador de tienda, Operador de logística, Sistema de pagos (externo)

CRITERIOS DE CALIDAD:
- Tiempo de carga del catálogo ≤ 2s (p95)
- Checkout en ≤ 3 pasos
- Cumplimiento PCI-DSS para datos de tarjetas
- Responsive: mobile-first`,
  },

  {
    id: 'fintech',
    nombre: 'Fintech / Banca',
    emoji: '💳',
    color: '#6366f1',
    descripcion: 'Servicios financieros: cuentas, transferencias, wallets y pagos',
    tags: ['transacción', 'cuenta', 'saldo', 'transferencia', 'seguridad', 'kyc'],
    contexto: `DOMINIO: Fintech / Servicios Financieros

ENTIDADES PRINCIPALES:
- Cuenta: número de cuenta, tipo (corriente/ahorro/wallet), saldo disponible, saldo en tránsito, moneda, estado
- Transacción: monto, tipo (débito/crédito/transferencia/pago), estado, fecha valor, referencia única
- Usuario / Cliente: nivel KYC (No verificado / Básico / Completo), límites operativos por nivel
- Beneficiario: cuenta destino registrada y verificada por el usuario
- Tarjeta: virtual o física, límites de gasto, estado (activa/bloqueada/cancelada)

REGLAS DE NEGOCIO CLAVE:
- Saldo disponible = Saldo total - Saldo en tránsito - Retenciones
- Los límites diarios/mensuales se validan antes de procesar cualquier transacción
- Transferencias reversibles dentro de las primeras 2 horas (sujeto a política)
- KYC Básico: límite diario $500 / KYC Completo: límite según producto contratado
- Toda transacción genera un comprobante con código de transacción único (UUID)
- Los intentos fallidos de autenticación bloquean la cuenta tras 3 intentos consecutivos
- Conciliación automática al cierre del día bancario (T+0 o T+1 según tipo)

ACTORES:
- Cliente, Analista de fraude, Operador de soporte, Sistema de core bancario, Regulador (auditoría)

CRITERIOS DE CALIDAD:
- Disponibilidad 99.95% (no más de 4.4h downtime/año)
- Procesamiento de transacciones ≤ 3s p99
- Cifrado end-to-end de datos financieros (AES-256)
- Cumplimiento GDPR / normativa local de protección de datos`,
  },

  {
    id: 'salud',
    nombre: 'Salud / HealthTech',
    emoji: '🏥',
    color: '#10b981',
    descripcion: 'Gestión clínica, turnos, historia clínica y telemedicina',
    tags: ['paciente', 'turno', 'médico', 'receta', 'historia clínica', 'diagnóstico'],
    contexto: `DOMINIO: Salud / HealthTech

ENTIDADES PRINCIPALES:
- Paciente: datos demográficos, número de historia clínica (HC), cobertura médica, contacto de emergencia
- Historia Clínica (HC): documento electrónico con evoluciones, diagnósticos (CIE-10), recetas, estudios
- Turno / Cita: fecha, hora, especialidad, médico, modalidad (presencial/telemedicina), estado
- Médico / Profesional: matrícula, especialidades, agenda, disponibilidad
- Receta: medicamentos (con nombre genérico + marca), posología, vigencia (hasta 90 días), firma digital
- Estudio / Orden: tipo de estudio, laboratorio/imagen, resultado, adjunto

REGLAS DE NEGOCIO CLAVE:
- Solo el médico tratante puede modificar la HC de un paciente bajo su cuidado
- Las recetas electrónicas tienen validez de 30 días (crónicas hasta 90 días)
- Los turnos pueden cancelarse con hasta 2h de anticipación sin penalidad
- Los datos de salud son sensibles (PHI): acceso restringido por rol y auditable
- Las recetas de medicamentos controlados requieren doble firma y registro en ANMAT/COFEPRIS
- Los resultados de estudios solo son visibles para el médico solicitante y el paciente

ACTORES:
- Paciente, Médico / Especialista, Enfermero/a, Recepcionista, Farmacéutico, Auditor de salud

CRITERIOS DE CALIDAD:
- Cumplimiento HIPAA / Ley 26.529 (Argentina) de Derechos del Paciente
- Datos cifrados en tránsito y en reposo
- Backup automático diario de historias clínicas
- Trazabilidad completa de accesos (log de auditoría)`,
  },

  {
    id: 'erp',
    nombre: 'ERP / Gestión Empresarial',
    emoji: '🏭',
    color: '#8b5cf6',
    descripcion: 'Gestión de inventario, ventas, compras y recursos humanos',
    tags: ['factura', 'inventario', 'proveedor', 'orden de compra', 'empleado', 'reporte'],
    contexto: `DOMINIO: ERP / Gestión Empresarial

MÓDULOS Y ENTIDADES PRINCIPALES:
- Inventario: artículo (SKU, descripción, unidad de medida, stock mínimo), almacén, movimientos de stock
- Ventas: cotización → orden de venta → remito → factura → cobro
- Compras: solicitud de compra → orden de compra → recepción → factura de proveedor → pago
- Finanzas: plan de cuentas, asientos contables, cierres mensuales, reportes (P&L, Balance, Flujo de caja)
- RRHH: empleado, contrato, liquidación de sueldos, vacaciones, licencias, evaluaciones

REGLAS DE NEGOCIO CLAVE:
- El stock se actualiza en tiempo real al registrar remitos y recepciones
- Las facturas deben estar vinculadas a una orden de venta/compra aprobada
- Las órdenes de compra requieren aprobación jerárquica según monto (3 niveles)
- El cierre contable mensual bloquea la edición de asientos del período anterior
- Los empleados con más de 1 año acumulan 14 días de vacaciones anuales
- Las modificaciones en facturas emitidas solo se permiten mediante nota de crédito/débito

ACTORES:
- Vendedor, Comprador, Contador, Gerente de operaciones, Almacenero, RRHH, Gerente general (aprobador)

CRITERIOS DE CALIDAD:
- Integridad referencial entre módulos (no puede haber factura sin cliente activo)
- Auditoría de cambios en entidades financieras (who/what/when)
- Cumplimiento normativa fiscal local (AFIP, SAT, SRI según país)
- Reportes disponibles en PDF y Excel`,
  },

  {
    id: 'saas',
    nombre: 'SaaS / B2B',
    emoji: '☁️',
    color: '#0ea5e9',
    descripcion: 'Plataforma multitenant con suscripciones, onboarding y analytics',
    tags: ['tenant', 'suscripción', 'plan', 'onboarding', 'api', 'dashboard'],
    contexto: `DOMINIO: SaaS / Plataforma B2B

ENTIDADES PRINCIPALES:
- Organización (Tenant): unidad aislada de datos, configuración y usuarios; tiene plan y límites
- Plan / Suscripción: Freemium / Starter / Pro / Enterprise; define límites de uso (MAU, API calls, storage)
- Usuario: pertenece a una o más organizaciones con roles (Admin, Member, Viewer)
- API Key: pertenece a la organización, con scopes y rate limiting propio
- Billing / Facturación: ciclo mensual/anual, prorratas en upgrades, reintentos en fallo de pago
- Audit Log: registro inmutable de acciones críticas por usuario y sesión

REGLAS DE NEGOCIO CLAVE:
- Cada tenant tiene su propio aislamiento de datos (row-level security o schema separation)
- Al superar el 80% del límite del plan, el usuario recibe alerta; al 100% se bloquea la funcionalidad
- El downgrade de plan no elimina datos pero los oculta hasta que se reactiva el plan superior
- Los Admins pueden invitar usuarios; las invitaciones expiran en 72h
- Los cambios de plan generan un evento de billing inmediatamente (no al cierre de ciclo)
- Las API keys expiran cada 90 días y se pueden rotar sin downtime (overlap de 24h)

ACTORES:
- Admin de organización, Miembro (usuario regular), Viewer (solo lectura), Super Admin (equipo interno), Sistema de billing

CRITERIOS DE CALIDAD:
- SLA 99.9% uptime por organización
- Respuesta de API ≤ 200ms p95 (excluyendo operaciones batch)
- Rate limiting configurable por plan (ej: 100 req/min en Starter, 1000 en Pro)
- GDPR compliant: derecho al olvido, exportación de datos, DPA disponible`,
  },

  {
    id: 'educacion',
    nombre: 'Educación / LMS',
    emoji: '🎓',
    color: '#f59e0b',
    descripcion: 'Plataforma de aprendizaje: cursos, evaluaciones y certificaciones',
    tags: ['estudiante', 'curso', 'módulo', 'evaluación', 'certificado', 'progreso'],
    contexto: `DOMINIO: Educación / Learning Management System (LMS)

ENTIDADES PRINCIPALES:
- Curso: título, descripción, categoría, nivel, duración estimada, precio, instructor(es)
- Módulo / Lección: video, texto, quiz, tarea; tiene orden, duración y estado de completitud
- Estudiante: matrícula, cursos inscritos, progreso por curso, certificados obtenidos
- Evaluación / Quiz: preguntas (opción múltiple, V/F, abierta), puntaje de aprobación, intentos permitidos
- Certificado: generado automáticamente al completar curso con puntaje ≥ al mínimo; firmado digitalmente
- Instructor: perfil, cursos dictados, calificación promedio, analíticas de sus cursos

REGLAS DE NEGOCIO CLAVE:
- Un curso se marca como completado cuando el estudiante aprueba todas las evaluaciones obligatorias
- El puntaje mínimo de aprobación es configurable por curso (default: 70%)
- Los quizzes permiten hasta 3 intentos; el mejor puntaje es el que cuenta
- El progreso de lección se guarda automáticamente cada 30 segundos y al salir
- Los certificados incluyen: nombre del estudiante, curso, fecha, código verificable online
- Los instructores solo pueden editar sus propios cursos y ver datos agregados (no individuales) de estudiantes

ACTORES:
- Estudiante, Instructor, Administrador de plataforma, Sistema de pagos (cursos de pago)

CRITERIOS DE CALIDAD:
- Video: carga inicial ≤ 3s, buffering ≤ 2% del tiempo de reproducción
- Accesibilidad WCAG 2.1 AA (subtítulos en videos, navegación por teclado)
- Soporte offline para lecciones descargadas (PWA)
- Escalabilidad para picos de acceso en períodos de exámenes`,
  },
];

/** Busca un template por su ID */
export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || null;
}
