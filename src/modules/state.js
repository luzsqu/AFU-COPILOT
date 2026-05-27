export const state = {
  usuario: null,
  proyectos: [],
  historias: [],
  epicas: [],
  proyectoActivoId: null,
  idActual: null,
  tabActual: 'resumen',
  imagenBase64: null,
  imagenType: null,
  modoSeleccion: false,
  seleccionadas: new Set(),
  apiCfg: null,
  jiraCfg: null,
  prefs: { vista: 'cards', darkMode: false }
};

export const SK = 'analista-hu-v2';
export const SK_API = 'analista-api-cfg-v2';
export const SK_JIRA = 'analista-jira-cfg-v2';

export const EPIC_COLORS = [
  '#4f46e5','#7c3aed','#059669','#d97706',
  '#dc2626','#0891b2','#be185d','#4b5563'
];

export const MODELS = {
  groq:   ['meta-llama/llama-4-scout-17b-16e-instruct','llama-3.3-70b-versatile','llama-3.1-8b-instant'],
  claude: ['claude-opus-4-7','claude-sonnet-4-6','claude-haiku-4-5-20251001'],
  openai: ['gpt-4o','gpt-4o-mini'],
  grok:   ['grok-2-vision-1212','grok-2-1212','grok-beta']
};

export const TC_TIPOS = {
  positivo:    { label: 'POSITIVO',    bg: '#d1fae5', color: '#065f46' },
  negativo:    { label: 'NEGATIVO',    bg: '#fee2e2', color: '#991b1b' },
  boundary:    { label: 'BOUNDARY',    bg: '#fef3c7', color: '#92400e' },
  nf:          { label: 'NO FUNC.',    bg: '#dbeafe', color: '#1e40af' },
  condicional: { label: 'CONDICIONAL', bg: '#f3e8ff', color: '#6d28d9' }
};

export const JIRA_TIPOS = ['Story','Task','Bug','Epic','Sub-task'];
export const JIRA_PRIORIDADES = ['Highest','High','Medium','Low','Lowest'];

export const PROYECTOS_DEFAULT = [
  { id:'proj-ecommerce',  nombre:'E-commerce',          descripcion:'Plataforma de ventas en línea con carrito y checkout',    jiraKey:'EC',  jiraUrl:'', creado: new Date().toISOString() },
  { id:'proj-banca',      nombre:'Banca Móvil',          descripcion:'App de banca digital para usuarios retail',               jiraKey:'BM',  jiraUrl:'', creado: new Date().toISOString() },
  { id:'proj-edu',        nombre:'Plataforma Educativa', descripcion:'LMS con cursos, evaluaciones y certificaciones',          jiraKey:'EDU', jiraUrl:'', creado: new Date().toISOString() },
  { id:'proj-logistica',  nombre:'App Logística',        descripcion:'Gestión de envíos, rutas y entregas en tiempo real',      jiraKey:'LOG', jiraUrl:'', creado: new Date().toISOString() }
];
