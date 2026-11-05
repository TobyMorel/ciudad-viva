/**
 * Ciudad Viva: transporte WebRTC P2P con señalización Supabase Realtime.
 *
 * Supabase sólo transmite ofertas/respuestas SDP. Las partidas y acciones
 * viajan por RTCDataChannel cifrado DTLS; cada petición pasa por el motor
 * autoritativo del anfitrión. La clave pública ECDSA de la sala se publica
 * mediante el token privado del anfitrión y autentica las respuestas.
 * No requiere paquetes externos en las computadoras.
 */
const ICE_SERVERS=[{urls:["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302"]}];
const SIGNAL_EVENT="cv_webrtc_v1";
const MAX_FRAME=11000;
const MAX_PACKET=24*1024*1024;
const MAX_FRAGMENTS=2600;
const PEER_LIMIT=12;
export const ALLOWED_GET=new Set(["/api/info","/api/state","/api/sync","/api/cursors"]);
export const ALLOWED_POST=new Set(["/api/room/join","/api/action","/api/chat","/api/cursors"]);

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fail=message=>{throw Error(message)};
const id=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(c=>c.toString(16).padStart(2,"0")).join("");
const bytes=new TextEncoder();

let rtcConfigCache=null;
export async function loadRtcConfig(){
 if(rtcConfigCache)return rtcConfigCache;
 // El .exe consulta el JSON público local. Un invitado que abrió el
 // enlace Cloudflare obtiene sólo las mismas claves PUBLICABLES desde
 // /api/public/config; se cachean para sobrevivir a una caída del túnel.
 let response;
 // Resolve the public config relative to this module so project sites such
 // as GitHub Pages (/ciudad-viva/) do not incorrectly request it at host root.
 try{response=await fetch(new URL("./public_directory.json",import.meta.url),{cache:"no-store"})}catch{}
 if(!response?.ok){
  response=await fetch("/api/public/config",{cache:"no-store"});
 }
 if(!response.ok)fail("No se pudo leer la configuración pública de señalización.");
 const data=await response.json();
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(data?.supabaseUrl||"")||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(data?.supabaseAnonKey||""))
  fail("Configuración de señalización inválida.");
 rtcConfigCache={base:data.supabaseUrl,key:data.supabaseAnonKey};
 return rtcConfigCache;
}
function readyWithTimeout(promise,timeout,message){
 return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error(message)),timeout))]);
}
async function waitForIce(peer,ms=6500){
 if(peer.iceGatheringState==="complete")return;
 await Promise.race([new Promise(resolve=>{
  const done=()=>{if(peer.iceGatheringState==="complete"){peer.removeEventListener("icegatheringstatechange",done);resolve()}};
  peer.addEventListener("icegatheringstatechange",done);
  done();
 }),pause(ms)]);
}
function newPeer(){
 if(typeof RTCPeerConnection==="undefined")fail("Este equipo no tiene WebRTC disponible.");
 return new RTCPeerConnection({iceServers:ICE_SERVERS,iceCandidatePoolSize:1});
}
async function sendChunks(channel,kind,requestId,payload){
 const text=JSON.stringify(payload);
 if(text.length>MAX_PACKET)fail("Respuesta WebRTC excesivamente grande.");
 const total=Math.max(1,Math.ceil(text.length/MAX_FRAME));
 if(total>MAX_FRAGMENTS)fail("Mensaje WebRTC supera la capacidad permitida.");
 for(let seq=0;seq<total;seq++){
  if(channel.readyState!=="open")fail("Canal WebRTC desconectado.");
  if(channel.bufferedAmount>256000){
   channel.bufferedAmountLowThreshold=65536;
   await readyWithTimeout(new Promise(resolve=>{
    const done=()=>{channel.removeEventListener("bufferedamountlow",done);resolve()};
    channel.addEventListener("bufferedamountlow",done,{once:true});
   }),12000,"WebRTC congestionado.");
  }
  channel.send(JSON.stringify({k:kind,id:requestId,n:seq,t:total,p:text.slice(seq*MAX_FRAME,(seq+1)*MAX_FRAME)}));
 }
}
function createWire(channel,onPacket,onClose){
 const groups=new Map();
 let closed=false;
 const cleanup=setInterval(()=>{
  for(const [k,v] of groups)if(Date.now()-v.at>30000)groups.delete(k);
 },6000);
 channel.onmessage=event=>{
  let part;try{part=JSON.parse(event.data)}catch{return};
  if(!part||!["req","res"].includes(part.k)||typeof part.id!=="string"||part.id.length>60||
     !Number.isSafeInteger(part.n)||!Number.isSafeInteger(part.t)||part.t<1||part.t>MAX_FRAGMENTS||
     part.n<0||part.n>=part.t||typeof part.p!=="string"||part.p.length>MAX_FRAME)return;
  const key=part.k+":"+part.id;
  if(!groups.has(key)){
   if(groups.size>32)return;
   groups.set(key,{total:part.t,parts:Array(part.t),count:0,length:0,at:Date.now()});
  }
  const group=groups.get(key);
  if(group.total!==part.t||group.parts[part.n]!==undefined)return;
  group.parts[part.n]=part.p;group.length+=part.p.length;group.count++;
  if(group.length>MAX_PACKET){groups.delete(key);return;}
  if(group.count===group.total){
   groups.delete(key);
   try{onPacket(part.k,part.id,JSON.parse(group.parts.join("")))}catch{}
  }
 };
 const close=()=>{
  if(closed)return;
  closed=true;clearInterval(cleanup);groups.clear();onClose?.();
 };
 channel.onclose=close;
 channel.onerror=close;
 return {send:(kind,packetId,payload)=>sendChunks(channel,kind,packetId,payload),close};
}
/**
 * Cliente mínimo del protocolo documentado por Supabase Realtime.
 * topic público, usado únicamente para señalización temporal, nunca para
 * retransmitir datos del juego ni secretos de autorización.
 */
export class SignalChannel{
 constructor(roomId,config,onSignal){
  if(!/^[0-9a-f-]{36}$/.test(roomId))fail("Identificador de sala inválido.");
  this.roomId=roomId;
  this.config=config;
  this.topic="realtime:cv-rtc-"+roomId;
  this.onSignal=onSignal;
  this.ws=null;this.joined=false;this.seq=0;this.heart=null;
 }
 push(event,payload){
  if(this.ws?.readyState!==WebSocket.OPEN)return false;
  this.ws.send(JSON.stringify({topic:event==="heartbeat"?"phoenix":this.topic,
   event,payload,ref:String(++this.seq),join_ref:event==="heartbeat"?null:"1"}));
  return true;
 }
 async open(){
  if(typeof WebSocket==="undefined")fail("No se puede abrir la señalización.");
  const url=this.config.base.replace(/^https:/,"wss:")+
    "/realtime/v1/websocket?apikey="+encodeURIComponent(this.config.key)+"&vsn=1.0.0";
  const ws=new WebSocket(url);this.ws=ws;
  try{
   await readyWithTimeout(new Promise((resolve,reject)=>{
    ws.onopen=()=>{
     ws.send(JSON.stringify({topic:this.topic,event:"phx_join",payload:{
      config:{broadcast:{ack:true,self:false},presence:{enabled:false},private:false}
     },ref:"1",join_ref:"1"}));
    };
    ws.onmessage=event=>{
     let msg;try{msg=JSON.parse(event.data)}catch{return;}
     if(msg.event==="phx_reply"&&msg.ref==="1"){
      if(msg.payload?.status==="ok"){this.joined=true;resolve();}
      else reject(Error("Supabase rechazó la señalización WebRTC."));
     }
     if(msg.topic===this.topic&&msg.event==="broadcast"){
      const p=msg.payload;
      if(p?.event===SIGNAL_EVENT&&p.payload&&typeof p.payload==="object"){
       try{this.onSignal(p.payload)}catch{}
      }
     }
     if(msg.event==="phx_error"||msg.event==="phx_close")this.joined=false;
    };
    ws.onerror=()=>{if(!this.joined)reject(Error("No se pudo conectar con Supabase Realtime."));};
    ws.onclose=()=>{this.joined=false;if(!this.closed)this.onDisconnected?.()};
   }),10000,"No respondió Supabase Realtime.");
   this.heart=setInterval(()=>this.push("heartbeat",{}),20000);
   return this;
  }catch(err){this.close();throw err}
 }
 send(data){
  if(!this.joined)return false;
  return this.push("broadcast",{event:SIGNAL_EVENT,type:"broadcast",payload:data});
 }
 close(){
  this.closed=true;this.joined=false;clearInterval(this.heart);this.ws?.close();
 }
}
const signingContent=(roomId,clientId,sdp)=>roomId+"|"+clientId+"|"+sdp;
const hexToBase64=(buffer)=>btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));

function hostAllowed(req,joined){
 const path=String(req.path||"").split("?")[0];
 const method=String(req.method||"GET").toUpperCase();
 if(!joined&&path!=="/api/room/join"&&path!=="/api/info")return false;
 return method==="POST"?ALLOWED_POST.has(path):method==="GET"&&ALLOWED_GET.has(path);
}
async function handleHostRequest(request,pid,joined){
 if(!request||!hostAllowed(request,joined))return {status:403,body:JSON.stringify({error:"Operación reservada al anfitrión."})};
 const path=String(request.path||"");
 const method=String(request.method||"GET").toUpperCase();
 if(path.length>180||path.includes("%")||path.includes("\\")||path.includes(".."))
  return {status:403,body:'{"error":"Ruta WebRTC inválida."}'};
 if(method==="POST"&&String(request.body||"").length>131072)return {status:413,body:'{"error":"Mensaje demasiado grande."}'};
 if(path.split("?")[0]==="/api/action"){
  let action;try{action=JSON.parse(request.body||"{}").action}catch{return {status:400,body:'{"error":"JSON inválido."}'}}
  if(action==="new")return {status:403,body:'{"error":"El anfitrión debe reiniciar la ciudad."}'};
 }
 if(path==="/api/info")return {status:200,body:JSON.stringify({roomOpen:true,ips:[],publicUrl:null})};
 try{
  const response=await fetch(path,{method,headers:{"Content-Type":"application/json","X-Player-Id":pid},
   body:method==="POST"?String(request.body||"{}"):undefined,cache:"no-store"});
  let body=await response.text();
  if(path==="/api/room/join"&&response.ok){
   try{const parsed=JSON.parse(body);parsed.publicPlayerId=pid;body=JSON.stringify(parsed)}catch{}
  }
  return {status:response.status,body};
 }catch{return {status:502,body:'{"error":"La partida local dejó de responder."}'}}
}
export async function startRtcHost({roomId,activate,onStatus,onPeerLeave}){
 const cfg=await loadRtcConfig();
 const keyPair=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
 const pubKey=JSON.stringify(await crypto.subtle.exportKey("jwk",keyPair.publicKey));
 const peers=new Map();
 let disposed=false;
 const signal=new SignalChannel(roomId,cfg,async m=>{
  if(disposed||m?.type!=="offer"||m.room!==roomId||typeof m.client!=="string"||
     !/^[0-9a-f]{32}$/.test(m.client)||peers.has(m.client)||peers.size>=PEER_LIMIT||
     m.sdp?.type!=="offer"||typeof m.sdp?.sdp!=="string"||m.sdp.sdp.length>40000)return;
  const peer=newPeer(),pid="public-"+id().slice(0,24);
  let joined=false;
  const removeJoinedPeer=()=>{
   if(!joined)return;
   joined=false;
   try{Promise.resolve(onPeerLeave?.(pid)).catch(()=>{})}catch{}
  };
  peers.set(m.client,peer);
  // Un atacante no puede ocupar indefinidamente los 12 espacios enviando
  // ofertas que nunca se conectan: cerrar los peers incompletos tras 25 s.
  const pendingTimer=setTimeout(()=>{
   if(peer.connectionState!=="connected"){
    peers.delete(m.client);try{peer.close()}catch{}
   }
  },25000);
  peer.onconnectionstatechange=()=>{
   if(peer.connectionState==="connected")clearTimeout(pendingTimer);
   if(["closed","failed","disconnected"].includes(peer.connectionState)){
    clearTimeout(pendingTimer);peers.delete(m.client);removeJoinedPeer();try{peer.close()}catch{}
   }
  };
  peer.ondatachannel=event=>{
   const channel=event.channel;
   if(channel.label!=="ciudad-viva-api"){peer.close();return;}
   const wire=createWire(channel,async(kind,rid,req)=>{
    if(kind!=="req")return;
    const result=await handleHostRequest(req,pid,joined);
    if(String(req?.path||"").split("?")[0]==="/api/room/join"&&result.status===200)joined=true;
    try{await wire.send("res",rid,result)}catch{peer.close()}
   },()=>{peers.delete(m.client);removeJoinedPeer();peer.close()});
  };
  try{
   await peer.setRemoteDescription(m.sdp);
   await peer.setLocalDescription(await peer.createAnswer());
   await waitForIce(peer);
   const answer=peer.localDescription;
   const signature=hexToBase64(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},
    keyPair.privateKey,bytes.encode(signingContent(roomId,m.client,answer.sdp))));
   signal.send({type:"answer",room:roomId,client:m.client,sdp:answer,sig:signature});
  }catch{peers.delete(m.client);peer.close()}
 });
 await signal.open();
 try{await activate(pubKey)}catch(error){signal.close();throw error}
 onStatus?.("WebRTC directo disponible");
 const reconnect=async()=>{
  if(disposed)return;
  onStatus?.("WebRTC intentando reconectar la señalización…");
  for(let attempt=0;!disposed&&attempt<12;attempt++){
   await pause(Math.min(20000,1500*(attempt+1)));
   try{await signal.open();onStatus?.("WebRTC directo disponible");return}catch{}
  }
  if(!disposed)onStatus?.("WebRTC no disponible; permanece Cloudflare");
 };
 signal.onDisconnected=()=>{if(!disposed)reconnect()};
 return {close(){disposed=true;signal.close();for(const peer of peers.values())peer.close();peers.clear()}};
}
export async function connectRtcRoom(room,{onDisconnected,timeoutMs=16000}={}){
 const cfg=await loadRtcConfig();
 const pub=typeof room.rtcPublicKey==="string"?JSON.parse(room.rtcPublicKey):room.rtcPublicKey;
 if(!pub||pub.kty!=="EC"||pub.crv!=="P-256")fail("La sala no anunció una clave WebRTC válida.");
 const key=await crypto.subtle.importKey("jwk",pub,{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
 const client=id(),peer=newPeer();
 const pending=new Map();
 let closed=false,wire=null,signal=null,handshakeResolve,handshakeReject;
 const answerPromise=new Promise((resolve,reject)=>{handshakeResolve=resolve;handshakeReject=reject});
 const channel=peer.createDataChannel("ciudad-viva-api",{ordered:true});
 const disconnect=()=>{
  if(closed)return;
  closed=true;for(const wait of pending.values())wait.reject(Error("Conexión WebRTC interrumpida."));
  pending.clear();wire?.close();peer.close();signal?.close();onDisconnected?.();
 };
 try{
  signal=new SignalChannel(room.id,cfg,async m=>{
   if(m?.type!=="answer"||m.room!==room.id||m.client!==client||m.sdp?.type!=="answer"||
      typeof m.sdp?.sdp!=="string"||typeof m.sig!=="string")return;
   try{
    const ok=await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,
     base64ToBuffer(m.sig),bytes.encode(signingContent(room.id,client,m.sdp.sdp)));
    if(!ok)return;
    await peer.setRemoteDescription(m.sdp);
    handshakeResolve();
   }catch(error){handshakeReject(error)}
  });
  await signal.open();
  wire=createWire(channel,(kind,rid,data)=>{
   if(kind!=="res")return;
   const wait=pending.get(rid);
   if(wait){pending.delete(rid);wait.resolve(data)}
  },disconnect);
  peer.onconnectionstatechange=()=>{
   if(["disconnected","failed","closed"].includes(peer.connectionState))disconnect();
  };
  await peer.setLocalDescription(await peer.createOffer());
  await waitForIce(peer);
  if(!signal.send({type:"offer",room:room.id,client,sdp:peer.localDescription}))
   fail("El anfitrión no pudo recibir la solicitud WebRTC.");
  await readyWithTimeout(answerPromise,timeoutMs,"El anfitrión no respondió al intento WebRTC.");
  await readyWithTimeout(new Promise((resolve,reject)=>{
   if(channel.readyState==="open"){resolve();return}
   channel.addEventListener("open",resolve,{once:true});
   channel.addEventListener("close",()=>reject(Error("Canal WebRTC cerrado.")),{once:true});
  }),7000,"No se pudo completar el canal WebRTC.");
  signal.close();signal=null; // Supabase sólo negocia la conexión.
  return {get active(){return !closed&&channel.readyState==="open";},
   async fetch(path,options={}){
    if(closed||channel.readyState!=="open")fail("Conexión WebRTC interrumpida.");
    const rid=id(),method=String(options.method||"GET").toUpperCase();
    const request={path:String(path),method,body:options.body||null};
    const received=new Promise((resolve,reject)=>pending.set(rid,{resolve,reject}));
    try{
     await wire.send("req",rid,request);
     const result=await readyWithTimeout(received,30000,"La PC anfitriona no respondió a WebRTC.");
     if(result?.status<200||result?.status>599||typeof result?.body!=="string")fail("Respuesta WebRTC inválida.");
     return new Response(result.body,{status:result.status,
      headers:{"Content-Type":"application/json; charset=utf-8"}});
    }finally{pending.delete(rid)}
   },
   close:disconnect};
 }catch(error){closed=true;signal?.close();peer.close();throw error}
}
