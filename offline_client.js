import {createOfflineAdapter} from './offline.js?v=0.280';

const SAVE_KEY='ciudad-viva-offline-v1';
export async function createOfflineWorkerAdapter(snapshot=null,onSnapshot=()=>{}){
  try{if(snapshot)localStorage.setItem(SAVE_KEY,snapshot);else localStorage.removeItem(SAVE_KEY)}catch{}
  if(typeof Worker==='undefined'){
    const adapter=await createOfflineAdapter();
    return {...adapter,close(){},async request(path,body){const result=await adapter.request(path,body);onSnapshot(localStorage.getItem(SAVE_KEY));return result}};
  }
  const worker=new Worker(new URL('./offline_worker.js?v=0.280',import.meta.url),{type:'module'}),pending=new Map();let nextId=1,readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject});
  worker.addEventListener('message',event=>{
    const message=event.data||{};
    if(message.type==='ready'){if(message.snapshot){try{localStorage.setItem(SAVE_KEY,message.snapshot)}catch{}onSnapshot(message.snapshot)}readyResolve();return}
    if(message.type==='initError'){readyReject(Error(message.error));worker.terminate();return}
    const request=pending.get(message.id);if(!request)return;pending.delete(message.id);
    if(message.snapshot){try{localStorage.setItem(SAVE_KEY,message.snapshot)}catch{}onSnapshot(message.snapshot)}
    if(message.error)request.reject(Error(message.error));else request.resolve(message.result);
  });
  worker.addEventListener('error',event=>{const error=Error(event.message||'Se interrumpió la simulación offline.');readyReject(error);for(const item of pending.values())item.reject(error);pending.clear()});
  worker.postMessage({type:'init',snapshot});
  await ready;
  return {close(){worker.terminate();for(const request of pending.values())request.reject(Error('Se cerró esta partida offline.'));pending.clear()},setRealtimeClock(enabled=true){worker.postMessage({type:'clock',enabled})},async request(path,body){await ready;return new Promise((resolve,reject)=>{const id=nextId++;pending.set(id,{resolve,reject});worker.postMessage({type:'request',id,path,body})})}};
}
