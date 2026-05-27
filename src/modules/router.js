import { state } from './state.js';
import { renderLogin }     from './auth.js';
import { renderProjects }  from './projects.js';
import { renderDashboard, renderHistoriasList, renderHistoriaForm,
         renderImageForm, renderHistoriaDetail, renderHistoriaEdit,
         renderFlujosForm, renderAPIImportForm } from './ui.js';
import { renderSidebar, updateBreadcrumb } from './sidebar.js';
import { renderConfig } from './config.js';

const routes = {
  '/login':                { render: renderLogin,         auth: false, sidebar: false },
  '/projects':             { render: renderProjects,      auth: true,  sidebar: false },
  '/dashboard':            { render: renderDashboard,     auth: true,  sidebar: true  },
  '/historias':            { render: renderHistoriasList, auth: true,  sidebar: true  },
  '/historias/nueva':      { render: renderHistoriaForm,  auth: true,  sidebar: true  },
  '/historias/nueva-imagen': { render: renderImageForm,      auth: true,  sidebar: true  },
  '/historias/nueva-api':  { render: renderAPIImportForm,  auth: true,  sidebar: true  },
  '/flujos':               { render: renderFlujosForm,      auth: true,  sidebar: true  },
  '/config':               { render: renderConfig,        auth: true,  sidebar: true  },
};

const dynamicRoutes = {
  '/historias/:id':        { render: renderHistoriaDetail, auth: true, sidebar: true },
  '/historias/:id/editar': { render: renderHistoriaEdit,   auth: true, sidebar: true }
};

function parseHash() {
  const h = location.hash.replace('#', '') || '/login';
  const editMatch = h.match(/^\/historias\/([^/]+)\/editar$/);
  if (editMatch) return { path: '/historias/:id/editar', id: editMatch[1] };
  if (h.startsWith('/historias/') && h !== '/historias/nueva' && h !== '/historias/nueva-imagen' && h !== '/historias/nueva-api') {
    const id = h.replace('/historias/', '');
    return { path: '/historias/:id', id };
  }
  return { path: h };
}

export function navigate(path) {
  location.hash = '#' + path;
}

export function router() {
  const { path, id } = parseHash();
  const route = routes[path] || dynamicRoutes[path] || null;

  if (!route) { navigate('/login'); return; }

  if (route.auth && !state.usuario) { navigate('/login'); return; }
  if (!route.auth && state.usuario && path === '/login') { navigate(state.proyectoActivoId ? '/dashboard' : '/projects'); return; }

  const sidebar     = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const view        = document.getElementById('view');

  if (route.sidebar && state.proyectoActivoId) {
    sidebar.classList.remove('hidden');
    mainContent.classList.add('with-sidebar');
    mainContent.classList.remove('layout-auth');
    renderSidebar(path);
  } else {
    sidebar.classList.add('hidden');
    mainContent.classList.remove('with-sidebar');
    mainContent.classList.toggle('layout-auth', path === '/login');
  }

  updateBreadcrumb(path, id);
  route.render(id);

  // Page entry animation
  if (view) {
    view.classList.remove('view-animate');
    void view.offsetWidth;
    view.classList.add('view-animate');
  }
}

export function initRouter() {
  window.addEventListener('hashchange', router);
  router();
}
