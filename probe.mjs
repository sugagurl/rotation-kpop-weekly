import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('proof',{recursive:true});
const browser=await chromium.launch({headless:false});
const page=await browser.newPage();
let result;
try{
 const response=await page.goto('https://rotation.today/map',{waitUntil:'domcontentloaded',timeout:45000});
 if(!response?.ok())throw Error('SOURCE_HTTP_'+response?.status());
 await page.locator('a[href*="market="][aria-label]').first().waitFor({timeout:30000});
 const observed=await page.evaluate(()=>({url:location.href,title:document.title,source_date:document.querySelector('time[datetime]')?.getAttribute('datetime'),links:[...document.querySelectorAll('a[href*="market="][aria-label]')].map(a=>({href:a.href,label:a.getAttribute('aria-label')}))}));
 if(!observed.links.length)throw Error('NO_COUNTRY_INDEX');
 result={status:'complete',captured_at:new Date().toISOString(),http_status:response.status(),...observed};
}catch(e){result={status:'blocked',captured_at:new Date().toISOString(),error:String(e),url:page.url(),title:await page.title()};process.exitCode=1;}
await page.screenshot({path:'proof/map.png',fullPage:false}).catch(()=>{});
await writeFile('proof/probe.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,error:result.error,country_links:result.links?.length,source_date:result.source_date}));
await browser.close();
