export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pct(items) {
  if (!items || !items.length) return 0;
  return Math.round(items.filter(i => i.checked).length / items.length * 100);
}

export function generarId() {
  // timestamp base36 + 4 chars random → colisiones prácticamente imposibles
  return 'HU-' + Date.now().toString(36).toUpperCase()
    + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function generarTCId(huId, n) {
  return `TC-${huId}-${String(n).padStart(3, '0')}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}
