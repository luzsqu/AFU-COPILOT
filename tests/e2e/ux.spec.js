import { test, expect } from 'playwright/test';
import { SK, makeSeedData } from './helpers/seed.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, { key: SK, data: makeSeedData() });
  await page.goto('/#/dashboard');
  await expect(page.locator('#sidebar')).toBeVisible();
});

// ── Sistema de toasts ─────────────────────────────────────────────────────────

test.describe('Sistema de toasts', () => {
  async function dispararToast(page, tipo = 'success', msg = 'Mensaje de prueba') {
    await page.evaluate(({ t, m }) => {
      import('/src/modules/toast.js').then(({ toast }) => toast(m, t));
    }, { t: tipo, m: msg });
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 3000 });
  }

  test('muestra un toast de tipo success', async ({ page }) => {
    await dispararToast(page, 'success', 'Operación exitosa');
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Operación exitosa');
  });

  test('muestra un toast de tipo error', async ({ page }) => {
    await dispararToast(page, 'error', 'Error de conexión');
    await expect(page.locator('.toast-error')).toBeVisible();
  });

  test('muestra un toast de tipo warn', async ({ page }) => {
    await dispararToast(page, 'warn', 'Advertencia del sistema');
    await expect(page.locator('.toast-warn')).toBeVisible();
  });

  test('muestra un toast de tipo info', async ({ page }) => {
    await dispararToast(page, 'info', 'Información importante');
    await expect(page.locator('.toast-info')).toBeVisible();
  });

  test('el toast tiene botón de cierre manual', async ({ page }) => {
    await dispararToast(page, 'success', 'Toast con cierre');
    await expect(page.locator('.toast-close').first()).toBeVisible();
  });

  test('el botón ✕ cierra el toast inmediatamente', async ({ page }) => {
    await dispararToast(page, 'success', 'Toast a cerrar');
    await page.locator('.toast-close').first().click();
    await expect(page.locator('.toast')).not.toBeVisible({ timeout: 1000 });
  });

  test('varios toasts se apilan sin solaparse', async ({ page }) => {
    await page.evaluate(() => {
      import('/src/modules/toast.js').then(({ toast }) => {
        toast('Toast 1', 'success');
        toast('Toast 2', 'info');
        toast('Toast 3', 'warn');
      });
    });
    await expect(page.locator('.toast')).toHaveCount(3, { timeout: 3000 });
  });

  test('el toast tiene barra de progreso', async ({ page }) => {
    await dispararToast(page, 'success', 'Con progreso');
    await expect(page.locator('.toast-progress').first()).toBeVisible();
  });
});

// ── Cierre de modales ─────────────────────────────────────────────────────────

test.describe('Cierre de modales', () => {
  async function openConfirmModal(page) {
    // Entrar en modo selección y borrar para abrir el confirm modal
    await page.goto('/#/historias');
    await page.locator('#btn-modo-sel').click();
    await page.locator('.hu-card').first().click();
    await page.locator('#btn-sel-del').click();
    await expect(page.locator('#confirm-modal')).not.toHaveClass(/hidden/);
  }

  test('modal de confirmación cierra con Escape', async ({ page }) => {
    await openConfirmModal(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#confirm-modal')).toHaveClass(/hidden/);
  });

  test('modal de confirmación cierra al clic en el backdrop', async ({ page }) => {
    await openConfirmModal(page);
    await page.locator('#confirm-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#confirm-modal')).toHaveClass(/hidden/);
  });

  test('modal de proyectos cierra con Escape', async ({ page }) => {
    await page.goto('/#/projects');
    await page.locator('#btn-new-project').click();
    await expect(page.locator('#modal-project')).not.toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-project')).toHaveClass(/hidden/);
  });

  test('modal de proyectos cierra al clic en backdrop', async ({ page }) => {
    await page.goto('/#/projects');
    await page.locator('#btn-new-project').click();
    await expect(page.locator('#modal-project')).not.toHaveClass(/hidden/);
    await page.locator('#modal-project').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#modal-project')).toHaveClass(/hidden/);
  });
});

// ── Modo oscuro ───────────────────────────────────────────────────────────────

test.describe('Toggle modo oscuro', () => {
  test('el botón de modo oscuro existe en el sidebar', async ({ page }) => {
    await expect(page.locator('#btn-dark-mode')).toBeVisible();
  });

  test('activar modo oscuro agrega clase "dark" al html', async ({ page }) => {
    await page.locator('#btn-dark-mode').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('el botón cambia de texto al activar modo oscuro', async ({ page }) => {
    await expect(page.locator('#btn-dark-mode')).toContainText('Modo oscuro');
    await page.locator('#btn-dark-mode').click();
    await expect(page.locator('#btn-dark-mode')).toContainText('Modo claro');
  });

  test('desactivar modo oscuro quita la clase "dark"', async ({ page }) => {
    await page.locator('#btn-dark-mode').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.locator('#btn-dark-mode').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('la preferencia de modo oscuro se guarda en localStorage', async ({ page }) => {
    await page.locator('#btn-dark-mode').click();
    // Verificar que darkMode quedó en true en el storage
    const dark = await page.evaluate((sk) => {
      const d = JSON.parse(localStorage.getItem(sk));
      return d?.prefs?.darkMode;
    }, SK);
    expect(dark).toBe(true);
  });
});

// ── Command Palette ───────────────────────────────────────────────────────────

test.describe('Command Palette', () => {
  test('abre la paleta de comandos con botón del sidebar', async ({ page }) => {
    await page.locator('#btn-open-palette').click();
    await expect(page.locator('#cmd-palette')).not.toHaveClass(/hidden/);
  });

  test('el input de la paleta recibe foco al abrirse', async ({ page }) => {
    await page.locator('#btn-open-palette').click();
    await expect(page.locator('#palette-input')).toBeFocused();
  });

  test('cierra la paleta con Escape', async ({ page }) => {
    await page.locator('#btn-open-palette').click();
    await expect(page.locator('#cmd-palette')).not.toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#cmd-palette')).toHaveClass(/hidden/);
  });

  test('filtra resultados al escribir en la paleta', async ({ page }) => {
    await page.locator('#btn-open-palette').click();
    await page.fill('#palette-input', 'hist');
    const items = page.locator('.palette-item');
    await expect(items.first()).toBeVisible();
  });
});

// ── Sidebar navigation ────────────────────────────────────────────────────────

test.describe('Navegación por sidebar', () => {
  const NAV_ITEMS = [
    { selector: 'a[href="#/dashboard"]', url: /#\/dashboard/ },
    { selector: 'a[href="#/historias"]', url: /#\/historias/ },
    { selector: 'a[href="#/flujos"]',    url: /#\/flujos/ },
    { selector: 'a[href="#/config"]',    url: /#\/config/ },
  ];

  for (const { selector, url } of NAV_ITEMS) {
    test(`navega a ${selector}`, async ({ page }) => {
      await page.locator(selector).click();
      await expect(page).toHaveURL(url);
    });
  }

  test('el ítem activo tiene clase "active" en el sidebar', async ({ page }) => {
    await expect(page.locator('a[href="#/dashboard"].active')).toBeVisible();
  });

  test('muestra el nombre del proyecto activo en el sidebar', async ({ page }) => {
    await expect(page.locator('.sb-project-name')).toContainText('Proyecto Test');
  });
});

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

test.describe('Breadcrumbs', () => {
  test('muestra breadcrumb en la lista de historias', async ({ page }) => {
    await page.goto('/#/historias');
    await expect(page.locator('.breadcrumbs')).toBeVisible();
    await expect(page.locator('.bc-current')).toContainText('Historias');
  });

  test('muestra breadcrumb en el detalle de una historia', async ({ page }) => {
    await page.goto('/#/historias/HU-TEST-001');
    await expect(page.locator('.breadcrumbs')).toBeVisible();
    await expect(page.locator('.bc-link').first()).toBeVisible();
    await expect(page.locator('.bc-current')).toContainText('HU-TEST-001');
  });

  test('el link del breadcrumb navega correctamente', async ({ page }) => {
    await page.goto('/#/historias/HU-TEST-001');
    await page.locator('.bc-link[href="#/historias"]').click();
    await expect(page).toHaveURL(/#\/historias/);
  });
});
