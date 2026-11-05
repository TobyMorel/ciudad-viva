import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const port=18961,dataDir=mkdtempSync(join(tmpdir(),'ciudad-viva-coop-ui-'));
const server=spawn('python',['server.py','--no-browser'],{env:{...process.env,CIUDAD_VIVA_PORT:String(port),CIUDAD_VIVA_DATA_DIR:dataDir},stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let attempt=0;attempt<100;attempt++){
  if(server.exitCode!==null)throw new Error(`Servidor LAN terminó con código ${server.exitCode}`);
  try{const response=await fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(500)});if(response.ok){ready=true;break}}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.ok(ready,'El servidor LAN no inició');
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>localStorage.setItem('cv-tutorial-introduced-v1','yes'));
 await page.locator('#onlineMode').click();await page.locator('#playerName').fill('Alcaldesa');await page.locator('#createRoom').click();
 await page.locator('#newSlotButton:not([disabled])').click();
 await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='online',{timeout:40000});
 const host=await page.evaluate(()=>sessionStorage.getItem('cv-player'));
 assert.ok(host,'El anfitrión debe tener una identidad online');
 const joined=await page.evaluate(async()=>{const response=await fetch('/api/room/join',{method:'POST',headers:{'Content-Type':'application/json','X-Player-Id':'ui-guest'},body:JSON.stringify({name:'Beto'})});return response.ok});
 assert.equal(joined,true,'El segundo miembro debe entrar en la misma sala');
 await page.locator('#cityReportRail [data-city-report="government"]').click();
 await page.locator('.municipal-team').waitFor();
 await page.locator('.municipal-team > summary').click();
 await page.locator('[data-municipal-approval-threshold]').selectOption('5000');
 await page.locator('[data-municipal-approval-save]').click();
 await page.waitForFunction(()=>document.querySelector('.municipal-approval')?.innerText.includes('$5.000'),null,{timeout:15000});
 const proposed=await page.evaluate(async hostId=>{const response=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json','X-Player-Id':hostId},body:JSON.stringify({action:'place',kind:'civic',serviceModel:'generalHospital',x:5,y:10})});return response.ok},host);
 assert.equal(proposed,true,'La inversión municipal debe quedar propuesta al superar el umbral');
 const card=page.locator('.municipal-decision:visible').first();await card.waitFor({state:'visible'});
 assert.match(await card.innerText(),/Votación pendiente/);
 assert.equal(await card.locator('[data-decision-vote]').count(),2);
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);
  const overflow=await page.evaluate(()=>{const visible=element=>element.getClientRects().length>0,approval=[...document.querySelectorAll('.municipal-approval')].find(visible);return {page:document.documentElement.scrollWidth-window.innerWidth,card:approval.getBoundingClientRect().right-window.innerWidth,buttons:[...document.querySelectorAll('.municipal-decision [data-decision-vote]')].filter(button=>visible(button.closest('.municipal-decision'))).some(button=>{const r=button.getBoundingClientRect();return r.left<0||r.right>innerWidth||r.width<1})}});
  assert.ok(overflow.page<=1,`La pantalla no debe desbordar a ${viewport.width}px: ${JSON.stringify(overflow)}`);
  assert.ok(overflow.card<=1,`El panel no debe salir de pantalla a ${viewport.width}px: ${JSON.stringify(overflow)}`);
  assert.equal(overflow.buttons,false,`Los votos deben estar visibles a ${viewport.width}px`);
 }
 const vote=await page.evaluate(async()=>{const visible=element=>element.getClientRects().length>0,card=[...document.querySelectorAll('.municipal-decision')].find(visible),response=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json','X-Player-Id':'ui-guest'},body:JSON.stringify({action:'voteMunicipalDecision',decisionId:card?.querySelector('[data-decision-vote]')?.dataset.decisionVote,vote:'yes'})});return response.ok});
 assert.equal(vote,true,'El segundo integrante debe poder completar la mayoría');
 await page.waitForFunction(()=>[...document.querySelectorAll('.municipal-decision')].some(card=>card.getClientRects().length>0&&card.innerText.includes('Aprobada')),null,{timeout:15000});
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('Votación municipal Online y panel sin desbordes en móvil/escritorio verificados en Chromium.');
}finally{
 await browser?.close();
 if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM')});
 rmSync(dataDir,{recursive:true,force:true});
}
