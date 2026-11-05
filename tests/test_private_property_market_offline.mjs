import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

const seed=()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
test('Offline/LAN: oferta privada se puede retirar y un inversor compra al cierre mensual',async()=>{
 const original={fetch:globalThis.fetch,storage:globalThis.localStorage,now:Date.now},city=seed(),store=new Map();let now=0;
 city.day=30;city.lastMonth=0;city.paused=false;city.speed=1;city.money=100000;city.privateCapital=9000;city.population=2;city.jobs=0;
 city.roads=[[4,10],[5,10],[6,10]];city.roadAssets=[];city.projects=[];city.workplaces=[];city.buildings=[{id:'home-6-10',x:6,y:10,kind:'home',name:'Casa del Parque',quality:82,ownerType:'private',status:'habilitado',zonedDevelopment:true,occupants:2,capacity:2,householdCash:500,residents:[],housingContracts:[]}];
 city.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1'],expansionCount:0,chunkTitles:{},parcelDeeds:{'6,10':{id:'CV-P-6-10',x:6,y:10,ownerType:'private',ownerId:'home-6-10',ownerName:'Casa del Parque'}},registryVersion:1};
 city.utilities={...(city.utilities||{}),failures:[],powerLines:city.roads.map(row=>row.slice()),waterPipes:city.roads.map(row=>row.slice()),sewerLines:city.roads.map(row=>row.slice()),drainLines:city.roads.map(row=>row.slice()),gasLines:city.roads.map(row=>row.slice()),telecomLines:city.roads.map(row=>row.slice())};
 store.set('ciudad-viva-offline-v1',JSON.stringify(city));globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};globalThis.fetch=async()=>({ok:true,json:async()=>seed()});Date.now=()=>now;
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);
  let view=await adapter.request('/api/action',{action:'listPrivateProperty',x:6,y:10});
  assert.equal(view.landClaims.parcelDeeds['6,10'].saleListing.status,'en venta');
  view=await adapter.request('/api/action',{action:'cancelPrivatePropertyListing',x:6,y:10});
  assert.equal(view.landClaims.parcelDeeds['6,10'].saleListing.status,'retirada');
  await adapter.request('/api/action',{action:'listPrivateProperty',x:6,y:10});now+=1000;
  view=await adapter.request('/api/state');const deed=view.landClaims.parcelDeeds['6,10'];
  assert.equal(view.day,31);assert.equal(deed.ownerType,'private');assert.match(deed.ownerName,/Inversiones|Desarrollos|Hábitat/);
  assert.equal(deed.saleListing.status,'vendida');assert.equal(deed.transferHistory.at(-1).type,'transferencia privada');
  assert.equal(view.privatePropertyMarket.lastClose.sold,1);assert.equal(view.privateCapital,4800);
 }finally{globalThis.fetch=original.fetch;Date.now=original.now;if(original.storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=original.storage}
});
