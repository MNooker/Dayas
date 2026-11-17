import {readFile,writeFile,mkdir,readdir,rm,copyFile} from 'node:fs/promises';
import path from 'node:path';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf'};
const assets={};
async function visit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await visit(file);else if(mime[path.extname(file)])assets['/'+path.relative('public',file).split(path.sep).join('/')]={type:mime[path.extname(file)],data:(await readFile(file)).toString('base64')};}}
await visit('public');
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const source=await readFile('worker/index.mjs','utf8'),sample=JSON.parse(await readFile('worker/review-sample.json','utf8'));
await writeFile('dist/server/index.js',source+'\nexport default createWorker('+JSON.stringify(assets)+','+JSON.stringify(sample)+');\n');
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built '+Object.keys(assets).length+' assets in a self-contained Sites Worker.');
