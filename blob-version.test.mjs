import test from 'node:test';
import assert from 'node:assert/strict';
import {privateJsonReader} from './blob-version.mjs';
function reader({bodyTag='W/"version-1"',metadataTag='"version-1"',available=true}={}){let heads=0;return {get heads(){return heads},read:privateJsonReader({available,get:async(path,options)=>{assert.equal(path,'index.json');assert.deepEqual(options,{access:'private',useCache:false});return {statusCode:200,stream:new Response('{"batches":[1]}').body,blob:{etag:bodyTag}}},head:async()=>{heads++;return {etag:metadataTag}}})}}
test('compressed private GET is tied to the matching strong metadata version for conditional writes',async()=>{const r=reader();assert.deepEqual(await r.read('index.json',{versioned:true}),{value:{batches:[1]},etag:'"version-1"'});assert.equal(r.heads,1)});
test('a version race between content and metadata is rejected rather than overwriting newer content',async()=>{await assert.rejects(reader({metadataTag:'"version-2"'}).read('index.json',{versioned:true}),/Precondition failed/)});
test('missing or malformed object version cannot become an unconditional write',async()=>{for(const bodyTag of ['',null,'W/other'])await assert.rejects(reader({bodyTag}).read('index.json',{versioned:true}),/Precondition failed/)});
test('immutable bodies do not need a metadata request',async()=>{const r=reader();assert.deepEqual((await r.read('index.json')).value,{batches:[1]});assert.equal(r.heads,0)});
test('unavailable storage performs no object reads',async()=>{const r=reader({available:false});assert.equal(await r.read('index.json',{versioned:true}),null);assert.equal(r.heads,0)});
