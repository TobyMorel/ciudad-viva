const LEGACY_KEY='ciudad-viva-offline-v1';
const DB_NAME='ciudad-viva-partidas';

function database(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('slots',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function transaction(mode,run){
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('slots',mode),request=run(tx.objectStore('slots'));
    let result;
    request.onsuccess=()=>{result=request.result};
    tx.oncomplete=()=>{db.close();resolve(result)};
    tx.onerror=()=>{db.close();reject(tx.error)};
  });
}

export async function listOfflineSlots(){
  let slots=await transaction('readonly',store=>store.getAll());
  if(!slots.length){
    const legacy=localStorage.getItem(LEGACY_KEY);
    if(legacy){
      try{
        const city=JSON.parse(legacy);
        const slot={id:crypto.randomUUID(),name:'Partida anterior',city:city.name||'Puerto Claro',day:city.day||1,updatedAt:Date.now(),snapshot:legacy};
        await transaction('readwrite',store=>store.put(slot));slots=[slot];
      }catch{}
    }
  }
  return slots.sort((a,b)=>b.updatedAt-a.updatedAt).map(({snapshot,...info})=>info);
}

export async function getOfflineSlot(id){return transaction('readonly',store=>store.get(id))}

export async function createOfflineSlot(name){
  const slot={id:crypto.randomUUID(),name:String(name||'Nueva partida').trim().slice(0,48)||'Nueva partida',city:'Puerto Claro',day:1,updatedAt:Date.now(),snapshot:null};
  await transaction('readwrite',store=>store.put(slot));return slot;
}

export async function updateOfflineSlot(id,snapshot){
  if(!snapshot)return;
  const old=await getOfflineSlot(id);if(!old)return;
  const city=JSON.parse(snapshot);
  await transaction('readwrite',store=>store.put({...old,city:city.name||'Puerto Claro',day:city.day||1,updatedAt:Date.now(),snapshot}));
}
