import {chromium} from 'playwright';
import {startUiTestServer} from './ui_test_server.mjs';
import assert from 'node:assert/strict';

const server=await startUiTestServer(18830);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,
  args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
try{
  for(const width of [320,390,768,1440,1920,2560]){
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.goto('http://127.0.0.1:18830/',{waitUntil:'domcontentloaded'});
    const result=await page.evaluate(()=>{
      const card=document.querySelector('.metric:first-child');
      const money=document.getElementById('money');
      const budget=document.getElementById('budgetFlow');
      money.textContent='$ 999.999.999';
      budget.textContent='▼ -$ 367/mes';
      const label=card.querySelector(':scope > span');
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
      return{detailsPresent:!!card.querySelector('#treasuryExtra'),
        rects:{card:rect(card),label:rect(label),money:rect(money),budget:rect(budget)}};
    });
    const {card,label,money,budget}=result.rects;
    assert.equal(result.detailsPresent,false,width+': el desglose extra no debe pisar los indicadores');
    assert.ok(card.right>card.left,width+': debe existir la tarjeta');
    assert.ok(label.bottom<=money.top+1,width+': título y dinero solapados: '+JSON.stringify(result.rects));
    assert.ok(money.bottom<=budget.top+1,width+': dinero y balance solapados: '+JSON.stringify(result.rects));
    for(const [name,r] of Object.entries({label,money,budget}))
      assert.ok(r.left>=card.left-1&&r.right<=card.right+1,width+': '+name+' fuera de tarjeta: '+JSON.stringify(result.rects));
    await page.close();
  }
}finally{await browser.close();server.kill('SIGTERM')}
