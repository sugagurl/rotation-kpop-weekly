import {test} from 'node:test';import assert from 'node:assert/strict';import {latestSaturday,isCurrent} from './status.mjs';
test('Pacific Saturday freshness exposes a stopped producer and blocked attempts',()=>{
 const packet={weeks:[{edition_date:'2026-10-17'}],latest_attempt:{status:'complete'}};
 assert.equal(isCurrent(packet,new Date('2026-10-18T08:00:00Z')),true);
 assert.equal(isCurrent(packet,new Date('2026-10-24T07:00:00Z')),false);
 assert.equal(isCurrent({...packet,latest_attempt:{status:'blocked'}},new Date('2026-10-18T08:00:00Z')),false);
 assert.equal(latestSaturday(new Date('2026-10-24T06:59:59Z')),'2026-10-17');
 assert.equal(latestSaturday(new Date('2026-10-24T07:00:00Z')),'2026-10-24');
});
