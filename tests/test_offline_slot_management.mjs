import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const DB_NAME='ciudad-viva-partidas',server=await startUiTestServer(18961),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
async function seedBackups(page,count){
 return page.evaluate(async count=>{
  const database=await new Promise((resolve,reject)=>{const request=indexedDB.open('ciudad-viva-partidas',2);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('slots'))db.createObjectStore('slots',{keyPath:'id'});if(!db.objectStoreNames.contains('backups'))db.createObjectStore('backups',{keyPath:'id'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
  const state=await fetch('/offline_seed.json').then(response=>response.json()),tx=database.transaction('backups','readwrite'),store=tx.objectStore('backups');
  for(let i=1;i<=count;i++)store.put({id:`backup-${i}`,slotId:'source-slot',name:'Nueva partida',city:'Puerto Claro',day:i,createdAt:1000+i,snapshot:JSON.stringify({...state,day:i})});
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});database.close();
 },count);
}

try{
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('dialog',dialog=>dialog.accept());page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:18961/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('ciudad-viva-partidas');request.onsuccess=resolve;request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('IndexedDB quedó bloqueada'))}));
  await seedBackups(page,5);
  await page.locator('#offlineMode').click();await page.waitForFunction(()=>document.querySelectorAll('#saveList .save-backup-row').length===2||Boolean(document.getElementById('modeError')?.textContent),null,{timeout:15000});
  const rows=page.locator('#saveList .save-backup-row');assert.equal(await rows.count(),2,`${viewport.width}: se muestran como máximo dos copias recuperables · lista=${await page.locator('#saveList').innerText()} · error=${await page.locator('#modeError').innerText()} · JS=${errors.join(' | ')}`);
  assert.match(await page.locator('#saveList').innerText(),/máximo 2/i);assert.match(await rows.nth(0).innerText(),/día 5/);assert.match(await rows.nth(1).innerText(),/día 4/);assert.equal(await page.locator('#saveList').getByRole('button',{name:/Eliminar copia recuperable/}).count(),2);
  const geometry=await rows.first().evaluate(row=>{const box=row.getBoundingClientRect(),remove=row.querySelector('.save-backup-delete').getBoundingClientRect();return{right:box.right,viewport:innerWidth,removeRight:remove.right}});assert.ok(geometry.right<=geometry.viewport+1&&geometry.removeRight<=geometry.viewport+1,`${viewport.width}: botón de borrar fuera de pantalla ${JSON.stringify(geometry)}`);
  const removedId=await rows.first().getAttribute('data-backup-id'),removedRow=page.locator(`.save-backup-row[data-backup-id="${removedId}"]`);await removedRow.locator('.save-backup-delete').click();await removedRow.waitFor({state:'detached'});assert.equal(await rows.count(),1,`${viewport.width}: la copia se quita de la lista`);
  const stored=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ciudad-viva-partidas',2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});const result=await new Promise((resolve,reject)=>{const tx=db.transaction('backups','readonly'),request=tx.objectStore('backups').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});db.close();return result});assert.equal(stored.length,1,`${viewport.width}: borrar elimina el respaldo persistido`);
  await page.close();
 }

 const page=await browser.newPage();await page.goto('http://127.0.0.1:18961/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('ciudad-viva-partidas');request.onsuccess=resolve;request.onerror=()=>reject(request.error)}));await seedBackups(page,3);
 const capacity=await page.evaluate(async()=>{
  const api=await import('/offline_slots.js?v=0.291'),created=[],errors=[];
  for(const id of ['backup-1','backup-2','backup-3'])try{created.push(await api.restoreOfflineBackup(id))}catch(error){errors.push(error.message)}
  const recovered=await api.listOfflineSlots();await api.deleteOfflineSlot(created[0].id);
  const afterDelete=await api.restoreOfflineBackup('backup-3'),after=await api.listOfflineSlots();
  return{initialErrors:errors,initialCount:recovered.filter(slot=>slot.recoveredFromBackup).length,afterDeleteCount:after.filter(slot=>slot.recoveredFromBackup).length,afterDeleteId:afterDelete.id};
 });
 assert.deepEqual(capacity.initialErrors,['Ya hay dos partidas recuperadas. Eliminá una desde la lista antes de recuperar otra.']);assert.equal(capacity.initialCount,2);assert.equal(capacity.afterDeleteCount,2);
 await page.close();
 console.log('Recuperaciones: se conservan dos copias, se pueden borrar en móvil/escritorio y no se crean más de dos slots recuperados.');
}finally{await browser.close();server.kill('SIGTERM')}
