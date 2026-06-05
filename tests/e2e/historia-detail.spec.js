import { test, expect } from 'playwright/test';
import { SK, makeSeedData } from './helpers/seed.js';

const HU_ID = 'HU-TEST-001';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, { key: SK, data: makeSeedData({ historias: 3 }) });
  await page.goto(`/#/historias/${HU_ID}`);
  await expect(page.locator('.detail-title')).toBeVisible();
});

// ── Header y metadata ─────────────────────────────────────────────────────────

test.describe('Header del detalle', () => {
  test('muestra el ID de la historia en el breadcrumb o header', async ({ page }) => {
    // El ID aparece en el breadcrumb superior o en el header de la página
    await expect(page.locator(`text=${HU_ID}`).first()).toBeVisible();
  });

  test('muestra el resumen de la historia como título', async ({ page }) => {
    await expect(page.locator('.detail-title')).toContainText('Historia de prueba 1');
  });

  test('muestra la prioridad como badge', async ({ page }) => {
    await expect(page.locator('.badge-high, .badge-medium, .badge-low')).toBeVisible();
  });

  test('tiene botones Volver, Copiar y Editar', async ({ page }) => {
    await expect(page.locator('text=Volver')).toBeVisible();
    await expect(page.locator('#btn-copy-hu')).toBeVisible();
    await expect(page.locator('text=Editar')).toBeVisible();
  });

  test('botón Volver regresa a la lista de historias', async ({ page }) => {
    await page.locator('text=Volver').click();
    await expect(page).toHaveURL(/#\/historias$/);
  });
});

// ── Navegación por tabs ───────────────────────────────────────────────────────

test.describe('Tabs de la historia', () => {
  const TABS = ['resumen', 'criterios', 'testcases', 'mockups', 'jira'];

  for (const tab of TABS) {
    test(`tab "${tab}" es accesible y renderiza contenido`, async ({ page }) => {
      await page.locator(`[data-tab="${tab}"]`).click();
      const tabContent = page.locator('#tab-content');
      await expect(tabContent).toBeVisible();
      // El tab-content no debe estar vacío
      const text = await tabContent.textContent();
      expect(text.trim().length).toBeGreaterThan(0);
    });
  }

  test('el tab activo tiene clase "active"', async ({ page }) => {
    await page.locator('[data-tab="criterios"]').click();
    await expect(page.locator('[data-tab="criterios"]')).toHaveClass(/active/);
    await expect(page.locator('[data-tab="resumen"]')).not.toHaveClass(/active/);
  });
});

// ── Tab Resumen ───────────────────────────────────────────────────────────────

test.describe('Tab Resumen', () => {
  test('muestra el texto Como/Quiero/Para', async ({ page }) => {
    await page.locator('[data-tab="resumen"]').click();
    const content = page.locator('#tab-content');
    await expect(content).toContainText('usuario autenticado');
    await expect(content).toContainText('realizar la acción');
    await expect(content).toContainText('verificar el sistema');
  });

  test('muestra la metadata del proyecto (tipo, prioridad, fecha)', async ({ page }) => {
    await page.locator('[data-tab="resumen"]').click();
    await expect(page.locator('#tab-content')).toContainText('Story');
    await expect(page.locator('#tab-content')).toContainText('High');
  });
});

// ── Botón Copiar ──────────────────────────────────────────────────────────────

test.describe('Copiar historia', () => {
  test('el botón Copiar existe y es clickeable', async ({ page }) => {
    const copyBtn = page.locator('#btn-copy-hu, button:has-text("Copiar")').first();
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();
  });

  test('clic en Copiar muestra un toast de confirmación', async ({ page }) => {
    const copyBtn = page.locator('#btn-copy-hu, button:has-text("Copiar")').first();
    await copyBtn.click();
    const toast = page.locator('.toast');
    await expect(toast.first()).toBeVisible({ timeout: 3000 });
  });
});

// ── Edición ───────────────────────────────────────────────────────────────────

test.describe('Navegar a edición', () => {
  test('botón Editar navega al formulario de edición', async ({ page }) => {
    await page.locator('text=Editar').click();
    await expect(page).toHaveURL(new RegExp(`#/historias/${HU_ID}/editar`));
  });

  test('el formulario de edición trae los datos de la historia', async ({ page }) => {
    await page.locator('text=Editar').click();
    await expect(page.locator('#hu-resumen')).toHaveValue('Historia de prueba 1');
    await expect(page.locator('#hu-como')).toHaveValue('usuario autenticado');
  });
});

// ── Historia no encontrada ────────────────────────────────────────────────────

test.describe('Historia inexistente', () => {
  test('muestra estado vacío si el ID no existe', async ({ page }) => {
    await page.goto('/#/historias/HU-NO-EXISTE-999');
    // La app muestra un mensaje de error o redirige
    const notFound = page.locator('.empty-state');
    const viewContent = page.locator('#view');
    await expect(viewContent).toBeVisible();
    // Verifica que no cargó el detalle (no hay .detail-title)
    await expect(page.locator('.detail-title')).not.toBeVisible();
  });
});
