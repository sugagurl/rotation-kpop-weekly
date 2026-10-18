import {readHostedFeed} from './validate-feed.ts';
import {createHash} from 'node:crypto';
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function mergePacket(saved,raw,now=new Date()){
 const incoming=readHostedFeed(typeof raw==='string'?raw:JSON.stringify(raw),now);
 const prior=readHostedFeed(JSON.stringify(saved),now);
 for(const week of prior.weeks){const next=incoming.weeks.find(w=>w.edition_date===week.edition_date);if(!next||hash(next)!==hash(week))throw Error('IMMUTABLE_WEEK_CONFLICT');}
 if(Date.parse(incoming.latest_attempt.attempted_at)<Date.parse(prior.latest_attempt.attempted_at))throw Error('ATTEMPT_REGRESSION');
 if(incoming.latest_attempt.attempted_at===prior.latest_attempt.attempted_at&&incoming.latest_attempt.captured_country_count<prior.latest_attempt.captured_country_count)throw Error('ATTEMPT_REGRESSION');
 return incoming;
}
