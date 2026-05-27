import { describe, it, expect, beforeEach } from 'vitest';
import { state, SK, SK_API, SK_JIRA, PROYECTOS_DEFAULT } from '../state.js';
import {
  cargar, guardar,
  cargarConfigIA, guardarConfigIA, borrarConfigIA,
  cargarConfigJira, guardarConfigJira, borrarConfigJira,
} from '../storage.js';

function resetState() {
  state.usuario          = null;
  state.proyectos        = [];
  state.historias        = [];
  state.epicas           = [];
  state.proyectoActivoId = null;
  state.apiCfg           = null;
  state.jiraCfg          = null;
  state.prefs            = { vista: 'cards', darkMode: false };
}

beforeEach(() => {
  localStorage.clear();
  resetState();
});

// ── cargar() ──────────────────────────────────────────────────────────────────

describe('cargar()', () => {
  it('sets default projects when localStorage is empty', () => {
    cargar();
    expect(state.proyectos).toHaveLength(PROYECTOS_DEFAULT.length);
    expect(state.proyectos[0].id).toBe(PROYECTOS_DEFAULT[0].id);
  });

  it('restores full state from localStorage', () => {
    const data = {
      usuario:          { username: 'alice', passwordHash: 'abc' },
      proyectos:        [{ id: 'p1', nombre: 'Test' }],
      historias:        [{ id: 'HU-1', resumen: 'login' }],
      epicas:           [{ id: 'ep1' }],
      proyectoActivoId: 'p1',
      prefs:            { vista: 'lista', darkMode: true },
    };
    localStorage.setItem(SK, JSON.stringify(data));

    cargar();

    expect(state.usuario).toEqual(data.usuario);
    expect(state.proyectos).toEqual(data.proyectos);
    expect(state.historias).toEqual(data.historias);
    expect(state.epicas).toEqual(data.epicas);
    expect(state.proyectoActivoId).toBe('p1');
    expect(state.prefs.vista).toBe('lista');
    expect(state.prefs.darkMode).toBe(true);
  });

  it('sets default projects when stored proyectos is empty array', () => {
    localStorage.setItem(SK, JSON.stringify({ proyectos: [], historias: [] }));
    cargar();
    expect(state.proyectos).toHaveLength(PROYECTOS_DEFAULT.length);
  });

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem(SK, 'NOT_JSON{{{{');
    cargar();
    expect(state.proyectos).toHaveLength(PROYECTOS_DEFAULT.length);
    expect(state.historias).toEqual([]);
  });

  it('uses empty arrays as fallback for missing historias / epicas', () => {
    localStorage.setItem(SK, JSON.stringify({
      usuario: { username: 'bob' },
      proyectos: [{ id: 'p1' }],
    }));
    cargar();
    expect(state.historias).toEqual([]);
    expect(state.epicas).toEqual([]);
    expect(state.proyectoActivoId).toBeNull();
  });

  it('applies default prefs when prefs block is absent', () => {
    localStorage.setItem(SK, JSON.stringify({ proyectos: [{ id: 'p1' }] }));
    cargar();
    expect(state.prefs.vista).toBe('cards');
    expect(state.prefs.darkMode).toBe(false);
  });
});

// ── guardar() ─────────────────────────────────────────────────────────────────

describe('guardar()', () => {
  it('persists state to localStorage under SK key', () => {
    state.usuario          = { username: 'bob' };
    state.proyectos        = [{ id: 'p2' }];
    state.historias        = [];
    state.proyectoActivoId = 'p2';

    guardar();

    const saved = JSON.parse(localStorage.getItem(SK));
    expect(saved.usuario).toEqual({ username: 'bob' });
    expect(saved.proyectos).toEqual([{ id: 'p2' }]);
    expect(saved.proyectoActivoId).toBe('p2');
  });

  it('persists prefs', () => {
    state.prefs = { vista: 'lista', darkMode: true };
    guardar();
    const saved = JSON.parse(localStorage.getItem(SK));
    expect(saved.prefs).toEqual({ vista: 'lista', darkMode: true });
  });

  it('round-trips: guardar then cargar restores state', () => {
    state.usuario          = { username: 'carol', passwordHash: 'xyz' };
    state.proyectos        = [{ id: 'px', nombre: 'X' }];
    state.historias        = [{ id: 'HU-A', resumen: 'test' }];
    state.proyectoActivoId = 'px';

    guardar();
    resetState();
    cargar();

    expect(state.usuario.username).toBe('carol');
    expect(state.proyectos[0].id).toBe('px');
    expect(state.historias[0].resumen).toBe('test');
    expect(state.proyectoActivoId).toBe('px');
  });

  it('does not throw when called with empty state', () => {
    expect(() => guardar()).not.toThrow();
  });

  it('does not propagate QuotaExceededError — handles it internally', () => {
    // Simular cuota de localStorage llena
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(err, 'code', { value: 22 });
      throw err;
    });

    // guardar() no debe propagar el error — lo maneja con un toast interno
    expect(() => guardar()).not.toThrow();
  });
});

// ── cargarConfigIA() ──────────────────────────────────────────────────────────

describe('cargarConfigIA()', () => {
  it('leaves apiCfg null when key is absent', () => {
    cargarConfigIA();
    expect(state.apiCfg).toBeNull();
  });

  it('restores apiCfg from localStorage', () => {
    const cfg = { provider: 'groq', model: 'llama-3.3-70b-versatile', key: 'gsk_test' };
    localStorage.setItem(SK_API, JSON.stringify(cfg));
    cargarConfigIA();
    expect(state.apiCfg).toEqual(cfg);
  });

  it('sets apiCfg to null on invalid JSON', () => {
    localStorage.setItem(SK_API, '{broken::json}');
    cargarConfigIA();
    expect(state.apiCfg).toBeNull();
  });
});

// ── guardarConfigIA() ─────────────────────────────────────────────────────────

describe('guardarConfigIA(cfg)', () => {
  it('sets state.apiCfg and persists to localStorage', () => {
    const cfg = { provider: 'claude', model: 'claude-sonnet-4-6', key: 'sk_test' };
    guardarConfigIA(cfg);
    expect(state.apiCfg).toEqual(cfg);
    expect(JSON.parse(localStorage.getItem(SK_API))).toEqual(cfg);
  });
});

// ── borrarConfigIA() ──────────────────────────────────────────────────────────

describe('borrarConfigIA()', () => {
  it('nulls state.apiCfg and removes key from localStorage', () => {
    localStorage.setItem(SK_API, JSON.stringify({ key: 'x' }));
    state.apiCfg = { key: 'x' };
    borrarConfigIA();
    expect(state.apiCfg).toBeNull();
    expect(localStorage.getItem(SK_API)).toBeNull();
  });
});

// ── cargarConfigJira() ────────────────────────────────────────────────────────

describe('cargarConfigJira()', () => {
  it('leaves jiraCfg null when key is absent', () => {
    cargarConfigJira();
    expect(state.jiraCfg).toBeNull();
  });

  it('restores jiraCfg from localStorage', () => {
    const cfg = { baseUrl: 'https://myco.atlassian.net', email: 'a@b.com', token: 'tok' };
    localStorage.setItem(SK_JIRA, JSON.stringify(cfg));
    cargarConfigJira();
    expect(state.jiraCfg).toEqual(cfg);
  });

  it('sets jiraCfg to null on invalid JSON', () => {
    localStorage.setItem(SK_JIRA, '<<<not json');
    cargarConfigJira();
    expect(state.jiraCfg).toBeNull();
  });
});

// ── guardarConfigJira() ───────────────────────────────────────────────────────

describe('guardarConfigJira(cfg)', () => {
  it('sets state.jiraCfg and persists to localStorage', () => {
    const cfg = { baseUrl: 'https://x.atlassian.net', email: 'x@y.com', token: 'abc' };
    guardarConfigJira(cfg);
    expect(state.jiraCfg).toEqual(cfg);
    expect(JSON.parse(localStorage.getItem(SK_JIRA))).toEqual(cfg);
  });
});

// ── borrarConfigJira() ────────────────────────────────────────────────────────

describe('borrarConfigJira()', () => {
  it('nulls state.jiraCfg and removes key from localStorage', () => {
    localStorage.setItem(SK_JIRA, JSON.stringify({ token: 'tok' }));
    state.jiraCfg = { token: 'tok' };
    borrarConfigJira();
    expect(state.jiraCfg).toBeNull();
    expect(localStorage.getItem(SK_JIRA)).toBeNull();
  });
});
