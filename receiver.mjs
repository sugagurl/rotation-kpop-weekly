import {createPublicKey,verify} from 'node:crypto';
import {mergePacket,hash} from './archive.mjs';
const MAX=4*1024*1024;
export function makeReceiver({publicKey,seed,store}){
 const key=createPublicKey(publicKey);
 return async function handle(request){
  if(request.method==='GET'){
   try{const saved=await store.load();return Response.json(saved?.packet??seed,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return Response.json({error:'ARCHIVE_UNAVAILABLE'},{status:503});}
  }
  if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'GET, POST'}});
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return Response.json({error:'JSON_REQUIRED'},{status:415});
  const encoded=request.headers.get('x-rotation-signature')??'';if(!/^[A-Za-z0-9+/]{86}==$/.test(encoded))return Response.json({error:'SIGNATURE_REQUIRED'},{status:401});
  if(Number(request.headers.get('content-length')??0)>MAX)return Response.json({error:'BODY_TOO_LARGE'},{status:413});
  let body;
  try{const parts=[];let size=0;const reader=request.body?.getReader();if(!reader)throw Error('EMPTY_BODY');try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX){await reader.cancel();return Response.json({error:'BODY_TOO_LARGE'},{status:413});}parts.push(value);}}finally{reader.releaseLock();}body=Buffer.concat(parts);}catch{return Response.json({error:'INVALID_BODY'},{status:400});}
  if(!verify(null,body,key,Buffer.from(encoded,'base64')))return Response.json({error:'INVALID_SIGNATURE'},{status:401});
  try{
   const saved=await store.load();const prior=saved?.packet??seed;const next=mergePacket(prior,body.toString('utf8'));
   if(store.available===false)return Response.json({error:'STORAGE_NOT_CONNECTED'},{status:503});
   // Check every immutable object, including empty/corrupt objects, before any publication.
   const missing=[];for(const week of next.weeks){const existing=await store.loadWeek(week.edition_date);if(existing!==null&&hash(existing)!==hash(week))throw Error('ARCHIVE_FILE_CONFLICT');if(existing===null)missing.push(week);}
   for(const week of missing)await store.saveWeek(week);
   const unchanged=!!saved&&hash(saved.packet)===hash(next);
   if(!unchanged)await store.saveFeed(next,saved?.etag??null);
   return Response.json({state:unchanged?'already_saved':'saved',latest_complete:next.latest_complete?.edition_date??null,latest_attempt:next.latest_attempt},{headers:{'Cache-Control':'no-store'}});
  }catch(error){const code=String(error?.message??'INVALID_PACKET');const conflict=/CONFLICT|REGRESSION|Precondition|already exists/i.test(code);return Response.json({error:conflict?'ARCHIVE_CONFLICT':'PACKET_OR_STORAGE_REJECTED'},{status:conflict?409:400});}
 };
}
