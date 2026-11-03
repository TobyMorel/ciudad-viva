import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOfflineAdapter} from '../offline.js';

test('Offline: compra municipal transfiere el folio privado y descuenta caja disponible', async()=>{
 const fetch0=globalThis.fetch,storage0=globalThis.localStorage;let stored=JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'));
 stored.newSettlement=true;stored.day=4;stored.money=10000;stored.projects=[];stored.buildings=[{id:'home-6-10',x:6,y:10,kind:'home',name:'Casa del Parque',quality:82,ownerType:'private'}];stored.landClaims={chunkSize:8,unlockedChunks:['0,0','1,0','0,1','1,1'],expansionCount:0,chunkTitles:{},parcelDeeds:{},registryVersion:1};
 globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../offline_seed.json',import.meta.url),'utf8'))});globalThis.localStorage={getItem:()=>JSON.stringify(stored),setItem:(_,value)=>{stored=JSON.parse(value)}};
 try{const adapter=await createOfflineAdapter(),before=stored.money,after=await adapter.request('/api/action',{action:'acquirePrivateProperty',x:6,y:10}),deed=after.landClaims.parcelDeeds['6,10'];assert.equal(after.money,before-4200);assert.equal(deed.ownerType,'municipal');assert.equal(deed.ownerName,`Municipalidad de ${stored.cityName||'Puerto Claro'}`);assert.equal(deed.transferHistory.at(-1).seller,'Casa del Parque');assert.equal(deed.transferHistory.at(-1).price,4200);await assert.rejects(adapter.request('/api/action',{action:'acquirePrivateProperty',x:6,y:10}),/titularidad privada/);assert.equal(stored.landClaims.parcelDeeds['6,10'].ownerType,'municipal')}
 finally{globalThis.fetch=fetch0;globalThis.localStorage=storage0}
});
