import {createOfflineAdapter} from './offline.js?v=0.238';

const SAVE_KEY='ciudad-viva-offline-v1';
export async function createOfflineWorkerAdapter(){
  if(typeof Worker==='undefined')return createOfflineAdapter();
  const worker=new Worker(new URL('./offline_worker.js?v=0.238',import.meta.url),{type:'module'}),pending=new Map();let nextId=1,readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject});
  worker.addEventListener('message',event=>{
    const message=event.data||{};
    if(message.type==='ready'){if(message.snapshot)localStorage.setItem(SAVE_KEY,message.snapshot);readyResolve();return}
    if(message.type==='initError'){readyReject(Error(message.error));worker.terminate();return}
    const request=pending.get(message.id);if(!request)return;pending.delete(message.id);
    if(message.snapshot)localStorage.setItem(SAVE_KEY,message.snapshot);
    if(message.error)request.reject(Error(message.error));else request.resolve(message.result);
  });
  worker.addEventListener('error',event=>{const error=Error(event.message||'Se interrumpió la simulación offline.');readyReject(error);for(const item of pending.values())item.reject(error);pending.clear()});
  worker.postMessage({type:'init',snapshot:localStorage.getItem(SAVE_KEY)});
  await ready;
  return {setRealtimeClock(enabled=true){worker.postMessage({type:'clock',enabled})},async request(path,body){await ready;return new Promise((resolve,reject)=>{const id=nextId++;pending.set(id,{resolve,reject});worker.postMessage({type:'request',id,path,body})})}};
}
