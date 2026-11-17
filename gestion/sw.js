/* Public management interface only. Never cache API responses or private state. */
const SCOPE = new URL(self.registration.scope);
const ROOT = new URL('../', SCOPE);
const CACHE = `daya-management-v6:${ROOT.pathname}`;
const PAGES_ASSETS = ["/Dayas/pages-config.js","/Dayas/pages-api.js"]; // Filled only in the GitHub Pages build.
const SHELL = ['gestion/', 'gestion/app.css', 'gestion/app.js', 'gestion/core.js', 'gestion/auth-bridge.js', 'assets/fonts.css', 'assets/daya-mark.svg', 'assets/daya-wordmark.svg', 'gestion/assets/logo.svg', 'gestion/assets/icon-192.png'].map(file => new URL(file, ROOT).pathname).concat(PAGES_ASSETS);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && ((key.startsWith('daya-management-') && key.endsWith(`:${ROOT.pathname}`)) || (ROOT.pathname === '/' && (/^daya-management-v\d+$/.test(key) || key.startsWith('daya-cloud-shell-'))))).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  const relative = url.pathname.slice(ROOT.pathname.length);
  if (url.pathname.startsWith('/api/') || relative.startsWith('api/')) return;
  if (!SHELL.includes(url.pathname) && !relative.startsWith('gestion/assets/') && !relative.startsWith('assets/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}); }
    return response;
  }).catch(async () => await caches.match(event.request) || new Response('Sin conexión al servidor de Daya.', { status: 503 })));
});
