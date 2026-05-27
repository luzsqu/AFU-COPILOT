# AFU-COPILOT — Analista de Historias de Usuario con IA

> Herramienta web para QA Analysts y Product Managers que genera, gestiona y exporta Historias de Usuario estructuradas bajo metodología **ISTQB**, potenciadas con Inteligencia Artificial.

---

## ¿Qué es AFU-COPILOT?

AFU-COPILOT es una **Single Page Application** que corre 100% en el navegador, sin servidor propio. Permite a equipos de software crear historias de usuario de calidad en minutos, con criterios de aceptación Gherkin y test cases generados automáticamente.

---

## Funcionalidades principales

### Gestión de Historias de Usuario
- Estructura estándar ISTQB: `Como / Quiero / Para`
- Tipos: Story, Task, Bug, Epic, Sub-task
- Prioridades, Story Points, etiquetas y links
- Historial de imágenes adjuntas (base64)
- Duplicar, editar y eliminar historias

### Generación con Inteligencia Artificial
- **Desde texto libre** → historias estructuradas
- **Desde imagen / screenshot** → OCR + análisis visual
- **Desde JSON / API externa** → importación masiva
- Contexto de proyecto inyectado para alinear la generación al dominio

### Criterios Gherkin automáticos
Al crear una HU, se detectan palabras clave y se generan escenarios:

| Scenario | Tipo |
|---|---|
| E1 | Happy Path |
| E2 | Datos inválidos |
| E3 | Boundary Values |
| E-NF | No-funcional (performance / seguridad) |
| E-AUTH | Bloqueo tras N intentos |
| E-EMAIL | Validación de formato email |
| E-PAGO | Transacción rechazada |
| E-API | Fallo de servicio externo |

### Test Cases automáticos
Desde los criterios Gherkin se generan TCs con:
- Tipos: Funcional, No funcional, UI, Seguridad, Integración
- Precondiciones, pasos, datos de prueba y resultado esperado
- Estado: No ejecutado / Pasó / Falló / Bloqueado

### Exportación
- Markdown (`.md`)
- PDF (A4, impresión directa)
- JSON (datos crudos)
- Gherkin (`.feature` para Cucumber)

### Integración con Jira Cloud
- Autenticación Basic (email + API token)
- Listar proyectos disponibles
- Detectar campo Story Points del workspace
- Crear issues directamente desde una HU

### UX
- Dark mode
- Command Palette (`Cmd+K` / `Ctrl+K`) con búsqueda fuzzy
- Vista cards / tabla
- Toast notifications
- Sidebar con navegación y contadores

---

## Proveedores de IA soportados

| Proveedor | Modelos |
|---|---|
| **Groq** | llama-3.3-70b-versatile, llama-3.1-8b, mixtral-8x7b |
| **Grok (xAI)** | grok-3, grok-2-1212, grok-3-mini-fast |
| **Claude (Anthropic)** | claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5 |
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vanilla JavaScript (sin framework) |
| Build | Vite 5.0 |
| Persistencia | `localStorage` (offline-first) |
| Testing | Playwright 1.60 |
| Estilos | CSS puro con custom properties |
| Proxy CORS | Middleware Vite (dev) |

---

## Arquitectura

```
src/
├── main.js               # Bootstrap, config IA, dark mode, router init
├── styles/
│   └── main.css          # Design system (tokens, componentes, dark mode)
└── modules/
    ├── state.js          # Estado global centralizado
    ├── router.js         # SPA hash-router (#/ruta)
    ├── storage.js        # LocalStorage con versioning de claves
    ├── auth.js           # Autenticación local
    ├── projects.js       # CRUD de proyectos con contexto para IA
    ├── historias.js      # CRUD de Historias de Usuario (ISTQB)
    ├── epicas.js         # Épicas y vinculación
    ├── gherkin.js        # Generador automático de criterios Gherkin
    ├── testcases.js      # Generador de Test Cases desde Gherkin
    ├── import.js         # Importación IA (texto + imagen/OCR)
    ├── export.js         # Exportación MD / PDF / JSON / .feature
    ├── jira.js           # Integración Jira Cloud REST API v2
    ├── api.js            # Config y estado de conexión IA
    ├── ui.js             # Renderizado de todas las vistas
    ├── sidebar.js        # Sidebar con navegación y selector de proyecto
    ├── palette.js        # Command Palette (Cmd+K)
    ├── config.js         # Página de configuración
    ├── utils.js          # Helpers (escape XSS, IDs, fechas)
    └── toast.js          # Notificaciones (success, error, warn, info)
```

---

## Instalación y uso

### Requisitos
- Node.js 18+
- Una API key de cualquier proveedor soportado (Groq, Grok, Claude u OpenAI)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/LUZSQU/AFU-COPILOT.git
cd AFU-COPILOT

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (opcional — activa Grok por defecto)
cp .env.example .env
# Editar .env y agregar tu API key de Grok

# 4. Iniciar en modo desarrollo
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

### Build para producción

```bash
npm run build
npm run preview
```

---

## Configuración de API key

La app permite configurar el proveedor de IA desde la UI (`/config`):

1. Ir a **Configuración → Inteligencia Artificial**
2. Seleccionar proveedor y modelo
3. Ingresar la API key
4. Clic en **"Probar conexión"**

O bien, para pre-activar Grok sin pasar por configuración:

```env
# .env
VITE_GROK_API_KEY=tu_api_key_aqui
```

Obtén tu key gratis en [console.x.ai](https://console.x.ai)

---

## Rutas de la aplicación

| Ruta | Vista |
|---|---|
| `#/login` | Login |
| `#/projects` | Selector de proyectos |
| `#/dashboard` | Estadísticas y accesos rápidos |
| `#/historias` | Lista con filtros y búsqueda |
| `#/historias/nueva` | Formulario manual |
| `#/historias/nueva-imagen` | Upload imagen → IA |
| `#/historias/nueva-api` | Import JSON / API |
| `#/historias/:id` | Detalle (Resumen, Criterios, TCs) |
| `#/historias/:id/editar` | Edición |
| `#/config` | Configuración IA + Jira + Preferencias |

---

## Integración con Jira

1. Ir a **Configuración → Integración Jira**
2. Ingresar email, API token y URL base de tu instancia
3. Probar conexión
4. Desde cualquier HU → botón **"Crear en Jira"**

Genera tokens en: [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

---

## Reset de datos

Para limpiar el `localStorage` y empezar desde cero:

```
http://localhost:5173/reset.html
```

---

## Consideraciones de seguridad

- Las API keys se guardan en `localStorage` del navegador — no compartir el dispositivo sin cerrar sesión
- Las contraseñas de la app usan `btoa()` (encoding, no encriptación) — diseñado para uso local
- El proxy Vite solo aplica en modo desarrollo (`npm run dev`)
- El archivo `.env` está excluido del repositorio por `.gitignore`

---

## Licencia

Proyecto privado — todos los derechos reservados © 2025 LUZSQU
