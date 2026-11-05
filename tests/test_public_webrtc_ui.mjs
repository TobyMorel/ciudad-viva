/** Prueba real entre dos navegadores, Supabase Realtime y RTCDataChannel.
 * La ciudad usa el motor del anfitrión: aquí simulamos sólo cuatro APIs.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const moduleCode=readFileSync(new URL('../public_rtc.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../public_directory.json',import.meta.url),'utf8');
const readBody=req=>new Promise(resolve=>{let raw='';req.on('data',v=>raw+=v);req.on('end',()=>resolve(raw))});
const called=[];
const web=createServer(async(req,res)=>{
 res.setHeader('Content-Type',req.url==='/public_rtc.js'?'text/javascript':'application/json');
 if(req.url==='/public_rtc.js'){res.end(moduleCode);return}
 if(req.url==='/public_directory.json'){res.end(config);return}
 if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>RTC test</title>');return}
 called.push(req.url);
 const raw=await readBody(req);
 const data={
  '/api/room/join':{roomOpen:true,stateRevision:1,online:2},
  '/api/state':{stateRevision:1,online:2,city:'Test RTC',large:'x'.repeat(120000)},
  '/api/action':{ok:true,action:JSON.parse(raw||'{}').action}
 }[req.url];
 if(!data){res.writeHead(404);res.end(JSON.stringify({error:'No disponible'}));return}
 res.end(JSON.stringify(data));
});
const listen=()=>new Promise(resolve=>web.listen(0,'127.0.0.1',resolve));
const close=()=>new Promise(resolve=>web.close(resolve));
await listen();
const address='http://127.0.0.1:'+web.address().port;
const browser=await chromium.launch({headless:true});
let host,guest;
try{
 host=await browser.newPage();guest=await browser.newPage();
 await Promise.all([host.goto(address),guest.goto(address)]);
 const roomId=randomUUID();
 const pub=await host.evaluate(async id=>{
  const mod=await import('/public_rtc.js');
  window.rtcHost=await mod.startRtcHost({roomId:id,activate:async key=>{window.hostKey=key}});
  return window.hostKey;
 },roomId);
 if(!pub)throw Error('No se publicó la clave ECDSA del anfitrión');
 const result=await guest.evaluate(async(room)=>{
  const mod=await import('/public_rtc.js');
  window.rtcClient=await mod.connectRtcRoom(room,{timeoutMs:15000});
  const denied=await window.rtcClient.fetch('/api/state');
  if(denied.status!==403)throw Error('No rechazó el acceso previo a join: '+denied.status);
  const join=await window.rtcClient.fetch('/api/room/join',{
   method:'POST',body:JSON.stringify({name:'Jugador de prueba'})
  });
  if(join.status!==200)throw Error('No permitió unirse: '+join.status);
  const payload=await join.json();
  if(!/^public-[0-9a-f]{24}$/.test(payload.publicPlayerId||''))
   throw Error('Identidad invitada no asignada por anfitrión');
  const state=await window.rtcClient.fetch('/api/state');
  if(!state.ok)throw Error('El canal WebRTC no transportó el estado de la ciudad');
  const city=await state.json();
  if(city.large?.length!==120000)throw Error('Trama WebRTC grande incompleta');
  const admin=await window.rtcClient.fetch('/api/save',{method:'POST',body:'{}'});
  if(admin.status!==403)throw Error('Permitió una llamada administrativa');
  const newCity=await window.rtcClient.fetch('/api/action',{
   method:'POST',body:'{"action":"new"}'
  });
  if(newCity.status!==403)throw Error('Permitió reiniciar una ciudad remota');
  const action=await window.rtcClient.fetch('/api/action',{
   method:'POST',body:'{"action":"pause"}'
  });
  if(!action.ok)throw Error('No permitió una acción municipal');
  return {transport:'WebRTC DTLS',identity:payload.publicPlayerId,bytes:city.large.length};
 },{id:roomId,rtcPublicKey:pub});
 if(!called.includes('/api/state')||called.includes('/api/save'))
  throw Error('El anfitrión no autorizó correctamente la ruta local');
 console.log('WEBRTC_REAL_BROWSER_PASS '+JSON.stringify(result));
}finally{
 try{await guest?.evaluate(()=>window.rtcClient?.close())}catch{}
 try{await host?.evaluate(()=>window.rtcHost?.close())}catch{}
 await browser.close();await close();
}
