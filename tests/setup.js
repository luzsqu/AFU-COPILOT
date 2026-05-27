/**
 * Vitest global setup — se ejecuta antes de cada archivo de test.
 * Proporciona un mock de localStorage compatible con jsdom.
 */
import { beforeEach, vi } from 'vitest';

// ── Mock de localStorage ───────────────────────────────────────────────────────
// jsdom ya incluye localStorage, pero lo reemplazamos con uno controlable
// para poder espiar setItem y simular QuotaExceededError.
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (k)    => store[k] !== undefined ? store[k] : null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k)    => { delete store[k]; },
    clear:      ()     => { store = {}; },
    get length()       { return Object.keys(store).length; },
    key:        (i)    => Object.keys(store)[i] ?? null,
    // Exponer store para tests que necesiten inspeccionar directamente
    _store: () => store,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ── Reset automático antes de cada test ───────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks(); // limpia todos los spies/mocks de vi.spyOn
});
