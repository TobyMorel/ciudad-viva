import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const server=await startUiTestServer(18962),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--disable-dev-shm-usage','--enable-unsafe-webgpu','--use-gl=angle','--use-angle=swiftshader']}),backends=[];
try{
 for(const forceWebGlFallback of [true,false]){
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(forceWebGlFallback)await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}));
  await page.goto('http://127.0.0.1:18962/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const diagnostics=window.__ciudadVivaScene?.();return diagnostics?.rendererReady||diagnostics?.rendererInitError},null,{timeout:30000});
  const diagnostics=await page.evaluate(()=>window.__ciudadVivaScene());
  backends.push(diagnostics.renderBackend);
  assert.equal(diagnostics.rendererReady,true,`${forceWebGlFallback?'fallback WebGL':'motor preferido'} no inició: ${JSON.stringify(diagnostics)} · ${errors.join(' | ')}`);
  assert.ok(['WebGPU','WebGL 2'].includes(diagnostics.renderBackend),JSON.stringify(diagnostics));
  if(forceWebGlFallback)assert.equal(diagnostics.renderBackend,'WebGL 2');
  await page.waitForFunction(()=>window.__ciudadVivaScene?.().drawCalls>0,null,{timeout:10000});
  assert.equal(errors.length,0,errors.join(' | '));
  await page.close();
 }
 console.log(`Renderizador principal y fallback verificados en Chromium: ${backends.join(' / ')}.`);
}finally{await browser.close();server.kill('SIGTERM')}
