/* GitHub Pages only: short-lived credentials stay inside this page's closure.
   Reloading or leaving the page requires signing in again. No persistent token storage. */
(()=>{
 'use strict';
 const config=globalThis.DAYA_PAGES;
 if(!config)return;
 const originalFetch=globalThis.fetch.bind(globalThis),base=new URL(config.base,location.origin),apiBase=new URL(config.apiBase);
 if(base.origin!==location.origin||apiBase.protocol!=='https:'||apiBase.username||apiBase.password||apiBase.search||apiBase.hash)throw Error('Configuración de Daya no válida.');
 const apiRoot=apiBase.href.replace(/\/$/,'');
 let session=null,csrf='',generation=0,refreshing=null;
 const initial=new Set(['/api/auth/login','/api/auth/setup','/api/auth/session','/api/auth/recover']);
 const anonymous=new Set([...initial,'/api/catalog']);
 const jsonError=(message,status=401)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
 function clear(){session=null;csrf='';generation++;}
 function save(data,version){
  const candidate=data?.session;
  if(version!==generation)return false;
  if(!candidate||typeof candidate.access_token!=='string'||typeof candidate.refresh_token!=='string'||!Number.isFinite(Number(candidate.expires_at)))return false;
  session={access_token:candidate.access_token,refresh_token:candidate.refresh_token,expires_at:Number(candidate.expires_at)};
  csrf=typeof data.csrf==='string'?data.csrf:'';
  return true;
 }
 function send(path,method,body,access,csrfToken,signal){
  const headers=new Headers({'X-Daya-Transport':'bearer'});
  if(method==='POST')headers.set('Content-Type','application/json');
  if(access)headers.set('Authorization','Bearer '+access);
  if(csrfToken)headers.set('X-CSRF-Token',csrfToken);
  return originalFetch(apiRoot+path,{method,headers,body:method==='POST'?body:undefined,credentials:'omit',mode:'cors',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal});
 }
 async function refresh(version){
  if(refreshing?.version===version)return refreshing.promise;
  const refreshToken=session?.refresh_token;
  if(!refreshToken||version!==generation)return false;
  const task={version,promise:null};
  task.promise=(async()=>{
   const result=await send('/api/auth/refresh','POST',JSON.stringify({refresh_token:refreshToken}),'','');
   const data=await result.json().catch(()=>null);
   if(!result.ok||!save(data,version)){if(version===generation)clear();return false;}
   return true;
  })().finally(()=>{if(refreshing===task)refreshing=null;});
  refreshing=task;return task.promise;
 }
 function sanitized(result,data){
  if(!data||!Object.prototype.hasOwnProperty.call(data,'session'))return result;
  delete data.session;
  const headers=new Headers(result.headers);headers.delete('Content-Length');headers.delete('Content-Encoding');
  return new Response(JSON.stringify(data),{status:result.status,statusText:result.statusText,headers});
 }
 globalThis.fetch=async(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input),location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return originalFetch(input,init);
  const request=new Request(input instanceof Request?input:url.href,init),path=url.pathname+url.search;
  if(url.pathname==='/api/review'){
   if(request.method!=='GET')return jsonError('La revisión es de solo lectura.',403);
   return originalFetch(new URL('api/review.json',base).href,{method:'GET',credentials:'omit',cache:'no-store',signal:request.signal});
  }
  if(!['GET','POST'].includes(request.method))return jsonError('Método no permitido.',405);
  if(url.pathname==='/api/auth/refresh')return jsonError('La sesión se renueva desde tu tienda.',400);
  if(initial.has(url.pathname)&&['/api/auth/login','/api/auth/session'].includes(url.pathname))clear();
  const version=generation,logout=url.pathname==='/api/auth/logout',body=request.method==='POST'?await request.clone().text():undefined;
  let didRefresh=false;
  if(!anonymous.has(url.pathname)&&!logout&&session&&session.expires_at*1000<=Date.now()+30000){
   didRefresh=true;if(!await refresh(version))return jsonError('La sesión terminó. Inicia sesión de nuevo.');
  }
  const access=anonymous.has(url.pathname)?'':session?.access_token||'',csrfToken=anonymous.has(url.pathname)?'':csrf;
  // Clear immediately, before an in-flight refresh can restore a signed-out session.
  if(logout)clear();
  let result=await send(path,request.method,body,access,csrfToken,request.signal);
  if(result.status===401&&access&&!anonymous.has(url.pathname)&&!logout&&!didRefresh&&version===generation&&session?.refresh_token){
   didRefresh=true;
   if(await refresh(version))result=await send(path,request.method,body,session?.access_token||'',csrf,request.signal);
  }
  const data=await result.clone().json().catch(()=>null);
  if(result.ok&&data?.session){
   if(!save(data,version))return jsonError('La sesión cambió. Inicia sesión de nuevo.');
  }
  if(!logout&&version===generation&&(result.status===401||result.ok&&url.pathname==='/api/auth/reset'||url.pathname==='/api/auth/status'&&session&&!data?.user||result.status===403&&/cuenta no tiene acceso activo/i.test(data?.error||'')))clear();
  return sanitized(result,data);
 };
 addEventListener('pagehide',clear);
})();
