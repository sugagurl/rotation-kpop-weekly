// Ordinary anonymous browser read of the already-public Muse data artifact.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const url='https://muse.ai/s/rotation-weekly-feed-jo6l6xlxsxh7xo1';
await mkdir('proof',{recursive:true});const browser=await chromium.launch({headless:false});const page=await browser.newPage();let result;
try{
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 if(!response?.ok())throw Error('ARTIFACT_HTTP_'+response?.status());
 const block=page.frameLocator('iframe').locator('script[type="application/json"]#rotation-weekly-feed');
 await block.waitFor({state:'attached',timeout:45000});
 const text=await block.textContent();if(!text||Buffer.byteLength(text)>4*1024*1024)throw Error('INVALID_FEED_SIZE');
 const data=JSON.parse(text);if(data.producer!=='muse-rotation-weekly'||data.schema_version!==1||!Array.isArray(data.weeks))throw Error('INVALID_FEED');
 await writeFile('proof/feed.json',JSON.stringify(data,null,2)+'\n');
 result={status:'complete',url,http_status:response.status(),observed_at:new Date().toISOString(),weeks:data.weeks.length,latest_attempt:data.latest_attempt};
}catch(e){result={status:'blocked',url,observed_at:new Date().toISOString(),error:String(e)};process.exitCode=1;}
await page.screenshot({path:'proof/relay.png',fullPage:false}).catch(()=>{});await writeFile('proof/relay.json',JSON.stringify(result,null,2)+'\n');console.log(result);await browser.close();
