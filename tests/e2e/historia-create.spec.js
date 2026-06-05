import { test, expect } from 'playwright/test';
import { SK, makeSeedData } from './helpers/seed.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, { key: SK, data: makeSeedData({ historias: 0 }) });
  await page.goto('/#/historias/nueva');
  await expect(page.locator('#form-hu')).toBeVisible();
});

// ── Formulario vacío ──────────────────────────────────────────────────────────

test.describe('Validación del formulario', () => {
  test('botón "Crear historia" está deshabilitado inicialmente', async ({ page }) => {
    await expect(page.locator('#btn-crear-hu')).toBeDisabled();
  });

  test('contador de caracteres del resumen empieza en 0/255', async ({ page }) => {
    await expect(page.locator('#char-count')).toHaveText('0 / 255');
  });

  test('el contador se actualiza al escribir en el resumen', async ({ page }) => {
    await page.fill('#hu-resumen', 'Mi historia');
    await expect(page.locator('#char-count')).toHaveText('11 / 255');
  });

  test('muestra error de validación en campo requerido vacío al salir (blur)', async ({ page }) => {
    await page.locator('#hu-resumen').focus();
    await page.locator('#hu-como').focus(); // blur del resumen
    // El campo debería mostrar el estado de error visual
    const resumenField = page.locator('#hu-resumen');
    await expect(resumenField).toHaveClass(/field-invalid/);
  });

  test('limpia el error al escribir en un campo inválido', async ({ page }) => {
    // Forzar error
    await page.locator('#hu-resumen').focus();
    await page.locator('#hu-como').focus();
    await expect(page.locator('#hu-resumen')).toHaveClass(/field-invalid/);
    // Escribir en el campo
    await page.fill('#hu-resumen', 'Historia válida');
    await expect(page.locator('#hu-resumen')).not.toHaveClass(/field-invalid/);
  });

  test('botón se habilita al completar todos los campos requeridos', async ({ page }) => {
    await page.fill('#hu-resumen', 'Login de usuario');
    await page.fill('#hu-como', 'usuario registrado');
    await page.fill('#hu-quiero', 'iniciar sesión con email y contraseña');
    await page.fill('#hu-para', 'acceder a mi cuenta de forma segura');
    await expect(page.locator('#btn-crear-hu')).toBeEnabled();
  });

  test('tipo y prioridad tienen valores por defecto', async ({ page }) => {
    const tipo = await page.locator('#hu-tipo').inputValue();
    const prio = await page.locator('#hu-prioridad').inputValue();
    expect(tipo).toBeTruthy();
    expect(prio).toBeTruthy();
  });
});

// ── Creación exitosa ──────────────────────────────────────────────────────────

test.describe('Crear historia exitosamente', () => {
  async function fillAndSubmit(page, opts = {}) {
    await page.fill('#hu-resumen', opts.resumen ?? 'Autenticación de usuario');
    await page.fill('#hu-como', opts.como ?? 'usuario no autenticado');
    await page.fill('#hu-quiero', opts.quiero ?? 'iniciar sesión en la plataforma');
    await page.fill('#hu-para', opts.para ?? 'acceder a mis proyectos');
    if (opts.desc) await page.fill('#hu-desc', opts.desc);
    await page.locator('#btn-crear-hu').click();
  }

  test('crear historia redirige al detalle de la HU', async ({ page }) => {
    await fillAndSubmit(page);
    await expect(page).toHaveURL(/#\/historias\/HU-/);
  });

  test('la historia creada aparece en la lista de historias', async ({ page }) => {
    await fillAndSubmit(page, { resumen: 'Historia única de prueba' });
    await page.goto('/#/historias');
    await expect(page.locator('.hu-card, tr[data-id]').filter({ hasText: 'Historia única de prueba' })).toBeVisible();
  });

  test('la historia se crea con criterios Gherkin generados', async ({ page }) => {
    await fillAndSubmit(page);
    // Navegar al tab Criterios en el detalle
    await page.locator('[data-tab="criterios"]').click();
    await expect(page.locator('.gherkin-block').first()).toBeVisible();
    // Debe tener al menos los 4 escenarios base
    const criterios = page.locator('.gherkin-block');
    expect(await criterios.count()).toBeGreaterThanOrEqual(4);
  });

  test('la historia se crea con test cases generados', async ({ page }) => {
    await fillAndSubmit(page);
    await page.locator('[data-tab="testcases"]').click();
    await expect(page.locator('.tc-card').first()).toBeVisible();
    const tcs = page.locator('.tc-card');
    expect(await tcs.count()).toBeGreaterThan(0);
  });

  test('muestra toast de confirmación al crear', async ({ page }) => {
    await fillAndSubmit(page);
    const toast = page.locator('.toast-success, .toast');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  });

  test('descripción y etiquetas son opcionales', async ({ page }) => {
    await fillAndSubmit(page, { resumen: 'HU sin descripción ni etiquetas' });
    await expect(page).toHaveURL(/#\/historias\/HU-/);
  });
});

// ── Cancelar ──────────────────────────────────────────────────────────────────

test.describe('Cancelar creación', () => {
  test('el botón Cancelar vuelve a la lista de historias', async ({ page }) => {
    // El botón Cancelar usa onclick con window.location.hash
    const cancelBtn = page.locator('.form-actions button.btn-ghost, button[onclick*="historias"]').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await expect(page).toHaveURL(/#\/historias/);
  });
});
