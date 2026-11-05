import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const server=await startUiTestServer(18962),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}),backends=[];
try{
 for(const hideWebGpu of [true,false]){
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(hideWebGpu)await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}));
  const rendererRequests=[];page.on('request',request=>{if(request.url().includes('three.webgpu.js'))rendererRequests.push(request.url())});
  await page.goto('http://127.0.0.1:18962/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const diagnostics=window.__ciudadVivaScene?.();return diagnostics?.rendererReady||diagnostics?.rendererInitError},null,{timeout:30000});
  const diagnostics=await page.evaluate(()=>window.__ciudadVivaScene());
  backends.push(diagnostics.renderBackend);
  assert.equal(diagnostics.rendererReady,true,`WebGL 2 no inició: ${JSON.stringify(diagnostics)} · ${errors.join(' | ')}`);
  assert.equal(diagnostics.renderBackend,'WebGL 2',JSON.stringify(diagnostics));
  await page.waitForFunction(()=>window.__ciudadVivaScene?.().drawCalls>0,null,{timeout:10000});
  assert.equal(rendererRequests.length,0,`El inicio no debe descargar el renderer WebGPU: ${rendererRequests.join(', ')}`);
  assert.equal(errors.length,0,errors.join(' | '));
  await page.close();
 }
 console.log(`Renderizador WebGL estable verificado con WebGPU presente/ausente en Chromium: ${backends.join(' / ')}; no se descargó el módulo WebGPU.`);
}finally{await browser.close();server.kill('SIGTERM')}
