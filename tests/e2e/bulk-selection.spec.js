import { test, expect } from 'playwright/test';

const SK = 'analista-hu-v2';

function makeSeedData() {
  const now = new Date().toISOString();
  const stories = Array.from({ length: 5 }, (_, i) => ({
    id: `HU-TEST-00${i + 1}`,
    proyectoId: 'proj-ecommerce',
    tipo: 'Story',
    resumen: `Historia de prueba ${i + 1}`,
    como: 'usuario de prueba',
    quiero: 'realizar la acción de prueba',
    para: 'verificar el sistema',
    descripcion: '',
    etiquetas: [],
    prioridad: 'Medium',
    storyPoints: null,
    links: [],
    criterios: [],
    testCases: [],
    imagenes: [],
    creadoEn: now,
    actualizado: now,
    origen: 'manual',
  }));

  return {
    // password "test" → btoa(unescape(encodeURIComponent("test"))) = btoa("test")
    usuario: { username: 'tester', passwordHash: 'dGVzdA==' },
    proyectos: [
      { id: 'proj-ecommerce', nombre: 'E-commerce', descripcion: 'Proyecto de prueba', jiraKey: 'EC', jiraUrl: '', creado: now },
    ],
    historias: stories,
    epicas: [],
    proyectoActivoId: 'proj-ecommerce',
    prefs: { vista: 'cards', darkMode: false },
  };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, { key: SK, data: makeSeedData() });
});

// ── Entering / exiting selection mode ─────────────────────────────────────────

test('enters and exits selection mode', async ({ page }) => {
  await page.goto('/#/historias');

  await expect(page.locator('.historias-wrap')).toBeVisible();

  const selBtn = page.locator('#btn-modo-sel');
  await expect(selBtn).toHaveText('Seleccionar');

  await selBtn.click();

  await expect(page.locator('#sel-bar')).toBeVisible();
  await expect(selBtn).toHaveText('Cancelar');
  await expect(page.locator('#historias-content')).toHaveClass(/selection-mode/);

  await selBtn.click();

  await expect(page.locator('#sel-bar')).toHaveClass(/hidden/);
  await expect(selBtn).toHaveText('Seleccionar');
  await expect(page.locator('#historias-content')).not.toHaveClass(/selection-mode/);
});

// ── Single card selection / deselection ───────────────────────────────────────

test('selects and deselects a card', async ({ page }) => {
  await page.goto('/#/historias');
  await page.locator('#btn-modo-sel').click();

  const firstCard = page.locator('.hu-card').first();
  await firstCard.click();

  await expect(firstCard).toHaveClass(/selected/);
  await expect(page.locator('#sel-count')).toHaveText('1 seleccionada');

  await firstCard.click();
  await expect(firstCard).not.toHaveClass(/selected/);
  await expect(page.locator('#sel-count')).toHaveText('0 seleccionadas');
});

// ── Multi-selection chips ─────────────────────────────────────────────────────

test('shows chips for selected stories', async ({ page }) => {
  await page.goto('/#/historias');
  await page.locator('#btn-modo-sel').click();

  const cards = page.locator('.hu-card');
  await cards.nth(0).click();
  await cards.nth(1).click();
  await cards.nth(2).click();

  await expect(page.locator('#sel-count')).toHaveText('3 seleccionadas');
  await expect(page.locator('.sel-chip')).toHaveCount(3);
});

// ── Select-all via table view ─────────────────────────────────────────────────

test('select-all checkbox selects and deselects all rows in table view', async ({ page }) => {
  await page.goto('/#/historias');

  await page.locator('.vista-btn[data-vista="lista"]').click();
  await page.locator('#btn-modo-sel').click();

  const checkAll = page.locator('#check-all');
  await checkAll.click();

  const rows = page.locator('tr[data-id]');
  const count = await rows.count();
  expect(count).toBe(5);

  await expect(page.locator('#sel-count')).toContainText(`${count} seleccionada`);

  // Each row checkbox should be checked
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).locator('.row-check')).toBeChecked();
  }

  // Deselect all
  await checkAll.click();
  await expect(page.locator('#sel-count')).toHaveText('0 seleccionadas');
});

// ── Individual row checkbox in table view ─────────────────────────────────────

test('row checkbox toggles selection in table view', async ({ page }) => {
  await page.goto('/#/historias');
  await page.locator('.vista-btn[data-vista="lista"]').click();
  await page.locator('#btn-modo-sel').click();

  const firstRowCheck = page.locator('tr[data-id]').first().locator('.row-check');
  await firstRowCheck.click();

  await expect(page.locator('#sel-count')).toHaveText('1 seleccionada');
  await expect(firstRowCheck).toBeChecked();

  await firstRowCheck.click();
  await expect(page.locator('#sel-count')).toHaveText('0 seleccionadas');
});

// ── Bulk delete with confirm ───────────────────────────────────────────────────

test('bulk delete shows confirm modal and removes selected stories', async ({ page }) => {
  await page.goto('/#/historias');
  await page.locator('#btn-modo-sel').click();

  const cards = page.locator('.hu-card');
  await cards.nth(0).click();
  await cards.nth(1).click();

  await expect(page.locator('#sel-count')).toHaveText('2 seleccionadas');

  await page.locator('#btn-sel-del').click();

  await expect(page.locator('#confirm-modal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#confirm-title')).toHaveText('¿Eliminar seleccionadas?');

  await page.locator('#confirm-ok').click();

  await expect(page.locator('.hu-card')).toHaveCount(3);
  // Selection is cleared but modoSeleccion stays active — bar remains visible with count 0
  await expect(page.locator('#sel-count')).toHaveText('0 seleccionadas');
});

// ── Bulk delete undo ──────────────────────────────────────────────────────────

test('can undo bulk delete via toast action', async ({ page }) => {
  await page.goto('/#/historias');
  await page.locator('#btn-modo-sel').click();

  await page.locator('.hu-card').first().click();
  await page.locator('#btn-sel-del').click();
  await page.locator('#confirm-ok').click();

  await expect(page.locator('.hu-card')).toHaveCount(4);

  // Toast with undo action should appear
  const undoBtn = page.locator('.toast-action-btn');
  await expect(undoBtn).toBeVisible();
  await undoBtn.click();

  await expect(page.locator('.hu-card')).toHaveCount(5);
});

// ── Selection persists across view switch ─────────────────────────────────────

test('selection state persists when switching between cards and list views', async ({ page }) => {
  await page.goto('/#/historias');
  await page.locator('#btn-modo-sel').click();

  await page.locator('.hu-card').nth(0).click();
  await page.locator('.hu-card').nth(1).click();
  await expect(page.locator('#sel-count')).toHaveText('2 seleccionadas');

  // Switch to list view
  await page.locator('.vista-btn[data-vista="lista"]').click();

  // Count should be preserved
  await expect(page.locator('#sel-count')).toHaveText('2 seleccionadas');

  // The two selected rows should show as checked
  const checked = page.locator('tr[data-id].row-selected');
  await expect(checked).toHaveCount(2);
});
