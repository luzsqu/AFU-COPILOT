import { test, expect } from 'playwright/test';
import { SK, makeSeedData } from './helpers/seed.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, { key: SK, data: makeSeedData() });
  await page.goto('/#/projects');
  await expect(page.locator('.projects-grid')).toBeVisible();
});

// ── Vista de proyectos ────────────────────────────────────────────────────────

test.describe('Vista de proyectos', () => {
  test('muestra el proyecto de prueba en el grid', async ({ page }) => {
    await expect(page.locator('.project-card').filter({ hasText: 'Proyecto Test' })).toBeVisible();
  });

  test('muestra el card para crear nuevo proyecto', async ({ page }) => {
    await expect(page.locator('.project-card-new, #btn-new-project-card')).toBeVisible();
  });

  test('el proyecto activo tiene badge "Activo"', async ({ page }) => {
    const activeCard = page.locator('.project-card-active');
    await expect(activeCard).toBeVisible();
    await expect(activeCard.locator('.project-card-active-badge')).toBeVisible();
  });
});

// ── Modal de nuevo proyecto ───────────────────────────────────────────────────

test.describe('Modal nuevo proyecto', () => {
  async function openModal(page) {
    await page.locator('#btn-new-project').click();
    await expect(page.locator('#modal-project')).not.toHaveClass(/hidden/);
  }

  test('abre el modal al hacer clic en "+ Nuevo proyecto"', async ({ page }) => {
    await openModal(page);
    await expect(page.locator('#modal-project-title')).toHaveText('Nuevo proyecto');
  });

  test('muestra el selector de templates', async ({ page }) => {
    await openModal(page);
    await expect(page.locator('.template-grid')).toBeVisible();
    await expect(page.locator('.template-card')).toHaveCount(7); // 6 templates + "En blanco"
  });

  test('cierra el modal con el botón X', async ({ page }) => {
    await openModal(page);
    await page.locator('#btn-close-modal-project').click();
    await expect(page.locator('#modal-project')).toHaveClass(/hidden/);
  });

  test('cierra el modal con tecla Escape', async ({ page }) => {
    await openModal(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-project')).toHaveClass(/hidden/);
  });

  test('cierra el modal al clic en el backdrop', async ({ page }) => {
    await openModal(page);
    // Clic fuera del modal-box (en el overlay)
    await page.locator('#modal-project').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#modal-project')).toHaveClass(/hidden/);
  });

  test('no permite crear proyecto sin nombre', async ({ page }) => {
    await openModal(page);
    await page.locator('#form-project [type="submit"]').click();
    const error = page.locator('#proj-nombre.field-invalid, .form-error-msg');
    await expect(error.first()).toBeVisible();
  });
});

// ── Template selector ─────────────────────────────────────────────────────────

test.describe('Template selector', () => {
  async function openModal(page) {
    await page.locator('#btn-new-project').click();
    await expect(page.locator('#modal-project')).not.toHaveClass(/hidden/);
  }

  test('seleccionar un template muestra el preview', async ({ page }) => {
    await openModal(page);
    await page.locator('.template-card').filter({ hasText: 'Fintech' }).click();
    await expect(page.locator('#template-preview')).not.toHaveClass(/hidden/);
    await expect(page.locator('#template-preview')).toContainText('Fintech');
  });

  test('seleccionar template pre-carga la descripción', async ({ page }) => {
    await openModal(page);
    await page.locator('.template-card').filter({ hasText: 'E-commerce' }).click();
    const desc = await page.locator('#proj-desc').inputValue();
    expect(desc.length).toBeGreaterThan(0);
  });

  test('el template seleccionado tiene clase "selected"', async ({ page }) => {
    await openModal(page);
    const tplCard = page.locator('.template-card').filter({ hasText: 'Salud' });
    await tplCard.click();
    await expect(tplCard).toHaveClass(/selected/);
  });

  test('seleccionar "En blanco" oculta el preview', async ({ page }) => {
    await openModal(page);
    await page.locator('.template-card').filter({ hasText: 'Fintech' }).click();
    await expect(page.locator('#template-preview')).not.toHaveClass(/hidden/);
    await page.locator('.template-card-blank').click();
    await expect(page.locator('#template-preview')).toHaveClass(/hidden/);
  });
});

// ── Crear proyecto ────────────────────────────────────────────────────────────

test.describe('Crear proyecto', () => {
  async function openModal(page) {
    await page.locator('#btn-new-project').click();
  }

  test('crea proyecto sin template y redirige al dashboard', async ({ page }) => {
    await openModal(page);
    await page.fill('#proj-nombre', 'Mi Nuevo Proyecto');
    await page.fill('#proj-key', 'MNP');
    await page.locator('#form-project [type="submit"]').click();
    await expect(page).toHaveURL(/#\/dashboard/);
  });

  test('crea proyecto con template Fintech y carga contexto IA', async ({ page }) => {
    await openModal(page);
    await page.locator('.template-card').filter({ hasText: 'Fintech' }).click();
    await page.fill('#proj-nombre', 'Proyecto Fintech Test');
    await page.locator('#form-project [type="submit"]').click();
    await expect(page).toHaveURL(/#\/dashboard/);

    // Verificar que el contexto fue guardado
    const data = await page.evaluate((sk) => JSON.parse(localStorage.getItem(sk)), SK);
    const proyActivo = data.proyectos.find(p => p.id === data.proyectoActivoId);
    expect(proyActivo.contexto.length).toBeGreaterThan(0);
    expect(proyActivo.contexto[0].nombre).toContain('Fintech');
  });
});

// ── Editar proyecto ───────────────────────────────────────────────────────────

test.describe('Editar proyecto', () => {
  test('abre modal de edición con datos pre-cargados', async ({ page }) => {
    await page.locator('.project-card').filter({ hasText: 'Proyecto Test' })
      .locator('[data-edit-id], .proj-edit-btn').click();
    await expect(page.locator('#modal-project-title')).toHaveText('Editar proyecto');
    await expect(page.locator('#proj-nombre')).toHaveValue('Proyecto Test');
  });

  test('no muestra template selector al editar', async ({ page }) => {
    await page.locator('.project-card').filter({ hasText: 'Proyecto Test' })
      .locator('[data-edit-id], .proj-edit-btn').click();
    await expect(page.locator('#template-selector-wrap')).toHaveCSS('display', 'none');
  });
});
