import test from 'node:test';
import assert from 'node:assert/strict';
import {createMonetizationController,findNativeAdMob,awaitNativeAdResult} from '../src/monetization.js';
import {M4_SUPPORTER_KEY,M4_AD_PREFERENCE_KEY} from '../src/monetization-policy.js';

function testRig(override={}){
 const calls=[],values=new Map(),prefs=new Map();
 const native={
  async requestConsentInfo(){calls.push('ump');return {status:'REQUIRED',isConsentFormAvailable:true,canRequestAds:false};},
  async showConsentForm(){calls.push('form');return {status:'OBTAINED',canRequestAds:true,privacyOptionsRequirementStatus:'REQUIRED'};},
  async initialize(){calls.push('init');},
  async prepareRewardVideoAd(o){calls.push('prepare '+o.adId);return {adUnitId:o.adId};},
  async showRewardVideoAd(){calls.push('show');return {type:'Supporter Crest',amount:1};},
  async showPrivacyOptionsForm(){calls.push('privacy');},
  ...override.native,
 };
 const s={
  durable:true,getItem:k=>values.get(k)??null,
  setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k),async flush(){calls.push('commit');},
 };
 const pref={getItem:k=>prefs.get(k)??null,setItem:(k,v)=>prefs.set(k,v),removeItem:k=>prefs.delete(k)};
 const game={screen:'result',outcome:'White wins by checkmate',online:false};
 const controller=createMonetizationController({
  env:{VITE_CHESS_ADS_MODE:'test'},platform:'android',
  getPlugin:()=>native,storage:s,preferences:pref,getMoment:()=>game,
  now:()=>2000000000000,...override,
 });
 return {calls,values,prefs,s,native,pref,game,controller};
}
test('no native call on startup or until user opts in and explicitly taps reward',async()=>{
 const h=testRig();
 assert.equal(h.controller.status().optedIn,false);
 assert.deepEqual(h.calls,[]);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.deepEqual(h.calls,[]);
 assert.equal(h.controller.optIn(true).ok,true);
 assert.equal(h.pref.getItem(M4_AD_PREFERENCE_KEY),'yes');
 assert.deepEqual(h.calls,[]);
});
test('consent form precedes SDK initialization, load, show and durable reward',async()=>{
 const h=testRig();h.controller.optIn(true);
 const r=await h.controller.rewarded();
 assert.equal(r.ok,true);
 assert.deepEqual(h.calls.slice(0,4),['ump','form','init','prepare ca-app-pub-3940256099942544/5224354917']);
 assert.deepEqual(h.calls.slice(4),['show','commit']);
 assert.equal(h.controller.status().earned,true);
 assert.equal(h.values.has(M4_SUPPORTER_KEY),true);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.equal(h.calls.filter(x=>x==='show').length,1);
});
test('consent rejection denies SDK init, load and reward',async()=>{
 const h=testRig({native:{async showConsentForm(){h.calls.push('form');return {canRequestAds:false};}}});
 h.controller.optIn(true);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.deepEqual(h.calls,['ump','form']);
});
test('UMP request errors fail closed without touching the ad provider SDK',async()=>{
 const h=testRig({native:{async requestConsentInfo(){throw Error('offline');}}});
 h.controller.optIn(true);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.deepEqual(h.calls,[]);
});
test('rewarded show without actual verified native reward cannot award badge',async()=>{
 const h=testRig({native:{async showRewardVideoAd(){h.calls.push('show');return {type:'',amount:0};}}});
 h.controller.optIn(true);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.equal(h.values.size,0);
});
test('only after finished local results; no interruption of any chess move',async()=>{
 const h=testRig();
 h.controller.optIn(true);
 for(const screen of ['match','pause','menu','puzzle','play','profile']){
  h.game.screen=screen;
  assert.equal((await h.controller.rewarded()).ok,false);
 }
 h.game.screen='result';h.game.online=true;
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.deepEqual(h.calls,[]);
});
test('browser and absent plugin can never issue even test ad requests',async()=>{
 const h=testRig({platform:'web'});
 h.controller.optIn(true);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.deepEqual(h.calls,[]);
});
test('disabling ads prevents new requests without erasing prior supporter record',async()=>{
 const h=testRig();h.controller.optIn(true);
 assert.equal((await h.controller.rewarded()).ok,true);
 h.controller.optIn(false);
 assert.equal(h.controller.status().optedIn,false);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.equal(h.controller.status().earned,true);
});
test('privacy options are user-invoked, not a hidden UMP reset',async()=>{
 const h=testRig();h.controller.optIn(true);
 assert.equal((await h.controller.privacyOptions()).ok,true);
 assert.deepEqual(h.calls,['privacy']);
});
test('session-only or corrupt local reward storage cannot claim supporter credit',async()=>{
 const h=testRig();h.s.durable=false;h.controller.optIn(true);
 assert.equal((await h.controller.rewarded()).ok,false);
 assert.deepEqual(h.calls,[]);
});

test('native plugin is discovered only on installed Android, never on PWA',async()=>{
  const called=[];
  const cap={getPlatform:()=> 'android',isPluginAvailable:name=>name==='AdMob',
    nativePromise:async(name,method,opts)=>{called.push([name,method,opts]);return {canRequestAds:false};}};
  const bridge=findNativeAdMob(cap);
  assert.ok(bridge);
  await bridge.requestConsentInfo();
  assert.deepEqual(called,[['AdMob','requestConsentInfo',{}]]);
  assert.equal(findNativeAdMob({...cap,getPlatform:()=> 'web'}),null);
  assert.equal(findNativeAdMob({...cap,isPluginAvailable:()=>false}),null);
});

test('restart refreshes UMP only for already explicitly opted-in users',async()=>{
  const h=testRig();
  assert.equal((await h.controller.onLaunch()).ok,false);
  assert.deepEqual(h.calls,[]);
  h.controller.optIn(true);
  assert.equal((await h.controller.onLaunch()).ok,true);
  assert.deepEqual(h.calls,['ump','form']);
  assert.equal(h.calls.includes('init'),false);
});

test('a failed ad load returns a safe reason and never credits a supporter',async()=>{
  const h=testRig({native:{async prepareRewardVideoAd(){h.calls.push('prepare');throw Error('No fill');}}});
  h.controller.optIn(true);
  const r=await h.controller.rewarded();
  assert.equal(r.ok,false);
  assert.equal(h.s.getItem(M4_SUPPORTER_KEY),null);
  assert.deepEqual(h.calls,['ump','form','init','prepare']);
});

test('concurrent reward clicks never load two rewarded ads',async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  const h=testRig({native:{async showRewardVideoAd(){h.calls.push('show');await gate;return {type:'Supporter Crest',amount:1};}}});
  h.controller.optIn(true);
  const pending=h.controller.rewarded();
  await Promise.resolve();
  assert.equal((await h.controller.rewarded()).ok,false);
  release();
  assert.equal((await pending).ok,true);
  assert.equal(h.calls.filter(s=>s==='show').length,1);
});

test('a reward commit failure never reports the cosmetic as unlocked',async()=>{
  const h=testRig();
  h.s.flush=async()=>{throw Error('QuotaExceeded');};
  h.controller.optIn(true);
  const result=await h.controller.rewarded();
  assert.equal(result.ok,false);
  assert.equal(h.controller.status().earned,false);
});

test('a hung native rewarded ad eventually returns control without issuing XP or badge',async()=>{
  const h=testRig({showTimeoutMs:5,native:{
    async showRewardVideoAd(){h.calls.push('show');return new Promise(()=>{});}
  }});
  h.controller.optIn(true);
  const result=await h.controller.rewarded();
  assert.equal(result.ok,false);
  assert.equal(h.controller.status().busy,false);
  assert.equal(h.s.getItem(M4_SUPPORTER_KEY),null);
  assert.equal(h.calls.includes('show'),true);
});

test('native callback timeout rejects in bounded time and late results cannot credit rewards',async()=>{
  await assert.rejects(awaitNativeAdResult(new Promise(()=>{}),5),/timed out/);
  assert.throws(()=>awaitNativeAdResult(Promise.resolve(null),0),/Invalid native timeout/);
});

test('attempt cooldown and maximum three provider requests prevent rapid ad loops',async()=>{
  let now=2000000000000;
  const h=testRig({now:()=>now,native:{
    async prepareRewardVideoAd(){h.calls.push('prepare');throw Error('No fill');}
  }});
  h.controller.optIn(true);
  assert.equal((await h.controller.rewarded()).ok,false);
  assert.equal((await h.controller.rewarded()).ok,false);
  assert.equal(h.calls.filter(x=>x==='prepare').length,1);
  now+=31000;
  assert.equal((await h.controller.rewarded()).ok,false);
  now+=31000;
  assert.equal((await h.controller.rewarded()).ok,false);
  now+=31000;
  const attempt=(await h.controller.rewarded());
  assert.equal(attempt.ok,false);
  assert.match(attempt.reason,/attempt limit/i);
  assert.equal(h.calls.filter(x=>x==='prepare').length,3);
});
