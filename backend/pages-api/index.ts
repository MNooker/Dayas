/* GitHub Pages transport only. The original handler still owns every permission and business rule. */
import {handle} from '../daya-api/index.ts';
const ORIGIN='https://mnooker.github.io';
const SITE_URL=ORIGIN+'/Dayas/gestion/';
const ALLOWED_HEADERS=new Set(['authorization','content-type','x-csrf-token','x-daya-transport']);
const PUBLIC=new Set(['GET /api/auth/status','POST /api/auth/login','POST /api/auth/setup','POST /api/auth/session','POST /api/auth/recover','GET /api/catalog']);
const tokenPattern=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
function response(data:unknown,status:number,headers:Headers){headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status,headers});}
function claims(jwt:string){try{return JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{return {};}}
function safeToken(value:unknown):value is string{return typeof value==='string'&&value.length<16384&&tokenPattern.test(value);}
function safeRefresh(value:unknown):value is string{return typeof value==='string'&&value.length>0&&value.length<4096&&!/[\s;,]/.test(value);}
function csrfValue(value:string|null){return value&&/^[A-Za-z0-9_-]{1,256}$/.test(value)?value:'';}
function internalRequest(url:URL,method:string,jwt:string,csrf:string,body?:string){
 const headers=new Headers({'X-Daya-Origin':ORIGIN});
 if(method==='POST')headers.set('Content-Type','application/json');
 if(jwt)headers.set('Cookie','daya_access='+jwt+(csrf?'; daya_csrf='+csrf:''));
 if(csrf)headers.set('X-CSRF-Token',csrf);
 return new Request(url,{method,headers,body:method==='POST'?body:undefined});
}
async function validMember(url:URL,jwt:string){
 const checkURL=new URL(url);checkURL.pathname='/api/auth/status';checkURL.search='';
 const result=await handle(internalRequest(checkURL,'GET',jwt,''),{siteURL:SITE_URL});
 const data=await result.json();return result.ok&&data.user?.activo?data.user:null;
}
function cookieSession(headers:Headers){
 const cookies:Record<string,string>={};
 const values=headers.getSetCookie();
 for(const value of values){const part=value.split(';',1)[0],index=part.indexOf('=');if(index>0)cookies[part.slice(0,index)]=part.slice(index+1);}
 const access=cookies.daya_access,refresh=cookies.daya_refresh,expires=Number(claims(access||'').exp);
 if(!safeToken(access)||!safeRefresh(refresh)||!Number.isFinite(expires)||expires<=Date.now()/1000)return null;
 return {session:{access_token:access,refresh_token:refresh,expires_at:expires},csrf:csrfValue(cookies.daya_csrf)};
}
export async function handlePages(req:Request){
 const headers=new Headers({'Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'});
 // No fallback to X-Daya-Origin: a browser must send this exact real Origin.
 if(req.headers.get('Origin')!==ORIGIN)return response({error:'Origen no permitido.'},403,headers);
 headers.set('Access-Control-Allow-Origin',ORIGIN);
 headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
 headers.set('Access-Control-Allow-Headers','Authorization, Content-Type, X-CSRF-Token, X-Daya-Transport');
 try{
  if(req.method==='OPTIONS'){
   const method=req.headers.get('Access-Control-Request-Method');
   const requested=(req.headers.get('Access-Control-Request-Headers')||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
   if(!['GET','POST'].includes(method||'')||requested.some(x=>!ALLOWED_HEADERS.has(x)))return response({error:'Solicitud no permitida.'},403,headers);
   return new Response(null,{status:204,headers});
  }
  if(!['GET','POST'].includes(req.method))return response({error:'Método no permitido.'},405,headers);
  const url=new URL(req.url),index=url.pathname.indexOf('/api/'),route=index<0?'':url.pathname.slice(index);
  if(!route||route==='/api/review')return response({error:'Ruta no encontrada.'},404,headers);
  if(req.method==='POST'&&!req.headers.get('Content-Type')?.startsWith('application/json'))return response({error:'Se requiere JSON.'},415,headers);
  const authorization=req.headers.get('Authorization')||'',candidate=authorization.startsWith('Bearer ')?authorization.slice(7):'';
  const jwt=safeToken(candidate)?candidate:'';
  // Ambient browser cookies and every forwarded-origin header are deliberately ignored.
  if(!PUBLIC.has(req.method+' '+route)&&route!=='/api/auth/refresh'&&!jwt)return response({error:'Inicia sesión para continuar.'},401,headers);
  const text=req.method==='POST'?await req.text():undefined;
  if(text&&text.length>20*1024*1024)return response({error:'El archivo supera 20 MB.'},413,headers);
  if(route==='/api/auth/refresh'){
   if(req.method!=='POST')return response({error:'Método no permitido.'},405,headers);
   let input;try{input=JSON.parse(text||'{}');}catch{return response({error:'JSON inválido.'},400,headers);}
   if(!safeRefresh(input?.refresh_token))return response({error:'Inicia sesión para continuar.'},401,headers);
   const base=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!;
   const refreshed=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+anon,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:input.refresh_token})});
   const session=await refreshed.json().catch(()=>null),expires=Number(session?.expires_at||claims(session?.access_token||'').exp);
   if(!refreshed.ok||!safeToken(session?.access_token)||!safeRefresh(session?.refresh_token)||!Number.isFinite(expires)||expires<=Date.now()/1000||!await validMember(url,session.access_token))return response({error:'La sesión terminó. Inicia sesión de nuevo.'},refreshed.status===429?429:401,headers);
   return response({session:{access_token:session.access_token,refresh_token:session.refresh_token,expires_at:expires},csrf:crypto.randomUUID()+crypto.randomUUID()},200,headers);
  }
  const result=await handle(internalRequest(url,req.method,jwt,csrfValue(req.headers.get('X-CSRF-Token')),text),{siteURL:SITE_URL});
  const data=await result.json();
  if(result.ok&&req.method==='POST'&&['/api/auth/login','/api/auth/session'].includes(route)){
   const session=cookieSession(result.headers);
   if(!session||route==='/api/auth/session'&&!await validMember(url,session.session.access_token))return response({error:'La sesión terminó. Inicia sesión de nuevo.'},401,headers);
   return response({...data,...session},result.status,headers);
  }
  // Construct fresh response headers; Set-Cookie and Allow-Credentials never cross this boundary.
  return response(data,result.status,headers);
 }catch{return response({error:'No se pudo conectar con Daya. Intenta de nuevo.'},503,headers);}
}
Deno.serve(handlePages);
