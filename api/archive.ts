import {get,put,head} from '@vercel/blob';
import {privateJsonReader} from '../blob-version.mjs';
import {readFileSync} from 'node:fs';
import {makeReceiver} from '../receiver.mjs';
import {hash} from '../archive.mjs';
import seed from '../feed.json' with {type:'json'};
const publicKey=readFileSync(new URL('../producer-public-key.pem',import.meta.url),'utf8');
const reader=privateJsonReader({get,head,available:!!(process.env.BLOB_STORE_ID||process.env.BLOB_READ_WRITE_TOKEN)});
async function read(path:string){const result=await reader(path,{versioned:path==='feed.json'});return result?{packet:result.value,etag:result.etag}:null;}
const store={
 available:!!(process.env.BLOB_STORE_ID||process.env.BLOB_READ_WRITE_TOKEN),
 load:()=>read('feed.json'),
 loadWeek:async(date:string)=>(await read('weeks/'+date+'.json'))?.packet??null,
 saveWeek:async(week:any)=>{const path='weeks/'+week.edition_date+'.json';try{await put(path,JSON.stringify(week)+'\n',{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',cacheControlMaxAge:31536000});}catch(error){const existing=await read(path);if(!existing||hash(existing.packet)!==hash(week))throw error;}},
 saveFeed:async(packet:any,etag:string|null)=>{await put('feed.json',JSON.stringify(packet,null,2)+'\n',{access:'private',addRandomSuffix:false,allowOverwrite:etag!==null,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60});},
};
export default {fetch:makeReceiver({publicKey,seed,store})};
