import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/pages-api.js',import.meta.url),'utf8'),ORIGIN='https://mnooker.github.io',API='https://project.supabase.co/functions/v1/daya-pages-api';
function browser(network,config={base:'/Dayas/',apiBase:API}){
 const events={},calls=[],fetch=async(url,options)=>{calls.push({url:String(url),options});return network(String(url),options||{});};
 const context={URL,Request,Response,Headers,Date,location:new URL(ORIGIN+'/Dayas/gestion/'),fetch,addEventListener:(type,handler)=>events[type]=handler};
 Object.defineProperties(context,{localStorage:{get(){throw Error('Persistent storage must not be accessed');}},sessionStorage:{get(){throw Error('Persistent storage must not be accessed');}},document:{get(){throw Error('Cookies must not be accessed');}}});
 if(config)context.DAYA_PAGES=config;context.globalThis=context;vm.runInNewContext(source,context);
 return {context,calls,events,fetch:context.fetch};
}
const session=(token='access-one',expires=Math.floor(Date.now()/1000)+3600)=>({user:{id:'owner',rol:'d'},csrf:'csrf-'+token,session:{access_token:token,refresh_token:'refresh-'+token,expires_at:expires}});
const login=b=>b.fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@example.test',password:'correct'})});
test('Pages adapter is opt-in and sends tokens only to configured API',async()=>{
 const b=browser(async()=>Response.json({ok:true}),null);const original=b.context.fetch;assert.equal(await(await original('/assets/photo.jpg')).json().then(x=>x.ok),true);assert.equal(b.calls[0].url,'/assets/photo.jpg');
});
test('credentials live only in memory, are removed from app responses and never leak to other requests',async()=>{
 const b=browser(async(url)=>url.endsWith('/api/auth/login')?Response.json(session()):Response.json({user:{id:'owner'},ok:true}));
 const r=await login(b),body=await r.json();assert.equal(body.session,undefined);assert.equal(body.user.id,'owner');assert.equal(body.csrf,'csrf-access-one');assert.doesNotMatch(JSON.stringify(body),/refresh-access/);
 await b.fetch('/api/state',{headers:{Authorization:'Bearer injected',Cookie:'ambient=bad','X-Daya-Origin':'https://evil.test','X-CSRF-Token':'stale'}});
 const call=b.calls.at(-1);assert.equal(call.url,API+'/api/state');assert.equal(call.options.credentials,'omit');assert.equal(call.options.redirect,'error');assert.equal(call.options.headers.get('Authorization'),'Bearer access-one');assert.equal(call.options.headers.get('X-CSRF-Token'),'csrf-access-one');assert.equal(call.options.headers.get('Cookie'),null);assert.equal(call.options.headers.get('X-Daya-Origin'),null);assert.equal(call.options.headers.get('Origin'),null);
 await b.fetch('https://elsewhere.test/api/state');assert.equal(b.calls.at(-1).options,undefined);
 await b.fetch('/Dayas/assets/logo.svg');assert.equal(b.calls.at(-1).url,'/Dayas/assets/logo.svg');assert.equal(b.calls.at(-1).options,undefined);
 const reload=browser(async()=>Response.json({user:null}));await reload.fetch('/api/state');assert.equal(reload.calls[0].options.headers.get('Authorization'),null);
 b.events.pagehide();await b.fetch('/api/state');assert.equal(b.calls.at(-1).options.headers.get('Authorization'),null);
});
test('static review is local, readonly and carries no session headers',async()=>{
 const b=browser(async()=>Response.json({sample:true}));assert.equal((await b.fetch('/api/review')).status,200);assert.equal(b.calls[0].url,ORIGIN+'/Dayas/api/review.json');assert.equal(b.calls[0].options.headers,undefined);const count=b.calls.length;assert.equal((await b.fetch('/api/review',{method:'POST',body:'{}'})).status,403);assert.equal(b.calls.length,count);
});
test('concurrent expiry refreshes once and uses rotated token plus csrf',async()=>{
 let refreshes=0;
 const b=browser(async(url)=>{if(url.endsWith('/api/auth/login'))return Response.json(session('old',Math.floor(Date.now()/1000)+5));if(url.endsWith('/api/auth/refresh')){refreshes++;await new Promise(resolve=>setTimeout(resolve,5));return Response.json(session('new'));}return Response.json({user:{id:'owner'}});});
 await login(b);await Promise.all([b.fetch('/api/state'),b.fetch('/api/state')]);assert.equal(refreshes,1);const states=b.calls.filter(c=>c.url.endsWith('/api/state'));assert.equal(states.length,2);for(const c of states){assert.equal(c.options.headers.get('Authorization'),'Bearer new');assert.equal(c.options.headers.get('X-CSRF-Token'),'csrf-new');}
});
test('401 retries once with same operation body and clears after a second rejection',async()=>{
 let refreshes=0,operations=0;
 const b=browser(async(url)=>{if(url.endsWith('/api/auth/login'))return Response.json(session());if(url.endsWith('/api/auth/refresh')){refreshes++;return Response.json(session('rotated'));}if(url.endsWith('/api/operation')){operations++;return Response.json({error:'Revoked'},{status:401});}return Response.json({user:null});});
 await login(b);const payload=JSON.stringify({operation:'pay',args:['sale',20,'Efectivo'],revision:4,requestId:'same-idempotency-request'});const r=await b.fetch('/api/operation',{method:'POST',body:payload});assert.equal(r.status,401);assert.equal(refreshes,1);assert.equal(operations,2);for(const c of b.calls.filter(c=>c.url.endsWith('/api/operation')))assert.equal(c.options.body,payload);
 await b.fetch('/api/state');assert.equal(b.calls.at(-1).options.headers.get('Authorization'),null);assert.equal(refreshes,1);
});
test('bad password and anonymous 401 never attempt refresh',async()=>{
 const b=browser(async(url)=>Response.json({error:'Denied'},{status:url.endsWith('login')?400:401}));await login(b);await b.fetch('/api/state');assert.equal(b.calls.some(c=>c.url.endsWith('/api/auth/refresh')),false);
});
test('logout discards memory even when network rejects and in-flight refresh cannot revive it',async()=>{
 let finishRefresh,startedRefresh;
 const started=new Promise(resolve=>startedRefresh=resolve);
 const b=browser(async(url)=>{if(url.endsWith('/api/auth/login'))return Response.json(session('old',Math.floor(Date.now()/1000)+5));if(url.endsWith('/api/auth/refresh')){startedRefresh();return new Promise(resolve=>finishRefresh=()=>resolve(Response.json(session('resurrected'))));}if(url.endsWith('/api/auth/logout'))throw Error('Network unavailable');return Response.json({user:null});});
 await login(b);const pending=b.fetch('/api/state');await started;await assert.rejects(b.fetch('/api/auth/logout',{method:'POST',body:'{}'}));finishRefresh();assert.equal((await pending).status,401);await b.fetch('/api/state');assert.equal(b.calls.at(-1).options.headers.get('Authorization'),null);
});
test('successful reset clears memory and Request objects preserve POST semantics',async()=>{
 const b=browser(async(url)=>url.endsWith('/api/auth/login')?Response.json(session()):Response.json({ok:true}));await login(b);
 const request=new Request(ORIGIN+'/api/auth/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"password":"a-new-long-password"}'});assert.equal((await b.fetch(request)).status,200);assert.equal(b.calls.at(-1).options.body,'{"password":"a-new-long-password"}');await b.fetch('/api/state');assert.equal(b.calls.at(-1).options.headers.get('Authorization'),null);
});
