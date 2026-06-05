import { test, expect } from 'playwright/test';
import { SK, makeSeedData } from './helpers/seed.js';
import path from 'path';

const HU_ID  = 'HU-TEST-001';
const TC_TAB = '[data-tab="testcases"]';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, { key: SK, data: makeSeedData({ historias: 2 }) });
  await page.goto(`/#/historias/${HU_ID}`);
  await page.locator(TC_TAB).click();
  await expect(page.locator('.tab-testcases')).toBeVisible();
});

// ── Lista de test cases ───────────────────────────────────────────────────────

test.describe('Lista de test cases', () => {
  test('muestra el conteo correcto de TCs', async ({ page }) => {
    const count = page.locator('.tab-count');
    await expect(count).toContainText('2 test cases');
  });

  test('los TCs están agrupados por tipo', async ({ page }) => {
    await expect(page.locator('.tc-grupo')).toHaveCount(1); // ambos son "Funcional"
    await expect(page.locator('.tc-grupo-label')).toHaveText('Funcional');
  });

  test('cada TC card muestra ID, título, tags y estado', async ({ page }) => {
    const firstCard = page.locator('.tc-card').first();
    await expect(firstCard).toContainText('TC-HU-TEST-001-001');
    await expect(firstCard).toContainText('Flujo principal');
    await expect(firstCard).toContainText('No ejecutado');
  });

  test('hay botón de exportar cuando hay TCs', async ({ page }) => {
    await expect(page.locator('#btn-export-tcs')).toBeVisible();
  });

  test('hay botón "+ Añadir manual"', async ({ page }) => {
    await expect(page.locator('#btn-add-tc')).toBeVisible();
  });
});

// ── Drawer de detalle de TC ───────────────────────────────────────────────────

test.describe('Drawer de TC', () => {
  async function openDrawer(page) {
    await page.locator('.tc-card-clickable').first().click();
    await expect(page.locator('#tc-drawer-overlay')).toBeVisible({ timeout: 3000 });
  }

  test('abre el drawer al hacer clic en un TC card', async ({ page }) => {
    await openDrawer(page);
    await expect(page.locator('#tc-drawer')).toBeVisible();
  });

  test('el drawer muestra el título del TC', async ({ page }) => {
    await openDrawer(page);
    await expect(page.locator('.tc-drawer-titulo')).toContainText('Flujo principal');
  });

  test('el drawer muestra el ID del TC', async ({ page }) => {
    await openDrawer(page);
    await expect(page.locator('.tc-drawer-id')).toContainText('TC-HU-TEST-001-001');
  });

  test('el drawer muestra las secciones de contenido', async ({ page }) => {
    await openDrawer(page);
    const body = page.locator('.tc-drawer-body');
    await expect(body).toContainText('Precondiciones');
    await expect(body).toContainText('Pasos de ejecución');
    await expect(body).toContainText('Resultado esperado');
  });

  test('el drawer muestra el navegador de posición (1 / N)', async ({ page }) => {
    await openDrawer(page);
    await expect(page.locator('.tc-drawer-nav-pos')).toHaveText('1 / 2');
  });

  test('cierra el drawer con el botón X', async ({ page }) => {
    await openDrawer(page);
    await page.locator('#btn-tc-drawer-close').click();
    await expect(page.locator('#tc-drawer-overlay')).not.toBeVisible({ timeout: 2000 });
  });

  test('cierra el drawer con la tecla Escape', async ({ page }) => {
    await openDrawer(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#tc-drawer-overlay')).not.toBeVisible({ timeout: 2000 });
  });

  test('cierra el drawer al clic en el backdrop', async ({ page }) => {
    await openDrawer(page);
    await page.locator('#tc-drawer-backdrop').click();
    await expect(page.locator('#tc-drawer-overlay')).not.toBeVisible({ timeout: 2000 });
  });

  test('navega al TC siguiente con el botón ›', async ({ page }) => {
    await openDrawer(page);
    await expect(page.locator('.tc-drawer-nav-pos')).toHaveText('1 / 2');
    await page.locator('#btn-tc-next').click();
    await expect(page.locator('.tc-drawer-nav-pos')).toHaveText('2 / 2');
    await expect(page.locator('.tc-drawer-titulo')).toContainText('Datos inválidos');
  });

  test('botón ‹ está deshabilitado en el primer TC', async ({ page }) => {
    await openDrawer(page);
    await expect(page.locator('#btn-tc-prev')).toBeDisabled();
  });

  test('botón › está deshabilitado en el último TC', async ({ page }) => {
    await openDrawer(page);
    await page.locator('#btn-tc-next').click();
    await expect(page.locator('#btn-tc-next')).toBeDisabled();
  });
});

// ── Eliminar TC ───────────────────────────────────────────────────────────────

test.describe('Eliminar test case', () => {
  test('el botón ✕ elimina el TC de la lista', async ({ page }) => {
    const before = await page.locator('.tc-card').count();
    // Hacer visible el botón de eliminar con hover
    await page.locator('.tc-card').first().hover();
    await page.locator('.tc-del-btn').first().click();
    const after = await page.locator('.tc-card').count();
    expect(after).toBe(before - 1);
  });
});

// ── Exportar TCs ──────────────────────────────────────────────────────────────

test.describe('Exportar test cases', () => {
  async function openExportMenu(page) {
    await page.locator('#btn-export-tcs').click();
    await expect(page.locator('#tc-export-menu')).toHaveClass(/tc-export-menu--open/);
  }

  test('abre el menú de exportación al hacer clic en "Exportar"', async ({ page }) => {
    await openExportMenu(page);
    await expect(page.locator('[data-export-fmt="csv"]')).toBeVisible();
    await expect(page.locator('[data-export-fmt="md"]')).toBeVisible();
    await expect(page.locator('[data-export-fmt="clip"]')).toBeVisible();
  });

  test('cierra el menú al clic fuera', async ({ page }) => {
    await openExportMenu(page);
    // Clic en el conteo de TCs (fuera del menú)
    await page.locator('.tab-count').click();
    await expect(page.locator('#tc-export-menu')).not.toHaveClass(/tc-export-menu--open/);
  });

  test('descarga CSV al seleccionar "CSV detallado"', async ({ page }) => {
    await openExportMenu(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-export-fmt="csv"]').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/TC_.*\.csv/);
  });

  test('descarga Markdown al seleccionar "Markdown"', async ({ page }) => {
    await openExportMenu(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-export-fmt="md"]').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/TC_.*\.md/);
  });

  test('"Copiar al portapapeles" muestra un toast de confirmación', async ({ page }) => {
    // Otorgar permisos de clipboard
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
    await openExportMenu(page);
    await page.locator('[data-export-fmt="clip"]').click();
    await expect(page.locator('.toast')).toBeVisible({ timeout: 3000 });
  });
});

// ── Añadir TC manual ─────────────────────────────────────────────────────────

test.describe('Añadir TC manual', () => {
  test('añade un nuevo TC a la lista', async ({ page }) => {
    const before = await page.locator('.tc-card').count();
    await page.locator('#btn-add-tc').click();
    const after = await page.locator('.tc-card').count();
    expect(after).toBe(before + 1);
  });
});
