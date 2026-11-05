const LEGACY_KEY='ciudad-viva-offline-v1';
const MIGRATION_KEY='ciudad-viva-legacy-imported-v1';
const DB_NAME='ciudad-viva-partidas';
const MAX_BACKUPS=2;
const MAX_RECOVERED_SLOTS=2;
function markMigrated(){try{localStorage.setItem(MIGRATION_KEY,'1')}catch{}}
function isRecoveredSlot(slot){return Boolean(slot?.recoveredFromBackup)||/\s·\srecuperada$/i.test(String(slot?.name||''))}

function database(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,2);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('slots'))db.createObjectStore('slots',{keyPath:'id'});
      if(!db.objectStoreNames.contains('backups'))db.createObjectStore('backups',{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function transaction(mode,run,storeName='slots'){
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,mode),request=run(tx.objectStore(storeName));
    let result;
    request.onsuccess=()=>{result=request.result};
    tx.oncomplete=()=>{db.close();resolve(result)};
    tx.onerror=()=>{db.close();reject(tx.error)};
  });
}

export async function listOfflineSlots(){
  let slots=await transaction('readonly',store=>store.getAll());
  if(slots.length)markMigrated();
  if(!slots.length&&localStorage.getItem(MIGRATION_KEY)!=='1'){
    const legacy=localStorage.getItem(LEGACY_KEY);
    if(legacy){
      try{
        const city=JSON.parse(legacy);
        const slot={id:crypto.randomUUID(),name:'Partida anterior',city:city.name||'Puerto Claro',day:city.day||1,updatedAt:Date.now(),snapshot:legacy};
        await transaction('readwrite',store=>store.put(slot));slots=[slot];
        markMigrated();
      }catch{}
    }
  }
  return slots.sort((a,b)=>b.updatedAt-a.updatedAt).map(({snapshot,...info})=>info);
}

export async function getOfflineSlot(id){return transaction('readonly',store=>store.get(id))}

export async function deleteOfflineSlot(id){
  await transaction('readwrite',store=>store.delete(id));
  const backups=await transaction('readonly',store=>store.getAll(),'backups');
  for(const backup of backups)if(backup.slotId===id)await transaction('readwrite',store=>store.delete(backup.id),'backups');
  if(!(await transaction('readonly',store=>store.getAll())).length){localStorage.removeItem(LEGACY_KEY);markMigrated()}
}

export async function listOfflineBackups(){
  const backups=await transaction('readonly',store=>store.getAll(),'backups');
  backups.sort((a,b)=>(Number(b.createdAt)||0)-(Number(a.createdAt)||0)||String(b.id).localeCompare(String(a.id)));
  for(const backup of backups.slice(MAX_BACKUPS))await deleteOfflineBackup(backup.id);
  return backups.slice(0,MAX_BACKUPS).map(({snapshot,...info})=>info);
}

export async function getOfflineBackup(id){return transaction('readonly',store=>store.get(id),'backups')}

export async function deleteOfflineBackup(id){await transaction('readwrite',store=>store.delete(id),'backups')}

export async function restoreOfflineBackup(id){
  const backup=await getOfflineBackup(id);
  if(!backup?.snapshot)throw Error('Esa copia de seguridad ya no está disponible.');
  const slot={id:crypto.randomUUID(),name:`${backup.name} · recuperada`.slice(0,48),city:backup.city,day:backup.day,updatedAt:Date.now(),recoveredFromBackup:true,recoveredBackupId:backup.id,snapshot:backup.snapshot};
  const db=await database();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction('slots','readwrite'),store=tx.objectStore('slots'),request=store.getAll();let full=false;
    request.onsuccess=()=>{
      const recovered=request.result.filter(isRecoveredSlot);
      if(recovered.length>=MAX_RECOVERED_SLOTS){full=true;tx.abort();return}
      store.add(slot);
    };
    tx.oncomplete=()=>{db.close();resolve()};
    tx.onabort=()=>{db.close();reject(full?Error('Ya hay dos partidas recuperadas. Eliminá una desde la lista antes de recuperar otra.'):tx.error||Error('No se pudo crear la partida recuperada.'))};
    tx.onerror=()=>{db.close();reject(tx.error||Error('No se pudo crear la partida recuperada.'))};
  });
  return slot;
}

export async function createOfflineSlot(name){
  const slot={id:crypto.randomUUID(),name:String(name||'Nueva partida').trim().slice(0,48)||'Nueva partida',city:'Puerto Claro',day:1,updatedAt:Date.now(),snapshot:null};
  await transaction('readwrite',store=>store.put(slot));return slot;
}

export async function updateOfflineSlot(id,snapshot){
  if(!snapshot)return;
  const old=await getOfflineSlot(id);if(!old)return;
  const city=JSON.parse(snapshot);
  const now=Date.now(),needsBackup=old.snapshot&&old.snapshot!==snapshot&&(!old.lastBackupAt||now-old.lastBackupAt>=10*60*1000||Number(city.day||1)<Number(old.day||1));
  if(needsBackup){
    await transaction('readwrite',store=>store.put({id:crypto.randomUUID(),slotId:id,name:old.name,city:old.city,day:old.day,createdAt:now,snapshot:old.snapshot}),'backups');
    await listOfflineBackups();
    old.lastBackupAt=now;
  }
  await transaction('readwrite',store=>store.put({...old,city:city.name||'Puerto Claro',day:city.day||1,updatedAt:now,snapshot}));
}
