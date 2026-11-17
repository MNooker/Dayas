import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argument = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const base = argument('base') ?? process.env.PAGES_BASE ?? '/Dayas/';
const output = path.resolve(project, argument('out-dir') ?? process.env.PAGES_OUT_DIR ?? '_site');
if (base !== '/Dayas/') throw new Error('GitHub Pages base must be exactly /Dayas/ for MNooker/Dayas.');
if ([project, path.join(project, 'public'), path.join(project, 'scripts'), path.join(project, 'tests'), path.join(project, 'worker')].some(protectedPath => output === protectedPath || protectedPath.startsWith(output + path.sep))) throw new Error('Output directory must not replace project source.');
if (!path.basename(output).startsWith('_site')) throw new Error('Pages output directory name must start with _site.');
const source = path.join(project, 'public');
const allowed = new Set(['.html', '.js', '.css', '.svg', '.png', '.webp', '.jpg', '.jpeg', '.avif', '.gif', '.ico', '.webmanifest', '.woff', '.woff2', '.ttf', '.pdf', '.txt']);
const files = [];
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['supabase', 'node_modules'].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(absolute);
    else if (entry.isFile() && (allowed.has(path.extname(entry.name)) || /^LICENSE$/i.test(entry.name))) files.push(path.relative(source, absolute).split(path.sep).join('/'));
  }
}
await visit(source);
if (!files.includes('pages-api.js')) throw new Error('public/pages-api.js is required before building GitHub Pages.');
const topNames = [...new Set(files.map(file => file.split('/')[0]))].filter(name => !['pages-api.js', 'pages-config.js'].includes(name));
const escapedNames = topNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|');
// Restrict JS replacements to known public paths. Bare '/' remains a string delimiter,
// and API paths remain unchanged so the transport can intercept the original requests.
const rootLiteral = new RegExp(`(["'\x60])\\/((?:${escapedNames})(?=[/\\?#"'\x60]|$))`, 'g');
const prefix = value => value.startsWith('/') && !value.startsWith('//') && !/^\/api(?:\/|[?#]|$)/.test(value) && !value.startsWith(base) ? base + value.slice(1) : value;
function transformText(text) {
  return text.replace(/\b(src|href|action|poster)\s*=\s*(["'])(\/[^"']*)\2/gi, (_, name, quote, value) => `${name}=${quote}${prefix(value)}${quote}`)
    .replace(/url\(\s*(["']?)(\/[^\s)'";]+)\1\s*\)/gi, (_, quote, value) => `url(${quote}${prefix(value)}${quote})`)
    .replace(rootLiteral, (_, quote, value) => quote + base + value);
}
function transformManifest(text, filename) {
  const manifest = JSON.parse(text);
  const directory = path.posix.dirname(filename);
  const scope = base + (directory === '.' ? '' : directory + '/');
  manifest.id = prefix(manifest.id || scope);
  manifest.scope = scope;
  manifest.start_url = prefix(manifest.start_url?.startsWith('/') ? manifest.start_url : scope + (manifest.start_url || './').replace(/^\.\//, ''));
  for (const icon of manifest.icons || []) icon.src = prefix(icon.src);
  return JSON.stringify(manifest, null, 2) + '\n';
}
const injection = `<script src="${base}pages-config.js"></script><script src="${base}pages-api.js" defer></script>`;
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const filename of files) {
  const destination = path.join(output, filename);
  await mkdir(path.dirname(destination), { recursive: true });
  const contents = await readFile(path.join(source, filename));
  const extension = path.extname(filename);
  let result = contents;
  if (['.html', '.js', '.css', '.webmanifest', '.svg'].includes(extension)) {
    let text = contents.toString();
    if (extension === '.webmanifest') text = transformManifest(text, filename);
    else if (filename !== 'pages-api.js') text = transformText(text);
    if (extension === '.html') {
      if (/<head(?:\s[^>]*)?>/i.test(text)) text = text.replace(/<head(?:\s[^>]*)?>/i, tag => tag + '\n' + injection + '\n');
      else text = text.replace(/(<html\b[^>]*>)/i, '$1<head>' + injection + '</head>');
    }
    if (filename === 'sw.js' || filename === 'gestion/sw.js') text = text.replace('const PAGES_ASSETS = [];', `const PAGES_ASSETS = ${JSON.stringify([base + 'pages-config.js', base + 'pages-api.js'])};`);
    result = text;
  }
  await writeFile(destination, result);
}
const config = { base, apiBase: 'https://susfemyhruehbsnzffly.supabase.co/functions/v1/daya-pages-api' };
await writeFile(path.join(output, 'pages-config.js'), 'window.DAYA_PAGES=Object.freeze(' + JSON.stringify(config) + ');\n');
await mkdir(path.join(output, 'api'), { recursive: true });
const sample = JSON.parse(await readFile(path.join(project, 'worker/review-sample.json'), 'utf8'));
await writeFile(path.join(output, 'api/review.json'), JSON.stringify({ data: sample, revision: 0, user: { id: 'review', nombre: 'Dayani · Ejemplos', rol: 'd' }, sample: true }));
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Built ${files.length + 3} public files for https://mnooker.github.io${base} in ${path.relative(project, output)}.`);
