// Ciudad Viva · directorio público de partidas alojadas en las PCs de los jugadores.
// Única infraestructura central: metadatos y protección de anuncios.
// Este endpoint no ejecuta simulación ni guarda ciudades.
const URL_BASE = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const REST = URL_BASE + "/rest/v1/public_rooms";
const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*","access-control-allow-headers":"apikey,content-type","access-control-allow-methods":"POST,OPTIONS"};
const LIMIT = 12;
function respond(code: number, data: Record<string,unknown>) {
  return new Response(JSON.stringify(data), {status:code,headers:JSON_HEADERS});
}
function safeText(v:unknown, limit:number) {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g," ").trim().replace(/\s+/g," ").slice(0,limit) : "";
}
function safeEquals(a:string,b:string){
  const left=new TextEncoder().encode(a),right=new TextEncoder().encode(b);
  let diff=left.length^right.length;
  for(let i=0;i<Math.max(left.length,right.length);i++)diff|=(left[i]||0)^(right[i]||0);
  return diff===0;
}
async function digest(value:string) {
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
function headers(prefer?:string){
  const h:Record<string,string>={"apikey":SERVICE_KEY,"Authorization":"Bearer "+SERVICE_KEY,"Content-Type":"application/json"};
  if(prefer)h["Prefer"]=prefer;
  return h;
}
async function jsonOrEmpty(response:Response){
  const text=await response.text();
  try{return text?JSON.parse(text):null}catch{return null}
}
async function getRoom(id:string){
  const response=await fetch(REST+"?select=id,owner_secret_hash&id=eq."+encodeURIComponent(id)+"&limit=1",{headers:headers()});
  if(!response.ok)throw Error("Error al consultar propiedad de sala");
  const data=await jsonOrEmpty(response);
  return Array.isArray(data)&&data.length?data[0]:null;
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return respond(200,{ok:true});
 if(req.method!=="POST")return respond(405,{error:"Método no permitido"});
 if(!URL_BASE.startsWith("https://")||!SERVICE_KEY)return respond(503,{error:"Directorio sin credenciales de servicio"});
 const length=Number(req.headers.get("content-length")||"0");
 if(length>8192)return respond(413,{error:"Anuncio demasiado grande"});
 let body:Record<string,unknown>;
 try{
   const raw=await req.text();
   if(raw.length>8192)throw Error("Too large");
   body=JSON.parse(raw);
   if(!body||typeof body!=="object"||Array.isArray(body))throw Error("Bad payload");
 }catch{return respond(400,{error:"JSON inválido"})}
 const action=body.action;
 const id=String(body.id||"");
 const token=String(body.token||"");
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)
    || !/^[0-9a-f]{64}$/.test(token))
   return respond(400,{error:"Identificador o token inválido"});
 if(action!=="publish"&&action!=="unpublish")return respond(400,{error:"Acción inválida"});
 const hashed=await digest(token);
 try{
  const existing=await getRoom(id);
  if(action==="unpublish"){
    if(!existing)return respond(200,{ok:true});
    if(!safeEquals(existing.owner_secret_hash,hashed))return respond(403,{error:"Sin autorización para retirar esa sala"});
    const removed=await fetch(REST+"?id=eq."+id,{method:"DELETE",headers:headers()});
    if(!removed.ok)throw Error("No se pudo retirar el anuncio");
    return respond(200,{ok:true});
  }
  const city=safeText(body.city,64),host=safeText(body.host_name,32),join_url=String(body.join_url||"");
  const players=Number(body.players);
  if(!city||!host||!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/?$/.test(join_url)
     ||!Number.isInteger(players)||players<1||players>LIMIT)
     return respond(400,{error:"Metadatos de sala inválidos"});
  if(existing&&!safeEquals(existing.owner_secret_hash,hashed))
     return respond(403,{error:"La sala pertenece a otro anfitrión"});
  const record:Record<string,unknown>={
    city,host_name:host,join_url,players,max_players:LIMIT,
    last_seen:new Date().toISOString()
  };
  if(!existing){
    // Un anfitrión puede anunciar su sala sin crear cuenta ni configurar credenciales.
    // Se conserva sólo el hash del token, nunca el secreto original.
    record.id=id;
    record.owner_secret_hash=hashed;
    const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||
      (req.headers.get("x-forwarded-for")||"").split(",").at(-1)?.trim()||"";
    if(ip){
      const pepper=SERVICE_KEY.slice(0,32);
      record.owner_ip_hash=await digest(ip+"|"+pepper);
      const cutoff=new Date(Date.now()-90000).toISOString();
      const filter="?select=id&owner_ip_hash=eq."+record.owner_ip_hash+"&last_seen=gte."+encodeURIComponent(cutoff)+"&limit=4";
      const check=await fetch(REST+filter,{headers:headers()});
      if(check.ok){
        const rows=await jsonOrEmpty(check);
        if(Array.isArray(rows)&&rows.length>=3)return respond(429,{error:"Máximo de tres salas activas por conexión"});
      }
    }
    const created=await fetch(REST,{method:"POST",headers:headers("return=minimal"),body:JSON.stringify(record)});
    if(!created.ok){
      const txt=(await created.text()).slice(0,300);
      return respond(created.status===409?409:502,{error:"No se pudo anunciar la sala",detail:txt});
    }
  }else{
    const updated=await fetch(REST+"?id=eq."+id+"&owner_secret_hash=eq."+hashed,{
      method:"PATCH",headers:headers("return=minimal"),body:JSON.stringify(record)
    });
    if(!updated.ok)throw Error("No se pudo actualizar el anuncio");
  }
  return respond(200,{ok:true,listed:true});
 }catch(error){
   console.error("public-rooms: "+String(error));
   return respond(502,{error:"Servicio del directorio temporalmente no disponible"});
 }
});