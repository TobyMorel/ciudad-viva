import {createOfflineAdapter} from './offline.js?v=0.294';

const SAVE_KEY='ciudad-viva-offline-v1';
const memory=new Map();
globalThis.localStorage={
  getItem(key){return memory.get(String(key))??null},
  setItem(key,value){memory.set(String(key),String(value))},
  removeItem(key){memory.delete(String(key))}
};
let adapter=null,lastRevision=-1,lastSnapshotAt=0;
self.addEventListener('message',async event=>{
  const message=event.data||{};
  if(message.type==='init'){
    if(message.snapshot)memory.set(SAVE_KEY,message.snapshot);
    try{adapter=await createOfflineAdapter();adapter.setRealtimeClock(true);lastRevision=-1;lastSnapshotAt=Date.now();self.postMessage({type:'ready',snapshot:memory.get(SAVE_KEY)||null,diagnostics:adapter.getRuntimeDiagnostics?.()||null})}
    catch(error){self.postMessage({type:'initError',error:error?.message||'No se pudo iniciar la ciudad offline.'})}
    return;
  }
  if(message.type==='clock'){adapter?.setRealtimeClock(Boolean(message.enabled));return}
  if(message.type!=='request'||!adapter)return;
  try{
    const result=await adapter.request(message.path,message.body),revision=Number(result?.stateRevision??-1),now=Date.now(),persist=message.path==='/api/save'||message.path==='/api/load'||revision!==lastRevision||message.path==='/api/state'&&now-lastSnapshotAt>=5000;
    if(revision>=0)lastRevision=revision;if(persist)lastSnapshotAt=now;
    self.postMessage({type:'response',id:message.id,result,snapshot:persist?(memory.get(SAVE_KEY)||null):null});
  }catch(error){self.postMessage({type:'response',id:message.id,error:error?.message||'Falló la simulación offline.'})}
});
