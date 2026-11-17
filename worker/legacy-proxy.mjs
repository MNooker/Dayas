/* Cloudflare Pages: API de mismo origen. Ninguna clave privilegiada está en el cliente. */
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  if(!['GET','POST'].includes(request.method))return Response.json({error:'Método no permitido.'},{status:405});
  if(request.method==='POST'){
   if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return Response.json({error:'Origen no permitido.'},{status:403});
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return Response.json({error:'Se requiere JSON.'},{status:415});
  }
  const headers=new Headers();
  for(const name of ['Content-Type','Cookie','X-CSRF-Token']){const value=request.headers.get(name);if(value)headers.set(name,value);}
  headers.set('X-Daya-Origin',url.origin);
  const target='https://susfemyhruehbsnzffly.supabase.co/functions/v1/daya-api'+url.pathname+url.search;
  try{
   const response=await fetch(target,{method:request.method,headers,body:request.method==='GET'?undefined:request.body,redirect:'manual'});
   const out=new Headers(response.headers);out.set('Cache-Control','no-store');out.set('X-Content-Type-Options','nosniff');
   return new Response(response.body,{status:response.status,headers:out});
  }catch{return Response.json({error:'No se pudo conectar con la base de datos. Intenta de nuevo.'},{status:503,headers:{'Cache-Control':'no-store'}});}
 }
};
