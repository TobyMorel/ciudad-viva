import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createOfflineAdapter} from '../offline.js';
import {loadWasmRoadRouter,solveRouteGraphJavaScript} from '../wasm_route.js';

const wasmBytes=await readFile(new URL('../wasm/route-engine.wasm',import.meta.url));

test('Rust/WASM encuentra la ruta de menor costo y coincide con JavaScript',async()=>{
 const router=await loadWasmRoadRouter({bytes:wasmBytes});
 assert.equal(router?.kind,'Rust/WebAssembly');
 assert.equal(router.maxNodes,16384);
 const graph=[
  {x:0,y:0,start:true,neighbors:[1,2,-1,-1],weights:[2,9,0,0]},
  {x:1,y:0,neighbors:[-1,-1,2,-1],weights:[0,0,2,0]},
  {x:2,y:0,goal:true,neighbors:[-1,-1,-1,-1],weights:[0,0,0,0]},
 ];
 assert.deepEqual(router.solve(graph),[0,1,2]);
 assert.deepEqual(router.solve(graph),solveRouteGraphJavaScript(graph));
 assert.deepEqual(router.solve([{x:0,y:0,start:true,neighbors:[-1,-1,-1,-1],weights:[]},{x:1,y:0,goal:true,neighbors:[-1,-1,-1,-1],weights:[]}]),[]);
});

test('WASM conserva rutas largas de una ciudad ampliada',async()=>{
 const router=await loadWasmRoadRouter({bytes:wasmBytes}),count=4096,nodes=Array.from({length:count},(_,index)=>({x:index,y:0,start:index===0,goal:index===count-1,neighbors:index+1<count?[index+1,-1,-1,-1]:[-1,-1,-1,-1],weights:index+1<count?[1,0,0,0]:[0,0,0,0]}));
 const route=router.solve(nodes);
 assert.equal(route.length,count);assert.equal(route[0],0);assert.equal(route.at(-1),count-1);
});

test('la simulación offline conecta sus consultas de rutas al motor Rust/WASM',async()=>{
 const originals={fetch:globalThis.fetch,localStorage:globalThis.localStorage},store=new Map(),seed=JSON.parse(await readFile(new URL('../offline_seed.json',import.meta.url),'utf8'));
 globalThis.localStorage={getItem:key=>store.get(String(key))??null,setItem:(key,value)=>store.set(String(key),String(value)),removeItem:key=>store.delete(String(key))};
 store.set('ciudad-viva-offline-v1',JSON.stringify(seed));
 globalThis.fetch=async input=>String(input).includes('route-engine.wasm')?{ok:true,arrayBuffer:async()=>wasmBytes.buffer.slice(wasmBytes.byteOffset,wasmBytes.byteOffset+wasmBytes.byteLength)}:{ok:true,json:async()=>structuredClone(seed)};
 try{
  const adapter=await createOfflineAdapter();adapter.setRealtimeClock(false);await adapter.request('/api/state');
  const diagnostics=adapter.getRuntimeDiagnostics();
  assert.equal(diagnostics.routeEngine,'Rust/WebAssembly');assert.ok(diagnostics.wasmRouteCalls>0,JSON.stringify(diagnostics));assert.ok(diagnostics.wasmRouteNodes>0);
 }finally{
  if(originals.fetch===undefined)delete globalThis.fetch;else globalThis.fetch=originals.fetch;
  if(originals.localStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=originals.localStorage;
 }
});
