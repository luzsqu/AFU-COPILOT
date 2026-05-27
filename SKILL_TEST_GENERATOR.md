---
name: "test-generator"
description: >
  Genera tests para el proyecto AFU-COPILOT (Vanilla JS + Vite + Playwright).
  Stack: sin framework UI, módulos ES, persistencia en localStorage, hash-router.
  Actívalo cuando el usuario pida: "generate tests", "write tests for this module",
  "add unit tests", "create E2E test", "test this function", "set up testing",
  "add coverage", "testear este módulo", "escribir tests para", "agregar tests".
tools:
  - Read     # leer módulos fuente antes de generar tests
  - Write    # crear archivos de test nuevos
  - Edit     # modificar tests o configs existentes
  - Bash     # correr npx vitest / npx playwright test
---

# Test Generator — AFU-COPILOT

Stack real del proyecto:
- **Lenguaje:** Vanilla JavaScript (ES Modules), sin framework
- **Build:** Vite 5
- **Unit/Integration:** Vitest (instalar si no está — ver Paso 0)
- **E2E:** Playwright (ya instalado)
- **Persistencia:** localStorage — requiere mock en tests unitarios
- **Router:** hash-based (`#/ruta`) — relevante para E2E

---

## Paso 0 — Setup inicial (solo la primera vez)

Si no existe `vitest` en el proyecto, instalarlo:

```bash
cd /Users/somnio/Desktop/AFU-COPILOT
npm install -D vitest @vitest/ui jsdom
```

Agregar scripts a `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

Agregar config de Vitest a `vite.config.js`:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',        // simula el DOM del navegador
    globals: true,               // describe/it/expect sin import
    setupFiles: ['./tests/setup.js'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/e2e/'],
    },
  },
});
```

Crear `tests/setup.js`:
```javascript
// Mock de localStorage para todos los tests unitarios
import { vi } from 'vitest';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem:   (k) => store[k] ?? null,
    setItem:   (k, v) => { store[k] = String(v); },
    removeItem:(k) => { delete store[k]; },
    clear:     ()  => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Limpiar localStorage antes de cada test
beforeEach(() => localStorage.clear());
```

---

## Árbol de decisión — qué tipo de test escribir

```
¿Qué vas a testear?
│
├── Función pura en utils.js (esc, formatDate, generarId…)
│   └── → Test unitario con Vitest
│
├── Lógica de módulo (historias.js, gherkin.js, storage.js, state.js…)
│   └── → Test de integración con Vitest + mock de localStorage
│
├── Flujo de usuario completo (login → crear historia → exportar)
│   └── → Test E2E con Playwright
│
└── Comportamiento del router / navegación entre rutas
    └── → Test E2E con Playwright
```

---

## Templates por módulo

### Template A — Función pura de `utils.js`

```javascript
// tests/unit/utils.test.js
import { describe, it, expect } from 'vitest';
import { esc, formatDate, generarId } from '../../src/modules/utils.js';

describe('esc()', () => {
  it('escapa caracteres HTML peligrosos', () => {
    expect(esc('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('devuelve string vacío para null/undefined', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('no modifica texto limpio', () => {
    expect(esc('Hola mundo')).toBe('Hola mundo');
  });
});

describe('generarId()', () => {
  it('genera IDs con prefijo HU-', () => {
    expect(generarId()).toMatch(/^HU-/);
  });

  it('genera IDs únicos en ejecuciones consecutivas', () => {
    const ids = Array.from({ length: 100 }, () => generarId());
    const unicos = new Set(ids);
    expect(unicos.size).toBe(100);
  });

  it('no genera IDs duplicados aunque se llame en el mismo ms', () => {
    // Simular que Date.now() siempre devuelve el mismo valor
    const originalNow = Date.now;
    Date.now = () => 1000000;
    const ids = Array.from({ length: 10 }, () => generarId());
    Date.now = originalNow;
    expect(new Set(ids).size).toBe(10); // todos únicos gracias al sufijo random
  });
});

describe('formatDate()', () => {
  it('formatea ISO string en español', () => {
    const result = formatDate('2025-01-15T10:00:00.000Z');
    expect(result).toMatch(/ene/i); // enero en español
  });

  it('devuelve string vacío para null', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});
```

### Template B — Lógica de negocio (`historias.js`, `gherkin.js`)

```javascript
// tests/unit/historias.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../../src/modules/state.js';
import { crearHistoriaData, eliminarHistoriaById, duplicarHistoria } from '../../src/modules/historias.js';

const PROYECTO_ID = 'proj-test-001';

beforeEach(() => {
  // Reiniciar estado global antes de cada test
  state.historias = [];
  state.proyectoActivoId = PROYECTO_ID;
});

describe('crearHistoriaData()', () => {
  it('crea una historia con los campos requeridos', () => {
    const datos = {
      resumen: 'Como usuario quiero iniciar sesión',
      tipo: 'Story',
      prioridad: 'High',
    };
    const historia = crearHistoriaData(datos);

    expect(historia.id).toMatch(/^HU-/);
    expect(historia.resumen).toBe(datos.resumen);
    expect(historia.tipo).toBe('Story');
    expect(historia.proyectoId).toBe(PROYECTO_ID);
    expect(historia.criterios).toEqual([]);
    expect(historia.testCases).toEqual([]);
  });

  it('asigna fecha de creación automáticamente', () => {
    const historia = crearHistoriaData({ resumen: 'Test' });
    expect(new Date(historia.creado).getTime()).toBeGreaterThan(0);
  });
});

describe('eliminarHistoriaById()', () => {
  it('elimina la historia con el ID dado', () => {
    const h = crearHistoriaData({ resumen: 'Para eliminar' });
    state.historias.push(h);
    expect(state.historias).toHaveLength(1);

    eliminarHistoriaById(h.id);

    expect(state.historias).toHaveLength(0);
  });

  it('no hace nada si el ID no existe', () => {
    state.historias.push(crearHistoriaData({ resumen: 'Existente' }));
    eliminarHistoriaById('HU-INEXISTENTE');
    expect(state.historias).toHaveLength(1);
  });
});

describe('duplicarHistoria()', () => {
  it('crea una copia con ID diferente', () => {
    const original = crearHistoriaData({ resumen: 'Original' });
    state.historias.push(original);

    const copia = duplicarHistoria(original.id);

    expect(copia.id).not.toBe(original.id);
    expect(copia.resumen).toContain('Original');
    expect(state.historias).toHaveLength(2);
  });
});
```

### Template C — Storage con localStorage

```javascript
// tests/unit/storage.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../../src/modules/state.js';
import { guardar, cargar } from '../../src/modules/storage.js';

beforeEach(() => {
  localStorage.clear();
  state.historias = [];
  state.proyectos = [];
  state.usuario   = null;
});

describe('guardar() / cargar()', () => {
  it('persiste y recupera el estado completo', () => {
    state.usuario   = { username: 'luz', role: 'analista' };
    state.historias = [{ id: 'HU-001', resumen: 'Test' }];

    guardar();
    // Resetear estado en memoria
    state.usuario   = null;
    state.historias = [];

    cargar();

    expect(state.usuario.username).toBe('luz');
    expect(state.historias).toHaveLength(1);
    expect(state.historias[0].id).toBe('HU-001');
  });

  it('no lanza si localStorage está vacío', () => {
    expect(() => cargar()).not.toThrow();
  });

  it('muestra toast cuando se supera la cuota', () => {
    // Forzar QuotaExceededError
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    };

    // No debe lanzar hacia afuera — lo maneja internamente con toast
    expect(() => guardar()).not.toThrow();

    localStorage.setItem = originalSetItem;
  });
});
```

### Template D — Test E2E con Playwright

```javascript
// tests/e2e/historias.spec.js
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5177';

test.describe('Flujo de Historias de Usuario', () => {
  test.beforeEach(async ({ page }) => {
    // Login rápido antes de cada test
    await page.goto(`${BASE}/#/login`);
    await page.fill('#username', 'luz');
    await page.fill('#password', 'luz123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/#\/(projects|dashboard)/);

    // Navegar directo a historias
    await page.goto(`${BASE}/#/historias`);
  });

  test('muestra la lista de historias del proyecto activo', async ({ page }) => {
    await expect(page.locator('.historias-wrap')).toBeVisible();
    await expect(page.locator('.page-title')).toContainText('Historias');
  });

  test('activa y usa el modo selección en lote', async ({ page }) => {
    // Entrar en modo selección
    await page.getByRole('button', { name: 'Seleccionar' }).click();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();

    // Seleccionar una historia
    const firstCard = page.locator('.hu-card').first();
    await firstCard.click();

    // Verificar sel-bar con chip
    const selBar = page.locator('#sel-bar');
    await expect(selBar).toBeVisible();
    await expect(selBar.locator('#sel-count')).toContainText('1 seleccionada');
    await expect(selBar.locator('.sel-chip').first()).toBeVisible();
  });

  test('filtra historias por prioridad', async ({ page }) => {
    // Cambiar a vista lista para tener datos claros
    await page.locator('.vista-btn[data-vista="lista"]').click();

    const totalAntes = await page.locator('#historias-content tr[data-id]').count();

    // Filtrar por High
    await page.locator('.filter-pill', { hasText: 'High' }).click();

    const totalDespues = await page.locator('#historias-content tr[data-id]').count();
    expect(totalDespues).toBeLessThanOrEqual(totalAntes);

    // Todas las filas visibles deben ser High
    const badges = page.locator('.badge-high');
    const filas  = page.locator('#historias-content tr[data-id]');
    expect(await badges.count()).toBe(await filas.count());
  });

  test('elimina historia y la restaura con Deshacer', async ({ page }) => {
    await page.locator('.vista-btn[data-vista="lista"]').click();

    const countAntes = await page.locator('#historias-content tr[data-id]').count();

    // Eliminar primera fila
    await page.locator('[data-action="del"]').first().click();

    const countDespues = await page.locator('#historias-content tr[data-id]').count();
    expect(countDespues).toBe(countAntes - 1);

    // Hacer click en "Deshacer" dentro del toast
    await page.locator('.toast-action-btn', { hasText: 'Deshacer' }).click();

    const countRestaurado = await page.locator('#historias-content tr[data-id]').count();
    expect(countRestaurado).toBe(countAntes);
  });

  test('ordena la tabla al hacer click en header de columna', async ({ page }) => {
    await page.locator('.vista-btn[data-vista="lista"]').click();

    // Click en header Prioridad
    await page.locator('th[data-sort="prioridad"]').click();
    await expect(page.locator('th[data-sort="prioridad"]')).toHaveClass(/sort-asc/);

    // Segundo click invierte el orden
    await page.locator('th[data-sort="prioridad"]').click();
    await expect(page.locator('th[data-sort="prioridad"]')).toHaveClass(/sort-desc/);
  });
});
```

---

## Estructura de carpetas recomendada

```
AFU-COPILOT/
├── tests/
│   ├── setup.js                  ← mock de localStorage
│   ├── unit/
│   │   ├── utils.test.js         ← esc, formatDate, generarId
│   │   ├── historias.test.js     ← CRUD de historias
│   │   ├── storage.test.js       ← guardar/cargar/quota
│   │   ├── gherkin.test.js       ← generarCriterios
│   │   └── testcases.test.js     ← generarTestCases
│   └── e2e/
│       ├── auth.spec.js          ← login / logout
│       ├── historias.spec.js     ← CRUD, selección, filtros
│       ├── export.spec.js        ← PDF, CSV, Markdown
│       └── jira.spec.js          ← integración Jira
├── playwright.config.js
├── vite.config.js
└── SKILL_TEST_GENERATOR.md       ← este archivo
```

---

## Comandos rápidos

```bash
# Correr todos los tests unitarios
npm test

# Modo watch (re-corre al guardar)
npm run test:watch

# Ver cobertura
npm run test:coverage

# Tests E2E (requiere dev server corriendo)
npm run dev &
npm run test:e2e

# E2E con UI interactiva
npx playwright test --ui
```

---

## Módulos prioritarios para testear

| Módulo | Tipo de test | Criticidad |
|---|---|---|
| `utils.js` — `esc()`, `generarId()`, `formatDate()` | Unit | 🔴 Alta — XSS, IDs únicos |
| `storage.js` — `guardar()`, `cargar()` | Unit + Edge cases | 🔴 Alta — pérdida de datos |
| `historias.js` — CRUD | Integration | 🔴 Alta — lógica core |
| `gherkin.js` — `generarCriterios()` | Unit | 🟡 Media |
| `testcases.js` — `generarTestCases()` | Unit | 🟡 Media |
| `router.js` — navegación y guards | E2E | 🟡 Media |
| Selección en lote (flujo completo) | E2E | 🟡 Media — recién corregido |
| Export PDF/CSV/MD | E2E | 🟢 Baja |
