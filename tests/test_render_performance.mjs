import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18811,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:390,height:844,maxRatio:1.25},{width:1440,height:900,maxRatio:1.5}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:2}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const city=await fetch('/offline_seed.json').then(r=>r.json());city.paused=true;localStorage.setItem('ciudad-viva-offline-v1',JSON.stringify(city))});
  await page.locator('#offlineMode').click();
  await page.waitForFunction(()=>window.__ciudadVivaMode?.()==='offline'&&document.getElementById('modeBackdrop')?.classList.contains('hidden'),null,{timeout:30000});
  for(let i=0;i<8;i++)await page.locator('#zoomOut').click();
  await page.waitForFunction(()=>window.__ciudadVivaScene?.()?.vegetationLOD==='instanced-far',null,{timeout:15000});
  await page.waitForTimeout(500);
  const diagnostics=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(diagnostics.contextLost,false,`${viewport.width}px: WebGL context lost`);
  assert.ok(diagnostics.vegetationTrees>0,`${viewport.width}px: the map should have distant trees`);
  assert.ok(diagnostics.vegetationBatches>=2&&diagnostics.vegetationBatches<=4,`${viewport.width}px: distant vegetation uses ${diagnostics.vegetationBatches} batches`);
  assert.ok(diagnostics.pixelRatio<=viewport.maxRatio,`${viewport.width}px: pixel ratio exceeded its device cap`);
  assert.equal(diagnostics.shadowMapEnabled,false,`${viewport.width}px: distant shadows should be disabled`);
  assert.ok(diagnostics.drawCalls>0&&diagnostics.triangles>0,`${viewport.width}px: no 3D scene was rendered`);
  assert.deepEqual(errors,[],`${viewport.width}px: render errors ${errors.join('; ')}`);
  console.log('Render profile',JSON.stringify({width:viewport.width,dpr:2,pixelRatio:diagnostics.pixelRatio,softwareFps:diagnostics.renderFps,dynamicObjects:diagnostics.dynamicObjects,shadowMapEnabled:diagnostics.shadowMapEnabled,drawCalls:diagnostics.drawCalls,triangles:diagnostics.triangles,trees:diagnostics.vegetationTrees,vegetationBatches:diagnostics.vegetationBatches}));
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
