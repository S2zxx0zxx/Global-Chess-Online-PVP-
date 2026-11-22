import test from 'node:test';
import assert from 'node:assert/strict';
import {
 M4_TEST_APP_ID,M4_TEST_REWARDED_ID,M4_SUPPORTER_KEY,
 resolveMonetizationConfig,isNaturalAdBreak,isValidNativeReward,
 readSupporterReward,commitSupporterReward,
} from '../src/monetization-policy.js';

const live=()=>({VITE_CHESS_ADS_MODE:'live',
 VITE_CHESS_ADS_POLICY_APPROVED:'true',VITE_CHESS_ADS_AUDIENCE_APPROVED:'true',
 VITE_CHESS_ADS_PRIVACY_APPROVED:'true',
 VITE_CHESS_ADS_REWARDED_ID:'ca-app-pub-1234567890123456/1234567890'});
function storage(){
 const v=new Map();
 return {durable:true,getItem:k=>v.get(k)??null,setItem:(k,x)=>v.set(k,String(x)),
 removeItem:k=>v.delete(k),async flush(){},v};
}
test('no ads on the web or with absent flags, irrespective of SDK availability',()=>{
 assert.equal(resolveMonetizationConfig({},'android').mode,'disabled');
 assert.equal(resolveMonetizationConfig(live(),'web').mode,'disabled');
 assert.equal(resolveMonetizationConfig({VITE_CHESS_ADS_MODE:'enabled'},'android').mode,'disabled');
});
test('real ads require each approved legal/audience/privacy flag and an actual ad ID',()=>{
 for(const key of ['VITE_CHESS_ADS_POLICY_APPROVED','VITE_CHESS_ADS_AUDIENCE_APPROVED','VITE_CHESS_ADS_PRIVACY_APPROVED','VITE_CHESS_ADS_REWARDED_ID']){
  const env=live();delete env[key];
  assert.equal(resolveMonetizationConfig(env,'android').mode,'disabled',key);
 }
 assert.equal(resolveMonetizationConfig(live(),'android').mode,'live');
 assert.equal(resolveMonetizationConfig({...live(),VITE_CHESS_ADS_REWARDED_ID:M4_TEST_REWARDED_ID},'android').mode,'disabled');
});
test('Google sample IDs are available in explicitly requested test APKs only',()=>{
 assert.match(M4_TEST_APP_ID,/~3347511713$/);
 assert.equal(resolveMonetizationConfig({VITE_CHESS_ADS_MODE:'test'},'android').rewardedId,M4_TEST_REWARDED_ID);
 assert.equal(resolveMonetizationConfig({VITE_CHESS_ADS_MODE:'test',PROD_RELEASE_BUILD:'true'},'android').mode,'disabled');
});
test('an ad request is never a chess move, puzzle, ongoing match or online room',()=>{
 for(const screen of ['match','menu','pause','play','puzzle','home','review','settings']){
  assert.equal(isNaturalAdBreak({screen,outcome:'White wins',online:false}),false);
 }
 assert.equal(isNaturalAdBreak({screen:'result',outcome:'',online:false}),false);
 assert.equal(isNaturalAdBreak({screen:'result',outcome:'Draw',online:true}),false);
 assert.equal(isNaturalAdBreak({screen:'result',outcome:'Black wins',online:false}),true);
});
test('only a valid native reward callback can credit a purely cosmetic badge',()=>{
 for(const r of [null,{},0,{type:'',amount:1},{type:'coin',amount:0},
  {type:'crest',amount:NaN},{type:'crest',amount:-1},{type:'crest',amount:Infinity}]){
  assert.equal(isValidNativeReward(r),false);
 }
 assert.equal(isValidNativeReward({type:'crest',amount:1}),true);
});
test('local supporter reward can be committed exactly once',async()=>{
 const s=storage();assert.deepEqual(await commitSupporterReward(s,()=>2000000000000),{awarded:true,persisted:true});
 assert.deepEqual(await commitSupporterReward(s,()=>2000000001234),{awarded:false,persisted:true});
 assert.equal(readSupporterReward(s.getItem(M4_SUPPORTER_KEY)).earnedAt,2000000000000);
});
test('aborted reward transaction restores prior bytes and reports failure',async()=>{
 const s=storage();let calls=0;
 s.flush=async()=>{if(++calls===1)throw Error('AbortError');};
 await assert.rejects(commitSupporterReward(s),/could not be confirmed/);
 assert.equal(s.getItem(M4_SUPPORTER_KEY),null);
 assert.equal(calls,2);
});
test('invalid or mutated supporter records are never silently overwritten',async()=>{
 const s=storage();s.setItem(M4_SUPPORTER_KEY,'{corrupt');
 await assert.rejects(commitSupporterReward(s),SyntaxError);
 assert.equal(s.getItem(M4_SUPPORTER_KEY),'{corrupt');
});
test('session-only reward grants are refused instead of pretending they persist',async()=>{
 const s=storage();s.durable=false;
 await assert.rejects(commitSupporterReward(s),/Cannot persist/);
 assert.equal(s.v.size,0);
});
