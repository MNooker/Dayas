// Same-origin gateway. The upstream owns authentication, permissions and business rules.
const UPSTREAM='https://susfemyhruehbsnzffly.supabase.co/functions/v1/daya-api';
export function createWorker(assets,sample){return {async fetch(request){
 const url=new URL(request.url),path=url.pathname;
 if(path.startsWith('/api/')){
  if(!['GET','POST'].includes(request.method))return Response.json({error:'Método no permitido.'},{status:405});
  if(request.method==='POST'){
   if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return Response.json({error:'Origen no permitido.'},{status:403});
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return Response.json({error:'Se requiere JSON.'},{status:415});
  }
  if(path==='/api/review'&&request.method==='GET')return Response.json({data:sample,revision:0,user:{id:'review',nombre:'Dayani · Ejemplos',rol:'d'},sample:true},{headers:{'Cache-Control':'no-store'}});
  const headers=new Headers();
  for(const name of ['Content-Type','Cookie','X-CSRF-Token']){const value=request.headers.get(name);if(value)headers.set(name,value);}
  headers.set('X-Daya-Origin',url.origin);
  try{
   const upstream=await fetch(UPSTREAM+path+url.search,{method:request.method,headers,body:request.method==='POST'?request.body:undefined,redirect:'manual'});
   const out=new Headers(upstream.headers);out.set('Cache-Control','no-store');out.set('X-Content-Type-Options','nosniff');
   return new Response(upstream.body,{status:upstream.status,headers:out});
  }catch{return Response.json({error:'No se pudo conectar con Daya. Intenta de nuevo.'},{status:503});}
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});
 const key=path==='/'?'/index.html':path.endsWith('/')?path+'index.html':path;
 const asset=assets[key];if(!asset)return new Response('Página no encontrada',{status:404});
 const headers={'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
 if(key.endsWith('/sw.js'))headers['Service-Worker-Allowed']=key.startsWith('/gestion/')?'/gestion/':'/';
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{headers});
}};}
