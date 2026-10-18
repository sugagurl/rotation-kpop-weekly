import {createHash,createPublicKey,verify} from 'node:crypto';
import {z} from 'zod';

export const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b,'en'))):v);
export const digest=value=>createHash('sha256').update(typeof value==='string'?value:canonical(value)).digest('hex');
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{try{return new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s}catch{return false}});
const instant=z.string().datetime({offset:true});
const id=z.string().regex(/^[a-z0-9][a-z0-9-]{4,95}$/);
const https=z.string().url().refine(s=>{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password});
const source=https.refine(s=>new URL(s).hostname==='rotation.today');
const project=z.enum(['hyperidol','suga']);
const families=['index','chart','edition','artist','song','map','dig','culture','pressing','methodology','changelog','analyzer'];
const kinds=['chart_entry','recording','artist','country_history','city_pickup','musical_measurement','credit','culture_context','editorial','methodology'];
const allowedFacts=new Set(('chart_name rank previous_rank move source_score country city city_count source_platforms title artist_name credits isrc release_date released_year source_slug current_market_count observed_market_count first_seen latest_chart_date peak_rank peak_market records_charted current_records bpm alternate_bpm key alternate_key key_confidence tempo_confidence duration_seconds energy shape peak_seconds brightness low_end_percentage measurement_date relationship credited_name citation_url recording_id entity_name entity_type sample_count matched_count unmatched_count largest_metric date_range collection_id collection_title curator track_position method_version applies_from rule_name rule_value expected_rows observed_rows').split(' '));
const scalar=z.union([z.string().max(600),z.number().finite(),z.boolean(),z.null()]);
const facts=z.record(z.string().refine(k=>allowedFacts.has(k)),z.union([scalar,z.array(scalar).max(100)])).refine(x=>Object.keys(x).length>0&&Object.keys(x).length<=45);
const classification=z.object({named_credit:z.string().min(1).max(300),artists:z.array(z.object({id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),name:z.string().min(1).max(100),identity_source:https}).strict()).min(1).max(12)}).strict();
const observation=z.object({project,scope:z.enum(['kpop','broader_music','unresolved']),kind:z.enum(kinds),subject:z.string().min(1).max(300),facts,classification:classification.optional()}).strict();
const page=z.object({url:source,family:z.enum(families),source_date:day.nullable(),captured_at:instant,acquisition:z.enum(['live_public','preserved_public_capture']).optional(),status:z.enum(['captured','partial','blocked','unavailable','not_applicable']),observed_rows:z.number().int().min(0).max(100000),expected_rows:z.number().int().min(0).max(100000).nullable(),observations:z.array(observation).max(1200)}).strict();
const review=z.object({project,subject:z.string().min(1).max(300),kind:z.enum(kinds),summary:z.string().min(1).max(300),before:facts.nullable(),after:facts,evidence_indexes:z.array(z.number().int().min(0)).min(1).max(30)}).strict();
export const batchSchema=z.object({schema_version:z.literal(1),producer:z.literal('muse-rotation-evidence'),batch_id:id,phase:z.enum(['backfill','daily','weekly_review']),captured_at:instant,campaign:z.object({id,edition_dates:z.array(day).min(1).max(5000)}).strict().optional(),pages:z.array(page).min(1).max(40),review_items:z.array(review).max(12).default([])}).strict();
function familyMatches(p){const path=new URL(p.url).pathname;return ({index:['/archive','/artist','/dig','/culture','/pressings'].includes(path),chart:path==='/'||path==='/chart',edition:/^\/\d{4}-\d{2}-\d{2}$/.test(path),artist:path.startsWith('/artist/'),song:path.startsWith('/song/'),map:path==='/map',dig:path.startsWith('/dig/'),culture:path.startsWith('/culture/'),pressing:path.startsWith('/pressing/'),methodology:path==='/methodology'||path==='/colophon',changelog:path==='/changelog',analyzer:path.startsWith('/analyzer')})[p.family]===true}
function exactCredit(credit,name){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+'($|[^\\p{L}\\p{N}])','iu').test(credit)}
export function validateBatch(raw,{now=new Date(),knownArtists=[]}={}){
 const b=batchSchema.parse(raw), maxTime=now.getTime()+300000, maxDay=new Date(now.getTime()+172800000).toISOString().slice(0,10);
 if(Date.parse(b.captured_at)>maxTime)throw Error('FUTURE_CAPTURE');
 if(b.campaign&&new Set(b.campaign.edition_dates).size!==b.campaign.edition_dates.length)throw Error('DUPLICATE_CAMPAIGN_DATE');
 if(b.campaign?.edition_dates.some(d=>d>maxDay))throw Error('FUTURE_CAMPAIGN_DATE');
 for(const p of b.pages){
  if(!familyMatches(p))throw Error('SOURCE_FAMILY_MISMATCH');
  if(Date.parse(p.captured_at)>Date.parse(b.captured_at)||Date.parse(p.captured_at)>maxTime||p.source_date&&p.source_date>maxDay)throw Error('INVALID_PAGE_DATE');
  if(p.expected_rows!==null&&p.observed_rows>p.expected_rows)throw Error('INVALID_ROW_COUNTS');
  if(p.status==='captured'&&p.expected_rows!==null&&p.observed_rows<p.expected_rows)throw Error('PARTIAL_PAGE_CLAIMED_COMPLETE');
  if(['blocked','unavailable','not_applicable'].includes(p.status)&&(p.observations.length||p.observed_rows))throw Error('UNREAD_PAGE_HAS_FACTS');
  if(p.family==='edition'&&p.source_date!==new URL(p.url).pathname.slice(1))throw Error('EDITION_DATE_MISMATCH');
  for(const o of p.observations){
   if(o.project!=='hyperidol')continue;
   if(o.scope!=='kpop'||['musical_measurement','editorial','methodology'].includes(o.kind)||!o.classification)throw Error('HYPERIDOL_SCOPE_REJECTED');
   const c=o.classification;
   const creditValue=o.facts.credits??o.facts.artist_name;
   const credits=Array.isArray(creditValue)?creditValue.join(', '):creditValue;
   if(typeof credits!=='string'||credits!==c.named_credit)throw Error('NAMED_CREDIT_MISMATCH');
   for(const artist of c.artists){
    if(!exactCredit(c.named_credit,artist.name))throw Error('ARTIST_NOT_IN_NAMED_CREDIT');
    const known=knownArtists.find(a=>a.id===artist.id);
    if(known&&!([known.name,...known.aliases].some(n=>n.toLocaleLowerCase()===artist.name.toLocaleLowerCase())))throw Error('IDENTITY_COLLISION');
    if(!known&&new URL(artist.identity_source).hostname==='rotation.today')throw Error('NEW_IDENTITY_NEEDS_PRIMARY_EVIDENCE');
   }
  }
 }
 const observations=b.pages.flatMap(p=>p.observations.map(o=>({...o,source_url:p.url,source_date:p.source_date,captured_at:p.captured_at})));
 if(b.phase!=='weekly_review'&&b.review_items.length)throw Error('REVIEW_PHASE_REQUIRED');
 for(const r of b.review_items){
  if(canonical(r.before)===canonical(r.after))throw Error('UNCHANGED_REVIEW_ITEM');
  for(const n of r.evidence_indexes){const o=observations[n];if(!o||o.project!==r.project||o.subject!==r.subject||o.kind!==r.kind)throw Error('REVIEW_EVIDENCE_MISMATCH')}
  if(!r.evidence_indexes.some(n=>canonical(observations[n].facts)===canonical(r.after)))throw Error('REVIEW_AFTER_NOT_SUPPORTED');
  if(r.before!==null&&!r.evidence_indexes.some(n=>canonical(observations[n].facts)===canonical(r.before)))throw Error('REVIEW_BEFORE_NOT_SUPPORTED');
 }
 return b;
}
export const observationList=b=>b.pages.flatMap(p=>p.observations.map(o=>({...o,source_url:p.url,source_date:p.source_date,captured_at:p.captured_at})));
export function reviewWeek(time){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));const d=Object.fromEntries(parts.map(p=>[p.type,p.value]));const date=new Date(`${d.year}-${d.month}-${d.day}T00:00:00Z`);date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+1)%7);return date.toISOString().slice(0,10)}
export function addToIndex(prior,b,sha){
 const old=prior??{schema_version:1,batches:[],campaigns:[]};
 const duplicate=old.batches.find(x=>x.batch_id===b.batch_id);if(duplicate){if(duplicate.sha256!==sha)throw Error('BATCH_ID_CONFLICT');return old}
 const campaigns=[...old.campaigns];if(b.campaign){const saved=campaigns.find(c=>c.id===b.campaign.id);if(saved&&canonical(saved)!==canonical(b.campaign))throw Error('CAMPAIGN_CONFLICT');if(!saved)campaigns.push(b.campaign)}
 const observations=observationList(b);const counts={hyperidol:0,suga:0};for(const o of observations)counts[o.project]++;
 const summary={batch_id:b.batch_id,sha256:sha,phase:b.phase,review_week:b.phase==='weekly_review'?reviewWeek(b.captured_at):null,captured_at:b.captured_at,counts,pages:b.pages.map(({observations,...p})=>p),review_items:b.review_items.map(r=>({...r,id:digest({project:r.project,subject:r.subject,kind:r.kind,before:r.before,after:r.after}),evidence_batch_id:b.batch_id}))};
 return {schema_version:1,batches:[...old.batches,summary],campaigns};
}
export function publicSummary(index){
 const i=index??{batches:[],campaigns:[]}, captures=i.batches.filter(b=>b.phase!=='weekly_review');
 const targetDates=new Set(i.campaigns.flatMap(c=>c.edition_dates));const visited=new Set(), partial=new Set();const families={};const counts={hyperidol:0,suga:0};let blocked=0;
 for(const b of captures){for(const project of Object.keys(counts))counts[project]+=b.counts[project];for(const p of b.pages){families[p.family]=(families[p.family]??0)+1;if(p.status==='blocked'||p.status==='unavailable')blocked++;if(p.family==='edition'&&['captured','partial'].includes(p.status)){visited.add(p.source_date);if(p.status==='partial')partial.add(p.source_date)}}}
 const latestReviewWeek=i.batches.filter(b=>b.phase==='weekly_review').map(b=>b.review_week).sort().at(-1)??null;
 const reviews=new Map(),sugaReviews=new Set();for(const b of i.batches.filter(b=>b.phase==='weekly_review'&&b.review_week===latestReviewWeek))for(const r of b.review_items){if(r.project==='hyperidol')reviews.set(r.id,{id:r.id,subject:r.subject,kind:r.kind,summary:r.summary,before:r.before,after:r.after,captured_at:b.captured_at,status:'suggestion'});else sugaReviews.add(r.id)}
 return {schema_version:1,status:i.batches.length?'receiving':'waiting_for_first_delivery',source_family:'rotation',latest_delivery:i.batches.map(b=>b.captured_at).sort().at(-1)??null,batches:i.batches.length,capture_batches:captures.length,observation_snapshots:counts,page_captures_by_family:families,blocked_page_attempts:blocked,backfill:{expected_editions:targetDates.size,visited_editions:[...visited].filter(d=>targetDates.has(d)).length,partial_editions:[...partial].filter(d=>targetDates.has(d)).length,first_edition:[...visited].filter(d=>targetDates.has(d)).sort()[0]??null,last_edition:[...visited].filter(d=>targetDates.has(d)).sort().at(-1)??null},review_week:latestReviewWeek,review_items:[...reviews.values()].slice(-12),suga_review_items:sugaReviews.size,live_changes:'held',game_writes:false};
}
async function readBody(request,max){let size=0;const chunks=[];const reader=request.body?.getReader();if(!reader)throw Error('EMPTY_BODY');try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('BODY_TOO_LARGE')}chunks.push(value)}}finally{reader.releaseLock()}return Buffer.concat(chunks)}
export function makeEvidenceReceiver({publicKey,store,knownArtists=[],now=()=>new Date()}){
 const key=createPublicKey(publicKey);const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 return async request=>{
  if(!['GET','POST'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, POST'}});
  const url=new URL(request.url);
  if(request.method==='GET'&&url.searchParams.has('batch')){
   const batchId=url.searchParams.get('batch'),time=request.headers.get('x-rotation-timestamp')??'',sig=request.headers.get('x-rotation-signature')??'';
   if(!/^[A-Za-z0-9+/]{86}==$/.test(sig)||!id.safeParse(batchId).success||!/^\d{10}$/.test(time)||Math.abs(now().getTime()/1000-Number(time))>300||!verify(null,Buffer.from('rotation-evidence-read-v1\n'+batchId+'\n'+time),key,Buffer.from(sig,'base64')))return json({error:'SIGNED_READ_REQUIRED'},401);
   try{const saved=await store.loadBatch(batchId);if(!saved)return json({error:'NOT_FOUND'},404);if(digest(saved.body_utf8)!==saved.sha256)throw Error('CORRUPT_BATCH');return json({sha256:saved.sha256,batch:JSON.parse(saved.body_utf8)})}catch{return json({error:'ARCHIVE_UNAVAILABLE'},503)}
  }
  if(request.method==='GET'){try{const index=await store.loadIndex();return json(publicSummary(index?.value??null))}catch{return json({error:'ARCHIVE_UNAVAILABLE'},503)}}
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'JSON_REQUIRED'},415);
  const sig=request.headers.get('x-rotation-signature')??'';if(!/^[A-Za-z0-9+/]{86}==$/.test(sig))return json({error:'SIGNATURE_REQUIRED'},401);
  if(Number(request.headers.get('content-length')??0)>4*1024*1024)return json({error:'BODY_TOO_LARGE'},413);
  try{
   const body=await readBody(request,4*1024*1024);if(!verify(null,body,key,Buffer.from(sig,'base64')))return json({error:'INVALID_SIGNATURE'},401);
   const raw=body.toString('utf8'),b=validateBatch(JSON.parse(raw),{now:now(),knownArtists}),sha=digest(raw);
   if(store.available===false)return json({error:'STORAGE_NOT_CONNECTED'},503);
   const prior=await store.loadIndex(),existing=await store.loadBatch(b.batch_id);
   if(existing&&(existing.sha256!==sha||digest(existing.body_utf8)!==sha))throw Error('BATCH_ID_CONFLICT');
   const next=addToIndex(prior?.value??null,b,sha);
   if(!existing)await store.saveBatch(b.batch_id,{sha256:sha,body_utf8:raw});
   const readback=await store.loadBatch(b.batch_id);if(!readback||readback.sha256!==sha||digest(readback.body_utf8)!==sha)throw Error('BATCH_READBACK_FAILED');
   const duplicate=next===prior?.value;if(!duplicate)await store.saveIndex(next,prior?.etag??null);
   return json({state:duplicate?'already_saved':'saved',batch_id:b.batch_id,sha256:sha,page_count:b.pages.length,observations:observationList(b).length,summary:publicSummary(next)});
  }catch(error){const code=String(error?.message??'REJECTED');if(/BODY_TOO_LARGE/.test(code))return json({error:'BODY_TOO_LARGE'},413);if(/CONFLICT|Precondition|already exists|BlobPrecondition/i.test(code))return json({error:'ARCHIVE_CONFLICT'},409);return json({error:'EVIDENCE_OR_STORAGE_REJECTED'},400)}
 };
}
