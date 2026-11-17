import {test} from 'node:test';
import assert from 'node:assert/strict';
const ORIGIN='https://mnooker.github.io',OLD='https://daya.sites.test';
let servers=0;
globalThis.Deno={env:{get:key=>key==='SUPABASE_URL'?'https://supabase.test':'test-key'},serve:()=>{servers++;}};
const {handlePages}=await import('../backend/pages-api/index.ts');
const {handle}=await import('../backend/daya-api/index.ts');
const D=globalThis.Daya,uid='11111111-1111-1111-1111-111111111111',sid='22222222-2222-2222-2222-222222222222';
const jwt=(extra={})=>'x.'+Buffer.from(JSON.stringify({session_id:sid,exp:Math.floor(Date.now()/1000)+3600,...extra})).toString('base64url')+'.signature';
const access=jwt(),rotated=jwt({rotation:2});
const request=(path,body,headers={},method=body===undefined?'GET':'POST')=>new Request('https://supabase.test/functions/v1/daya-pages-api/api/'+path,{method,headers:{Origin:ORIGIN,'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
test('Pages wrapper preserves source authorization and isolates its transport',async t=>{
 assert.equal(servers,1,'Only the Pages entrypoint starts a server');
 const original=globalThis.fetch;let calls=0,active=true,confirmed=true,role='d',commits=0,refreshes=0,recoverURL='';let data=D.empty(),revision=0;
 globalThis.fetch=async(input,options={})=>{
  calls++;const url=String(input),body=options.body?JSON.parse(options.body):{};let result;
  if(url.includes('/auth/v1/token?grant_type=password'))return body.password==='correct-password'?Response.json({access_token:access,refresh_token:'refresh-one',expires_in:3600}):Response.json({msg:'Credenciales inválidas'},{status:400});
  if(url.includes('/auth/v1/token?grant_type=refresh_token')){refreshes++;return body.refresh_token==='refresh-one'?Response.json({access_token:rotated,refresh_token:'refresh-two',expires_in:3600}):Response.json({error:'Invalid refresh token'},{status:400});}
  if(url.includes('/auth/v1/user')){if(!['Bearer '+access,'Bearer '+rotated].includes(options.headers.Authorization))return Response.json({msg:'Token inválido'},{status:401});result={id:uid,email:'owner@example.test',email_confirmed_at:confirmed?'2026-11-17':null,user_metadata:{rol:'d'}};}
  else if(url.includes('/auth/v1/logout'))result={};
  else if(url.includes('/auth/v1/recover')){recoverURL=url;result={};}
  else if(url.includes('daya_cloud_config?'))result=[{owner_email:null,site_url:OLD+'/gestion/'}];
  else if(url.includes('/rpc/daya_cloud_session_active')){assert.equal(body.p_uid,uid);assert.equal(body.p_session,sid);result=active;}
  else if(url.includes('daya_cloud_members?'))result=[{id:uid,nombre:'Ana',email:'owner@example.test',rol:role,activo:true}];
  else if(url.includes('daya_cloud_state?'))result=[{data,revision,sample:false}];
  else if(url.includes('daya_cloud_requests?'))result=[];
  else if(url.includes('/rpc/daya_cloud_commit')){assert.equal(body.p_session,sid);D.validate(body.p_data);data=body.p_data;revision++;commits++;result={ok:true,revision,result:body.p_result};}
  else throw Error('Unexpected test request: '+url);
  return Response.json(result);
 };
 const auth={'Authorization':'Bearer '+access,'X-CSRF-Token':'memory-csrf'};
 try{
  await t.test('denies missing, null and foreign real origins despite trusted forwarded origin',async()=>{
   for(const origin of ['', 'null','https://evil.test','https://mnooker.github.io.evil.test']){
    const before=calls,r=await handlePages(request('state',undefined,{Origin:origin,'X-Daya-Origin':ORIGIN,...auth}));assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);assert.equal(calls,before);
   }
  });
  await t.test('preflight admits only exact origin, methods and explicit header allowlist',async()=>{
   const r=await handlePages(request('state',undefined,{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization, content-type, x-csrf-token, x-daya-transport'},'OPTIONS'));
   assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),ORIGIN);assert.equal(r.headers.get('Access-Control-Allow-Credentials'),null);assert.equal(r.headers.get('Vary'),'Origin');
   for(const headers of [{'Access-Control-Request-Method':'DELETE'},{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'X-Daya-Origin'}])assert.equal((await handlePages(request('state',undefined,headers,'OPTIONS'))).status,403);
   assert.equal((await handlePages(request('state',undefined,{},'DELETE'))).status,405);
  });
  await t.test('ignores browser cookies and never falls back after a malformed bearer',async()=>{
   const cookie='daya_access='+access+'; daya_csrf=memory-csrf';
   assert.equal((await handlePages(request('state',undefined,{Cookie:cookie}))).status,401);
   assert.equal((await handlePages(request('state',undefined,{Cookie:cookie,Authorization:'Bearer bad; injected=1'}))).status,401);
   const status=await(await handlePages(request('auth/status',undefined,{Cookie:cookie}))).json();assert.equal(status.user,null);
  });
  await t.test('login exposes session JSON only on this transport and strips Set-Cookie',async()=>{
   const r=await handlePages(request('auth/login',{email:'owner@example.test',password:'correct-password'}));assert.equal(r.status,200);assert.deepEqual(r.headers.getSetCookie(),[]);assert.equal(r.headers.get('Access-Control-Allow-Credentials'),null);assert.equal(r.headers.get('Cache-Control'),'no-store');
   const body=await r.json();assert.equal(body.user.rol,'d');assert.equal(body.session.access_token,access);assert.equal(body.session.refresh_token,'refresh-one');assert.ok(body.csrf);assert.ok(body.session.expires_at>Date.now()/1000);
   const bad=await handlePages(request('auth/login',{email:'owner@example.test',password:'wrong'}));assert.equal(bad.status,400);assert.equal((await bad.json()).session,undefined);assert.deepEqual(bad.headers.getSetCookie(),[]);
  });
  await t.test('bearer uses Auth.user, confirmation, live session and member role checks',async()=>{
   const r=await handlePages(request('state',undefined,{...auth,'X-Daya-Origin':'https://evil.test',Cookie:'daya_access=attacker'}));assert.equal(r.status,200);assert.equal((await r.json()).user.id,uid);
   confirmed=false;assert.equal((await handlePages(request('state',undefined,auth))).status,401);confirmed=true;
   active=false;assert.equal((await handlePages(request('state',undefined,auth))).status,401);active=true;
   assert.equal((await handlePages(request('state',undefined,{Authorization:'Bearer '+jwt({session_id:'unknown'})}))).status,401);
  });
  await t.test('writes keep server business calculation and seller permissions',async()=>{
   const r=await handlePages(request('operation',{operation:'client',args:[{nombre:'Clienta de prueba',tel:'',nota:''}],revision,requestId:'pages-client-request-1'},auth));assert.equal(r.status,200);assert.equal(commits,1);assert.equal(data.daya_clientes[0].nombre,'Clienta de prueba');
   assert.equal((await handlePages(request('operation',{operation:'client',args:[],revision,requestId:'pages-client-request-2'},{Authorization:'Bearer '+access}))).status,403);
   role='v';assert.equal((await handlePages(request('operation',{operation:'opening',args:[D.date(),100],revision,requestId:'pages-opening-request-1'},auth))).status,403);assert.equal((await handlePages(request('backup',undefined,auth))).status,403);assert.equal(commits,1);role='d';
  });
  await t.test('refresh and confirmation reject revoked sessions without leaking credentials',async()=>{
   const r=await handlePages(request('auth/refresh',{refresh_token:'refresh-one'}));assert.equal(r.status,200);assert.equal((await r.json()).session.access_token,rotated);assert.deepEqual(r.headers.getSetCookie(),[]);assert.equal(refreshes,1);
   active=false;assert.equal((await handlePages(request('auth/refresh',{refresh_token:'refresh-one'}))).status,401);assert.equal((await handlePages(request('auth/session',{access_token:access,refresh_token:'refresh-one'}))).status,401);active=true;
   assert.equal((await handlePages(request('auth/refresh',{refresh_token:'wrong'}))).status,401);
  });
  await t.test('public catalog has exact CORS and review never runs live',async()=>{
   const r=await handlePages(request('catalog'));assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),ORIGIN);assert.deepEqual(await r.json(),{products:[]});const before=calls;assert.equal((await handlePages(request('review'))).status,404);assert.equal(calls,before);
  });
  await t.test('recovery redirect override is internal and leaves original cookie transport intact',async()=>{
   assert.equal((await handlePages(request('auth/recover',{email:'owner@example.test'}))).status,200);assert.equal(new URL(recoverURL).searchParams.get('redirect_to'),ORIGIN+'/Dayas/gestion/');
   const oldReq=(body,csrf='old-csrf')=>new Request('https://supabase.test/functions/v1/daya-api/api/operation',{method:'POST',headers:{'X-Daya-Origin':OLD,'Content-Type':'application/json',Cookie:'daya_access='+access+'; daya_csrf=old-csrf','X-CSRF-Token':csrf},body:JSON.stringify(body)});
   assert.equal((await handle(oldReq({},'wrong'))).status,403);
   assert.equal((await handle(oldReq({operation:'client',args:[{nombre:'Cookie client',tel:'',nota:''}],revision,requestId:'cookie-client-request-1'}))).status,200);
   const login=await handle(new Request('https://supabase.test/functions/v1/daya-api/api/auth/login',{method:'POST',headers:{'X-Daya-Origin':OLD,'Content-Type':'application/json'},body:JSON.stringify({email:'owner@example.test',password:'correct-password'})}));assert.equal(login.status,200);assert.equal(login.headers.getSetCookie().length,3);assert.equal((await login.json()).session,undefined);
   await handle(new Request('https://supabase.test/functions/v1/daya-api/api/auth/recover',{method:'POST',headers:{'X-Daya-Origin':OLD,'Content-Type':'application/json'},body:JSON.stringify({email:'owner@example.test'})}));assert.equal(new URL(recoverURL).searchParams.get('redirect_to'),OLD+'/gestion/');
  });
 }finally{globalThis.fetch=original;}
});
