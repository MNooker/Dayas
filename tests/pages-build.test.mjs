import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, mkdir, readFile, writeFile, readdir, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const project = path.resolve(import.meta.dirname, '..');
const base = '/Dayas/';
const origin = 'https://mnooker.github.io';
async function list(directory) { const result = []; for (const entry of await readdir(directory, { withFileTypes: true })) { const file = path.join(directory, entry.name); if (entry.isDirectory()) result.push(...await list(file)); else result.push(file); } return result; }
async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'daya-pages-'));
  await cp(path.join(project, 'public'), path.join(directory, 'public'), { recursive: true });
  await mkdir(path.join(directory, 'scripts')); await mkdir(path.join(directory, 'worker'));
  await cp(path.join(project, 'scripts/build-pages.mjs'), path.join(directory, 'scripts/build-pages.mjs'));
  await cp(path.join(project, 'worker/review-sample.json'), path.join(directory, 'worker/review-sample.json'));
  try { await access(path.join(directory, 'public/pages-api.js')); } catch { await writeFile(path.join(directory, 'public/pages-api.js'), '/* transport fixture */'); }
  return directory;
}
function build(directory, args = []) { return spawnSync(process.execPath, ['scripts/build-pages.mjs', ...args], { cwd: directory, encoding: 'utf8', env: { ...process.env, PAGES_BASE: base, PAGES_OUT_DIR: '_site' } }); }
async function resolveReference(output, filename, reference) {
  if (!reference || reference.startsWith('#') || /^(?:data:|mailto:|tel:|javascript:)/i.test(reference)) return;
  const url = new URL(reference.replaceAll('&amp;', '&'), origin + base + filename);
  if (url.origin !== origin) return;
  assert.ok(url.pathname.startsWith(base), `${filename}: ${reference} escapes the GitHub Pages project`);
  const relative = decodeURIComponent(url.pathname.slice(base.length));
  const file = path.join(output, relative.endsWith('/') || !relative ? relative + 'index.html' : relative);
  await assert.doesNotReject(access(file), `${filename}: ${reference} must resolve to an emitted file`);
}

test('Pages build emits a complete project-scoped static site without source/configuration leaks', async t => {
  const directory = await fixture(); t.after(() => rm(directory, { recursive: true, force: true }));
  const sourceApp = await readFile(path.join(directory, 'public/gestion/app.js'), 'utf8');
  await writeFile(path.join(directory, 'public/pages-routes.js'), `const delimiter='/'; const endpoint='/api/catalog'; const script='/store.js'; const unrelated='/storeXjs';`);
  const result = build(directory); assert.equal(result.status, 0, result.stderr);
  const output = path.join(directory, '_site'); const files = await list(output);
  assert.ok(files.length > 100, 'photographs, fonts, icons, PWA and identity assets are included');
  assert.ok(files.some(file => file.endsWith('/assets/dayani-contacto.png')));
  assert.ok(files.some(file => file.endsWith('/assets/fonts/dm-sans.woff')));
  assert.ok(files.some(file => file.endsWith('/.nojekyll')));
  assert.ok(!files.some(file => /(?:\.env|\.sql$|README|PRUEBAS|\/backend\/|\/worker\/|\/supabase\/|\.openai)/i.test(file)), 'private/build source is not a public artifact');
  for (const file of files) {
    const name = path.relative(output, file).split(path.sep).join('/'); const ext = path.extname(file);
    if (!['.html', '.css', '.js', '.webmanifest'].includes(ext)) continue;
    const text = await readFile(file, 'utf8');
    if (ext === '.html') {
      const config = text.indexOf('src="/Dayas/pages-config.js"'); const adapter = text.indexOf('src="/Dayas/pages-api.js" defer');
      assert.ok(config >= 0 && adapter > config, `${name}: configuration precedes deferred transport`);
      assert.match(text.match(/<script\b[^>]*>/i)?.[0] || '', /src="\/Dayas\/pages-config\.js"/, `${name}: config is the first script`);
      for (const match of text.matchAll(/\b(?:src|href|action|poster)\s*=\s*["']([^"']*)["']/gi)) await resolveReference(output, name, match[1]);
    }
    if (ext === '.css') for (const match of text.matchAll(/url\(\s*["']?([^\s)'";]+)/gi)) await resolveReference(output, name, match[1]);
    if (ext === '.js') { const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' }); assert.equal(syntax.status, 0, `${name}: ${syntax.stderr}`); }
    if (ext === '.webmanifest') {
      const manifest = JSON.parse(text); const expectedScope = base + (name.startsWith('gestion/') ? 'gestion/' : '');
      assert.equal(manifest.scope, expectedScope); assert.ok(manifest.start_url.startsWith(expectedScope));
      for (const icon of manifest.icons) await resolveReference(output, name, icon.src);
      await resolveReference(output, name, manifest.start_url);
    }
  }
  const routes = await readFile(path.join(output, 'pages-routes.js'), 'utf8');
  assert.ok(routes.includes("script='/Dayas/store.js'")); assert.ok(routes.includes("unrelated='/storeXjs'"));
  assert.ok(routes.includes("delimiter='/'")); assert.ok(routes.includes("endpoint='/api/catalog'"));
  const app = await readFile(path.join(output, 'gestion/app.js'), 'utf8');
  assert.ok(app.includes("register('/Dayas/gestion/sw.js')"));
  assert.ok(app.includes("api('/api/auth/status')"), 'API paths are left for the transport');
  assert.ok(app.includes("split('/')"), 'structural slash string delimiters remain untouched');
  assert.ok(!/(?:src|href)=["']\/(?!Dayas\/|\/)/.test(app), 'rendered management links and icons stay under /Dayas/');
  assert.equal(await readFile(path.join(directory, 'public/gestion/app.js'), 'utf8'), sourceApp, 'canonical source remains unchanged');
  const configContext = { window: {} }; vm.runInNewContext(await readFile(path.join(output, 'pages-config.js'), 'utf8'), configContext);
  assert.equal(configContext.window.DAYA_PAGES.base, base);
  assert.equal(configContext.window.DAYA_PAGES.apiBase, 'https://susfemyhruehbsnzffly.supabase.co/functions/v1/daya-pages-api');
  const review = JSON.parse(await readFile(path.join(output, 'api/review.json'), 'utf8'));
  assert.equal(review.sample, true); assert.equal(review.revision, 0); assert.equal(review.user.rol, 'd'); assert.ok(review.data.daya_productos.length);
});

test('wrong deployment base fails before replacing output', async t => {
  const directory = await fixture(); t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, '_site')); await writeFile(path.join(directory, '_site/keep.txt'), 'keep');
  const result = build(directory, ['--base=/wrong/']); assert.notEqual(result.status, 0); assert.match(result.stderr, /exactly \/Dayas\//);
  assert.equal(await readFile(path.join(directory, '_site/keep.txt'), 'utf8'), 'keep');
});

for (const relative of ['sw.js', 'gestion/sw.js']) test(`${relative} caches only this project's static files and never API responses`, async () => {
  const source = await readFile(path.join(project, 'public', relative), 'utf8');
  const listeners = {}; let cacheWrite = false; const scope = origin + base + (relative.startsWith('gestion/') ? 'gestion/' : '');
  const context = { URL, Response, self: { registration: { scope }, addEventListener: (name, callback) => { listeners[name] = callback; }, skipWaiting() {}, clients: { claim() {} } }, caches: { open: async () => ({ addAll: async urls => { for (const url of urls) assert.ok(url.startsWith(base)); }, put: async () => { cacheWrite = true; } }), keys: async () => ['unrelated-project-cache'], delete: async () => { assert.fail('must not remove another project cache'); }, match: async () => undefined }, fetch: async () => new Response('asset') };
  vm.runInNewContext(source, context);
  await new Promise((resolve, reject) => listeners.install({ waitUntil: promise => promise.then(resolve, reject) }));
  await new Promise((resolve, reject) => listeners.activate({ waitUntil: promise => promise.then(resolve, reject) }));
  for (const pathname of ['/api/state', '/Dayas/api/review.json', '/AnotherProject/assets/private.json', '/Dayas/gestion/unlisted-private.json']) {
    listeners.fetch({ request: { method: 'GET', url: origin + pathname }, respondWith() { assert.fail(`must not intercept ${pathname}`); } });
  }
  let response; listeners.fetch({ request: { method: 'GET', url: scope + (relative.startsWith('gestion/') ? 'app.css' : 'daya.css') }, respondWith(value) { response = value; } });
  assert.equal((await response).status, 200); await Promise.resolve(); assert.ok(cacheWrite);
});
