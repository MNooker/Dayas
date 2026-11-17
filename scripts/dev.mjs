// Local Node bridge for the same Worker used in production. No database mocks.
import http from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createWorker} from '../worker/index.mjs';
const root=path.resolve('public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf'};
const sample=JSON.parse(await readFile('worker/review-sample.json','utf8'));
const server=http.createServer(async(req,res)=>{
 try{
  const assets={};
  async function scan(dir){for(const item of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,item.name);if(item.isDirectory())await scan(f);else if(mime[path.extname(f)])assets['/'+path.relative(root,f).split(path.sep).join('/')]={type:mime[path.extname(f)],data:(await readFile(f)).toString('base64')};}}
  // Refresh assets per request so the preview reflects source edits immediately.
  await scan(root);
  const origin='http://'+req.headers.host;
  const headers=new Headers();for(const [key,value] of Object.entries(req.headers)){if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(', '):value);}
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const init={method:req.method,headers};if(!['GET','HEAD'].includes(req.method))init.body=Buffer.concat(chunks);
  const response=await createWorker(assets,sample).fetch(new Request(new URL(req.url,origin),init));
  res.statusCode=response.status;
  response.headers.forEach((value,key)=>{if(key!=='set-cookie')res.setHeader(key,value);});
  const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error(error.message);res.statusCode=500;res.end('No se pudo abrir la vista local.');}
});
const port=Number(process.env.PORT||process.env.SITES_PORT||4173);
server.listen(port,'0.0.0.0',()=>console.log('Daya preview http://localhost:'+port));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
