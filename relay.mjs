import {chromium} from 'playwright';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {mergePacket,hash} from './archive.mjs';
const url='https://muse.ai/s/rotation-weekly-feed-jo6l6xlxsxh7xo1';
await mkdir('proof',{recursive:true});const browser=await chromium.launch({headless:false});const page=await browser.newPage();
try{
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});if(!response?.ok())throw Error('ARTIFACT_HTTP_'+response?.status());
 const block=page.frameLocator('iframe').locator('script[type="application/json"]#rotation-weekly-feed');await block.waitFor({state:'attached',timeout:45000});
 const raw=await block.textContent();if(!raw||Buffer.byteLength(raw)>4*1024*1024)throw Error('INVALID_FEED_SIZE');
 const prior=JSON.parse(await readFile('feed.json','utf8'));const next=mergePacket(prior,raw);const manifest={};
 // Validate ALL old files before publishing any addition. Never replace a dated edition.
 for(const week of next.weeks){const path='weeks/'+week.edition_date+'.json';let existing;try{existing=await readFile(path,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}if(existing&&hash(JSON.parse(existing))!==hash(week))throw Error('ARCHIVE_FILE_CONFLICT');manifest[week.edition_date]=hash(week);}
 await mkdir('weeks',{recursive:true});for(const week of next.weeks){try{await writeFile('weeks/'+week.edition_date+'.json',JSON.stringify(week)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}}
 await writeFile('hashes.json',JSON.stringify(manifest,null,2)+'\n');
 await writeFile('feed.json.tmp',JSON.stringify(next,null,2)+'\n');await rename('feed.json.tmp','feed.json');
 const receipt={read_at:new Date().toISOString(),producer:url,complete_weeks:next.weeks.length,latest_complete:next.latest_complete?.edition_date??null,latest_attempt:next.latest_attempt,edition_sha256:manifest};await writeFile('proof/receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log(receipt);
}catch(e){await writeFile('proof/error.json',JSON.stringify({at:new Date().toISOString(),error:String(e)})+'\n');console.error(e);process.exitCode=1;}
finally{await page.screenshot({path:'proof/relay.png',fullPage:false}).catch(()=>{});await browser.close();}
