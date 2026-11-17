/* Cache only public interface files within this worker's own project scope. */
const ROOT = new URL(self.registration.scope);
const ROOT_PATH = ROOT.pathname;
const CACHE = `daya-public-v6:${ROOT_PATH}`;
const PAGES_ASSETS = ["/Dayas/pages-config.js","/Dayas/pages-api.js"]; // Filled only in the GitHub Pages build.
const ASSETS = ['', 'index.html', 'tienda.html', 'contacto.html', 'studio.html', 'daya.css', 'store.css', 'store.js', 'experience.js', 'contact-config.js', 'gestion-redirect.js', 'styles.css', 'studio-refine.css', 'app.js', 'assets/fonts.css', 'assets/daya-mark.svg', 'assets/daya-wordmark.svg', 'assets/logo.svg'].map(file => new URL(file, ROOT).pathname).concat(PAGES_ASSETS);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && ((key.startsWith('daya-public-') && key.endsWith(`:${ROOT_PATH}`)) || (ROOT_PATH === '/' && (key === 'daya-v3-static' || /^daya-public-v\d+$/.test(key))))).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT_PATH)) return;
  const relative = url.pathname.slice(ROOT_PATH.length);
  if (relative.startsWith('api/') || relative.startsWith('gestion/') || url.pathname.startsWith('/api/')) return;
  if (!ASSETS.includes(url.pathname) && !relative.startsWith('assets/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}); }
    return response;
  }).catch(async () => await caches.match(event.request) || new Response('Sin conexión. Vuelve a intentarlo cuando recuperes internet.', { status: 503 })));
});
