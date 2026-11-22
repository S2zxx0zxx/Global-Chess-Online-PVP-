import {
 M4_AD_PREFERENCE_KEY,M4_SUPPORTER_KEY,resolveMonetizationConfig,
 isNaturalAdBreak,isValidNativeReward,readSupporterReward,commitSupporterReward,
} from './monetization-policy.js';

// Provider-neutral business boundary. No ads initialize when disabled, on
// browser/PWA, without explicit opt-in, or until native UMP permits requests.
export function createMonetizationController({
  env={},platform='web',getPlugin=()=>null,preferences,storage,
  getMoment=()=>({}),onChange=()=>{},now=()=>Date.now(),
}={}){
  const config=resolveMonetizationConfig(env,platform);
  let consent=null,initialized=false,busy=false;
  let optedIn=false;
  try{optedIn=preferences?.getItem(M4_AD_PREFERENCE_KEY)==='yes';}
  catch{/* Browser privacy mode is opt-out, not automatic opt-in. */}
  let lastError='';
  const publish=()=>{try{onChange();}catch{/* Ads UI never blocks chess. */}};
  const plugin=()=>getPlugin?.()??null;
  const available=()=>config.mode!=='disabled' && Boolean(plugin()?.requestConsentInfo) &&
    Boolean(plugin()?.prepareRewardVideoAd) && Boolean(plugin()?.showRewardVideoAd);

  function status(){
    let earned=false,corrupt=false;
    try{earned=Boolean(readSupporterReward(storage?.getItem(M4_SUPPORTER_KEY)));}catch{corrupt=true;}
    return {
      mode:config.mode,available:available(),optedIn,
      enabled:available()&&optedIn&&!corrupt&&storage?.durable!==false,
      consentCanRequest:consent?.canRequestAds===true,
      privacyOptionsRequired:consent?.privacyOptionsRequirementStatus==='REQUIRED'||
        consent?.privacyOptionsRequirementStatus===2,
      earned,corrupt,busy,reason:lastError||config.reason,
    };
  }

  function optIn(value){
    if(busy)return {ok:false,reason:'An ad request is in progress'};
    if(value && !available())return {ok:false,reason:'Native AdMob is not configured for this build'};
    try{
      // A local preference is NOT GDPR consent. UMP always remains authoritative.
      if(value)preferences.setItem(M4_AD_PREFERENCE_KEY,'yes');
      else preferences.removeItem(M4_AD_PREFERENCE_KEY);
      optedIn=Boolean(value);
      if(!optedIn){consent=null;lastError='Optional ads switched off. Chess works unchanged.';}
      else lastError='Enabled locally; native privacy approval is still required before ads.';
      publish();return {ok:true,reason:lastError};
    }catch{
      return {ok:false,reason:'Could not save the optional-ads choice on this device'};
    }
  }

  async function requestConsent(){
    if(!status().enabled) return {ok:false,reason:'Optional ads are not enabled'};
    try{
      const native=plugin();
      consent=await native.requestConsentInfo();
      const required=consent?.status==='REQUIRED'||consent?.status===2;
      if(required&&consent?.isConsentFormAvailable===true)
        consent=await native.showConsentForm();
      // A missing or rejected form is never treated as consent.
      if(consent?.canRequestAds!==true){
        lastError='Native privacy choices do not currently permit ad requests.';
        publish();return {ok:false,reason:lastError};
      }
      lastError='';publish();
      return {ok:true};
    }catch{
      consent=null;lastError='Consent could not be verified. No ad was requested.';
      publish();return {ok:false,reason:lastError};
    }
  }

  async function privacyOptions(){
    if(!available())return {ok:false,reason:'Native privacy options are unavailable in this build'};
    try{
      await plugin().showPrivacyOptionsForm();
      consent=null;initialized=false;
      lastError='Privacy options reviewed; ad permissions will be checked again.';
      publish();return {ok:true,reason:lastError};
    }catch{
      return {ok:false,reason:'Privacy options cannot be opened; ads remain optional.'};
    }
  }

  async function rewarded(){
    if(busy)return {ok:false,reason:'An optional ad is already processing'};
    if(!isNaturalAdBreak(getMoment()))return {ok:false,reason:'Ads are offered only after a completed offline match'};
    const before=status();
    if(!before.enabled)return {ok:false,reason:'Optional native ads are unavailable, off, or not safely persisted'};
    if(before.earned)return {ok:false,reason:'The optional supporter crest has already been earned'};
    busy=true;publish();
    try{
      const allowed=await requestConsent();
      if(!allowed.ok)return allowed;
      if(!initialized){
        await plugin().initialize();
        initialized=true;
      }
      const native=plugin();
      await native.prepareRewardVideoAd({
        adId:config.rewardedId,isTesting:config.mode==='test',
      });
      // Use the resolved show result, NOT an event as well: one reward source.
      const reward=await native.showRewardVideoAd({adId:config.rewardedId});
      if(!isValidNativeReward(reward)){
        return {ok:false,reason:'Ad ended without a confirmed reward. Gameplay is unchanged.'};
      }
      const saved=await commitSupporterReward(storage,now);
      if(!saved.persisted)return {ok:false,reason:'Supporter badge was not saved'};
      return {ok:true,awarded:saved.awarded,
        reason:saved.awarded?'Supporter Crest earned on this device. No gameplay advantage was granted.':
          'Supporter Crest already recorded.'};
    }catch{
      lastError='Ad unavailable or reward storage could not be confirmed. Chess remains fully playable.';
      return {ok:false,reason:lastError};
    }finally{
      busy=false;publish();
    }
  }

  return {status,optIn,requestConsent,privacyOptions,rewarded};
}

// Native Capacitor can expose plugins either through the registered JS proxy
// or through its injected nativePromise bridge. Both routes are restricted to
// Android with the REAL native AdMob plugin installed; no web mock is used.
export function findNativeAdMob(cap){
  if(!cap||typeof cap.getPlatform!=='function'||cap.getPlatform()!=='android')
    return null;
  if(typeof cap.isPluginAvailable==='function'&&!cap.isPluginAvailable('AdMob'))
    return null;
  const existing=cap.Plugins?.AdMob;
  if(existing?.requestConsentInfo && existing?.showRewardVideoAd)return existing;
  if(typeof cap.nativePromise!=='function')return null;
  const call=(method,options={})=>cap.nativePromise('AdMob',method,options);
  return {
    requestConsentInfo:()=>call('requestConsentInfo'),
    showConsentForm:()=>call('showConsentForm'),
    showPrivacyOptionsForm:()=>call('showPrivacyOptionsForm'),
    initialize:()=>call('initialize'),
    prepareRewardVideoAd:options=>call('prepareRewardVideoAd',options),
    showRewardVideoAd:options=>call('showRewardVideoAd',options),
  };
}
export function createGameMonetization(storage, getMoment, onChange){
  const env=import.meta.env??{};
  const cap=globalThis.Capacitor;
  const platform=typeof cap?.getPlatform==='function'?cap.getPlatform():'web';
  let preferences;
  try{preferences=globalThis.localStorage;}catch{preferences=null;}
  return createMonetizationController({
    env,platform,
    getPlugin:()=>findNativeAdMob(globalThis.Capacitor),
    preferences,storage,getMoment,onChange,
  });
}
