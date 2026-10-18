import {z} from 'zod';
import registry from './identities.json' with {type:'json'};
import {orderedWeeks,validateWeekly,type WeeklySnapshot} from './contract.ts';
const attempt=z.object({attempted_at:z.string().datetime(),status:z.enum(['complete','incomplete','blocked']),source_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),expected_country_count:z.number().int().nonnegative(),captured_country_count:z.number().int().nonnegative(),error_code:z.string().nullable()});
export const feedSchema=z.object({schema_version:z.literal(1),producer:z.literal('muse-rotation-weekly'),latest_complete:z.unknown().nullable(),weeks:z.array(z.unknown()),latest_attempt:attempt});
export function readHostedFeed(text:string,now=new Date()){
 if(Buffer.byteLength(text)>4*1024*1024)throw Error('FEED_TOO_LARGE');
 let body=text.trim();if(body.startsWith('<')){const match=body.match(/<script\b(?=[^>]*\bid=["']rotation-weekly-feed["'])(?=[^>]*\btype=["']application\/json["'])[^>]*>([\s\S]*?)<\/script\s*>/i);if(!match)throw Error('FEED_JSON_MISSING');body=match[1];}
 const data=feedSchema.parse(JSON.parse(body)),weeks=orderedWeeks(data.weeks as WeeklySnapshot[]);const latest=data.latest_complete===null?null:validateWeekly(data.latest_complete);
 for(const w of weeks)for(const song of w.songs)for(const id of song.artist_ids){const artist=w.artists.find(a=>a.id===id)!;const known=registry.artists.find(a=>a.id===id);const approved=registry.approved_recordings[song.id as keyof typeof registry.approved_recordings];const tuple=approved&&approved.title===song.title&&approved.credits===song.credits&&approved.artist_ids.includes(id);const aliases=(known?.aliases??[artist.name]).map(s=>s.normalize('NFKC').toLowerCase());const credits=[song.credits,...song.credits.replace(/[()[\]]/g,' ').split(/\s*(?:,|&|×)\s*|\s+(?:feat\.?|featuring|with|x)\s+/i)].map(s=>s.trim().normalize('NFKC').toLowerCase());if(!tuple&&!credits.some(c=>aliases.includes(c)))throw Error('UNREVIEWED_ARTIST_CREDIT');if(artist.roster_id&&!tuple&&aliases.some(a=>a.length<2))throw Error('AMBIGUOUS_ARTIST_ROUTE');}
 if(data.latest_attempt.captured_country_count>data.latest_attempt.expected_country_count)throw Error('INVALID_ATTEMPT_COUNTS');
 if(Date.parse(data.latest_attempt.attempted_at)>now.getTime()+300000)throw Error('FUTURE_ATTEMPT');
 for(const w of weeks){for(const a of w.artists){if(a.roster_id){const known=registry.artists.find(k=>k.id===a.id);if(!known||known.name!==a.name||known.roster_id!==a.roster_id)throw Error('UNREVIEWED_ARTIST_ROUTE');}}if(w.coverage.status!=='complete'||w.coverage.classification_status!=='reviewed')throw Error('UNREVIEWED_OR_PARTIAL_WEEK');if(new Date(w.edition_date+'T00:00:00Z').getUTCDay()!==6)throw Error('NOT_SATURDAY_EDITION');if(Date.parse(w.captured_at)>now.getTime()+300000||Date.parse(w.edition_date)>now.getTime())throw Error('FUTURE_WEEK');if(Date.parse(w.edition_date)-Date.parse(w.source_date)>2*86400000)throw Error('STALE_SOURCE_WEEK');}
 if(latest&&JSON.stringify(weeks.at(-1))!==JSON.stringify(latest))throw Error('LATEST_WEEK_MISMATCH');
 if(!latest&&weeks.length)throw Error('LATEST_WEEK_MISSING');
 if(data.latest_attempt.status==='complete'&&(!latest||data.latest_attempt.source_date!==latest.source_date||data.latest_attempt.expected_country_count!==latest.coverage.expected_countries.length||data.latest_attempt.captured_country_count!==latest.coverage.captured_countries.length||data.latest_attempt.error_code!==null))throw Error('FALSE_COMPLETE_ATTEMPT');
 return {...data,weeks,latest_complete:latest};
}
