import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startUiTestServer} from './ui_test_server.mjs';

const port=18891,server=await startUiTestServer(port);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,
 args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
const rooms=[
 {id:'open',city:'Puerto Claro',host_name:'Abril',join_url:'https://puerto-claro.trycloudflare.com',players:4,max_players:13},
 {id:'full',city:'Sala llena',host_name:'Matías',join_url:'https://sala-llena.trycloudflare.com',players:13,max_players:13},
 {id:'rtc',city:'Puerto P2P',host_name:'Camila',join_url:'',players:2,max_players:13,rtc_enabled:true,
  rtc_public_key:{kty:'EC',crv:'P-256',x:'A'.repeat(43),y:'B'.repeat(43)}},
 {id:'unsafe',city:'Sitio no confiable',host_name:'No',join_url:'https://phishing.example',players:1,max_players:13},
];
let directoryRequests=0;
try{
 for(const {name,width,height} of [{name:'móvil',width:390,height:844},{name:'escritorio',width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],requestsBefore=directoryRequests;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/public_directory.json',route=>route.fulfill({status:200,
   contentType:'application/json',body:JSON.stringify({supabaseUrl:'https://test-project.supabase.co',supabaseAnonKey:'sb_publishable_ci_test'})}));
  await page.route('**/rest/v1/public_rooms**',async route=>{
   directoryRequests++;
   assert.equal(route.request().headers().apikey,'sb_publishable_ci_test',`${name}: usa clave pública`);
   assert.ok(new URL(route.request().url()).searchParams.has('last_seen'),`${name}: filtra anuncios recientes`);
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(rooms)});
  });
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.__ciudadVivaMode==='function',null,{timeout:30000});
  await page.locator('#onlineMode').click();
  await page.locator('#browsePublicRoom').click();
  const openRoom=page.locator('#roomList .room-result').filter({hasText:'Puerto Claro'});
  const fullRoom=page.locator('#roomList .room-result').filter({hasText:'Sala llena'});
  const rtcRoom=page.locator('#roomList .room-result').filter({hasText:'Puerto P2P'});
  await openRoom.waitFor({state:'visible',timeout:20000});
  await fullRoom.waitFor({state:'visible',timeout:20000});
  await rtcRoom.waitFor({state:'visible',timeout:20000});
  assert.equal(await openRoom.isDisabled(),false,`${name}: sala disponible para entrar`);
  assert.equal(await fullRoom.isDisabled(),true,`${name}: sala con 13 jugadores bloqueada`);
  assert.equal(await rtcRoom.isDisabled(),false,`${name}: sala RTC sin túnel habilitada`);
  assert.match(await rtcRoom.innerText(),/WebRTC/,`${name}: muestra el transporte P2P`);
  assert.doesNotMatch(await page.locator('#roomList').innerText(),/Sitio no confiable/,
   `${name}: el directorio filtra direcciones fuera de trycloudflare.com`);
  const refresh=page.locator('#roomList > button.room-result');
  assert.equal(await refresh.isDisabled(),true,`${name}: evita consultas repetidas en 30 segundos`);
  assert.match(await refresh.innerText(),/\d+ s/,`${name}: muestra el tiempo de espera`);
  const listBounds=await page.locator('#roomList').evaluate(el=>({left:el.getBoundingClientRect().left,
   right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth}));
  assert.ok(listBounds.left>=0&&listBounds.right<=width+1&&listBounds.scroll<=listBounds.client+3,
   `${name}: lista sin recorte ni desborde ${JSON.stringify(listBounds)}`);
  await refresh.evaluate(button=>button.click());
  await page.waitForTimeout(100);
  assert.equal(directoryRequests,requestsBefore+1,`${name}: el tiempo de espera evita una segunda consulta`);
  assert.deepEqual(errors,[],`${name}: sin errores JavaScript`);
  await page.close();
 }
 console.log('Directorio público: búsqueda bajo demanda, capacidad de 13 y UI responsive verificadas.');
}finally{await browser.close();server.kill('SIGTERM')}
