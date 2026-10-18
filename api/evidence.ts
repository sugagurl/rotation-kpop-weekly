import {get,put,head} from '@vercel/blob';
import {privateJsonReader} from '../blob-version.mjs';
import {readFileSync} from 'node:fs';
import {makeEvidenceReceiver,digest} from '../evidence.mjs';
import identities from '../identities.json' with {type:'json'};
const publicKey=readFileSync(new URL('../producer-public-key.pem',import.meta.url),'utf8');
const reader=privateJsonReader({get,head,available:!!(process.env.BLOB_STORE_ID||process.env.BLOB_READ_WRITE_TOKEN)});
const read=(path:string)=>reader(path,{versioned:path==='evidence/index.json'});
const path=(id:string)=>'evidence/batches/'+id+'.json';
const store={available:!!(process.env.BLOB_STORE_ID||process.env.BLOB_READ_WRITE_TOKEN),loadIndex:()=>read('evidence/index.json'),loadBatch:async(id:string)=>(await read(path(id)))?.value??null,
 saveBatch:async(id:string,value:any)=>{try{await put(path(id),JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',cacheControlMaxAge:31536000})}catch(error){const old=await read(path(id));if(!old||old.value.sha256!==value.sha256||digest(old.value.body_utf8)!==value.sha256)throw error}},
 saveIndex:async(value:any,etag:string|null)=>{try{await put('evidence/index.json',JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:etag!==null,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60})}catch(error){const shape=(s:string|null)=>!s?'missing':s.startsWith('W/')?'weak':s.startsWith('\"')?'quoted':'plain';const normalize=(s:string|null)=>s?.replace(/^W\//,'').replace(/^\"|\"$/g,'');try{const meta=await head('evidence/index.json');console.warn(JSON.stringify({event:'evidence_index_commit_failed',error_name:(error as Error).name,expected_etag_shape:shape(etag),metadata_etag_shape:shape(meta.etag),exact_match:etag===meta.etag,normalized_match:normalize(etag)===normalize(meta.etag)}))}catch{console.warn(JSON.stringify({event:'evidence_index_commit_failed',metadata_read:'unavailable'}))}throw error}}

};
export default {fetch:makeEvidenceReceiver({publicKey,store,knownArtists:identities.artists})};
