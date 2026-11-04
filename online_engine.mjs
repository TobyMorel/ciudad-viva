/**
 * Motor autoritativo de una sala LAN.
 * Importa EXACTAMENTE el adaptador de Offline, sin duplicar las reglas de Ciudad Viva.
 * El servidor Python sólo transporta acciones y snapshots.
 *
 * Protocolo: un objeto JSON por línea de stdin; un resultado JSON por línea de stdout.
 * Ejecutar: node online_engine.mjs
 */
import {createInterface} from 'node:readline';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createOfflineAdapter} from './offline.js';

const SAVE_KEY='ciudad-viva-offline-v1';
const memory=new Map();
const seedFile=fileURLToPath(new URL('./offline_seed.json',import.meta.url));
const seed=JSON.parse(await readFile(seedFile,'utf8'));
globalThis.localStorage={
  getItem(key){return memory.get(String(key))??null},
  setItem(key,value){memory.set(String(key),String(value))},
  removeItem(key){memory.delete(String(key))},
  clear(){memory.clear()}
};
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
  if(String(url).split('?')[0]==='offline_seed.json')return{ok:true,status:200,json:async()=>structuredClone(seed)};
  if(originalFetch)return originalFetch(url,options);
  throw Error('Recurso no disponible en el motor compartido: '+url);
};
let adapter=null;
function fillMissingFields(value,defaults){
  // Upgrade snapshots from the former Python LAN engine without replacing any
  // existing city, money, buildings, roads or player-made decisions.
  if(!defaults||typeof defaults!=='object'||Array.isArray(defaults))return value;
  const result=value&&typeof value==='object'&&!Array.isArray(value)?{...value}:{};
  for(const [key,defaultValue] of Object.entries(defaults)){
    if(result[key]===undefined||result[key]===null)result[key]=structuredClone(defaultValue);
    else if(defaultValue&&typeof defaultValue==='object'&&!Array.isArray(defaultValue))
      result[key]=fillMissingFields(result[key],defaultValue);
  }
  return result;
}
async function initialize(snapshot=null){
  if(snapshot!==null&&(typeof snapshot!=='object'||Array.isArray(snapshot)))throw Error('El guardado compartido debe ser un objeto JSON.');
  const previous=memory.get(SAVE_KEY),oldAdapter=adapter;
  try{
    memory.clear();
    if(snapshot)memory.set(SAVE_KEY,JSON.stringify(fillMissingFields(snapshot,seed)));
    const next=await createOfflineAdapter();
    next.setRealtimeClock(true);
    const view=await next.request('/api/state');
    adapter=next;
    return view;
  }catch(error){
    memory.clear();
    if(previous!==undefined)memory.set(SAVE_KEY,previous);
    adapter=oldAdapter;
    throw error;
  }
}
async function dispatch(message){
  const command=message.op;
  if(command==='init'||command==='load')return{view:await initialize(message.snapshot??null)};
  if(!adapter)throw Error('Primero hay que inicializar el motor compartido.');
  if(command==='state')return{view:await adapter.request('/api/state')};
  if(command==='action')return{view:await adapter.request('/api/action',message.action||{})};
  if(command==='snapshot'){
    // /api/state actualiza el estado persistido y ejecuta el reloj de Offline.
    const view=await adapter.request('/api/state');
    const raw=memory.get(SAVE_KEY);
    if(!raw)throw Error('No fue posible guardar la partida compartida.');
    return{snapshot:JSON.parse(raw),day:view.day,name:view.name||'Puerto Claro'};
  }
  throw Error('Comando de simulación desconocido.');
}
let queue=Promise.resolve();
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
  if(!line.trim())continue;
  queue=queue.then(async()=>{
    let id=null;
    try{
      const message=JSON.parse(line);id=message.id;
      const value=await dispatch(message);
      process.stdout.write(JSON.stringify({id,ok:true,...value})+'\n');
    }catch(error){
      process.stdout.write(JSON.stringify({id,ok:false,error:String(error?.message||error)})+'\n');
    }
  }).catch(error=>process.stderr.write(String(error)+'\n'));
}
await queue;
