import {get,put} from '@vercel/blob';
import {readFileSync} from 'node:fs';
import {makeEvidenceReceiver,digest} from '../evidence.mjs';
import identities from '../identities.json' with {type:'json'};
const publicKey=readFileSync(new URL('../producer-public-key.pem',import.meta.url),'utf8');
async function read(path:string){if(!process.env.BLOB_STORE_ID&&!process.env.BLOB_READ_WRITE_TOKEN)return null;const r=await get(path,{access:'private',useCache:false});if(!r||r.statusCode!==200)return null;return {value:JSON.parse(await new Response(r.stream).text()),etag:r.blob.etag};}
const path=(id:string)=>'evidence/batches/'+id+'.json';
const store={available:!!(process.env.BLOB_STORE_ID||process.env.BLOB_READ_WRITE_TOKEN),loadIndex:()=>read('evidence/index.json'),loadBatch:async(id:string)=>(await read(path(id)))?.value??null,
 saveBatch:async(id:string,value:any)=>{try{await put(path(id),JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',cacheControlMaxAge:31536000})}catch(error){const old=await read(path(id));if(!old||old.value.sha256!==value.sha256||digest(old.value.body_utf8)!==value.sha256)throw error}},
 saveIndex:async(value:any,etag:string|null)=>{await put('evidence/index.json',JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:etag!==null,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60})}
};
export default {fetch:makeEvidenceReceiver({publicKey,store,knownArtists:identities.artists})};
