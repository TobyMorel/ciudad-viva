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
  await page.evaluate(()=>window.__ciudadVivaSetZoomForDiagnostics(.58));
  await page.waitForFunction(()=>window.__ciudadVivaScene?.()?.vegetationLOD==='instanced-far',null,{timeout:15000});
  await page.waitForTimeout(500);
  const diagnostics=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(diagnostics.contextLost,false,`${viewport.width}px: WebGL context lost`);
  assert.ok(diagnostics.vegetationTrees>0,`${viewport.width}px: the map should have distant trees`);
  assert.ok(diagnostics.vegetationBatches>=2&&diagnostics.vegetationBatches<=4,`${viewport.width}px: distant vegetation uses ${diagnostics.vegetationBatches} batches`);
  assert.ok(diagnostics.pixelRatio<=viewport.maxRatio,`${viewport.width}px: pixel ratio exceeded its device cap`);
  assert.equal(diagnostics.farBuildingLOD,true,`${viewport.width}px: distant building LOD should be active`);
  assert.equal(diagnostics.shadowMapEnabled,false,`${viewport.width}px: distant shadows should be disabled`);
  assert.ok(diagnostics.drawCalls>0&&diagnostics.triangles>0,`${viewport.width}px: no 3D scene was rendered`);
  assert.deepEqual(errors,[],`${viewport.width}px: render errors ${errors.join('; ')}`);
  console.log('Render profile',JSON.stringify({width:viewport.width,dpr:2,pixelRatio:diagnostics.pixelRatio,softwareFps:diagnostics.renderFps,dynamicObjects:diagnostics.dynamicObjects,shadowMapEnabled:diagnostics.shadowMapEnabled,drawCalls:diagnostics.drawCalls,triangles:diagnostics.triangles,trees:diagnostics.vegetationTrees,vegetationBatches:diagnostics.vegetationBatches}));
  await page.evaluate(()=>window.__ciudadVivaSetZoomForDiagnostics(1.2));
  await page.waitForFunction(()=>window.__ciudadVivaScene?.()?.vegetationLOD==='instanced-detailed',null,{timeout:15000});
  await page.waitForTimeout(400);
  const intermediate=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(intermediate.contextLost,false,`${viewport.width}px: context lost at intermediate tree zoom`);
  assert.ok(intermediate.vegetationTrees>0,`${viewport.width}px: intermediate tree models should be visible`);
  assert.ok(intermediate.vegetationBatches>0&&intermediate.vegetationBatches<=16,`${viewport.width}px: detailed trees should use at most 16 batches, got ${intermediate.vegetationBatches}`);
  assert.ok(intermediate.drawCalls>0&&intermediate.triangles>0,`${viewport.width}px: intermediate scene did not render`);
  if(viewport.width>650){assert.equal(intermediate.shadowMapEnabled,true,`${viewport.width}px: desktop shadows remain visible`);assert.equal(intermediate.shadowMapSize,1024,`${viewport.width}px: intermediate shadow map should use 1024px`)}
  await page.evaluate(()=>{const zoom=1.2,height=document.querySelector('#city').clientHeight,unit=(58/zoom)/Math.max(1,height);window.__ciudadVivaPanForDiagnostics(17/unit,0)});
  await page.waitForTimeout(500);
  const afterPan=await page.evaluate(()=>window.__ciudadVivaScene());
  assert.equal(afterPan.contextLost,false,`${viewport.width}px: context lost after camera pan`);
  assert.equal(afterPan.vegetationLOD,'instanced-detailed',`${viewport.width}px: pan should keep batched tree models active`);
  assert.ok(afterPan.vegetationBatches<=16,`${viewport.width}px: panning expanded tree draw batches`);
  console.log('Intermediate render profile',JSON.stringify({width:viewport.width,zoom:1.2,pixelRatio:intermediate.pixelRatio,softwareFps:intermediate.renderFps,drawCalls:intermediate.drawCalls,triangles:intermediate.triangles,trees:intermediate.vegetationTrees,vegetationBatches:intermediate.vegetationBatches,shadowMapSize:intermediate.shadowMapSize,afterPanDrawCalls:afterPan.drawCalls}));
  await page.close();
 }
}finally{await browser.close();server.kill('SIGTERM')}
