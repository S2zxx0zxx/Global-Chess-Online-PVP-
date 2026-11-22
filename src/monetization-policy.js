// CH-01 / M-04: explicit, privacy-first, optional native monetization.
// Browser/PWA and every unspecified build fail closed. No fictional revenues.
export const M4_AD_PREFERENCE_KEY = 'global-chess.optional-ads.v1';
export const M4_SUPPORTER_KEY = 'global-chess.supporter-crest.v1';
export const M4_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const M4_TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

const liveUnitPattern=/^ca-app-pub-\d{16}\/\d{10}$/;
const allowedModes=new Set(['disabled','test','live']);

export function resolveMonetizationConfig(env={},platform='web'){
  const mode=env.VITE_CHESS_ADS_MODE??'disabled';
  if(!allowedModes.has(mode))return {mode:'disabled',reason:'Unrecognized ad configuration'};
  if(platform!=='android')return {mode:'disabled',reason:'Browser and PWA ads are not enabled'};
  if(mode==='disabled')return {mode,reason:'Monetization is disabled by default'};
  if(mode==='test'){
    if(env.PROD_RELEASE_BUILD==='true')return {mode:'disabled',reason:'Test ads cannot ship in a Play release'};
    return {mode:'test',rewardedId:M4_TEST_REWARDED_ID,reason:'Google demo ads only'};
  }
  if(env.VITE_CHESS_ADS_POLICY_APPROVED!=='true' ||
     env.VITE_CHESS_ADS_AUDIENCE_APPROVED!=='true' ||
     env.VITE_CHESS_ADS_PRIVACY_APPROVED!=='true'){
    return {mode:'disabled',reason:'Ad privacy, audience and policy approvals have not all been recorded'};
  }
  const privacyUrl=env.VITE_CHESS_AD_PRIVACY_URL??'';
  if(!/^https:\/\/[^\s/?#]+\.[^\s/?#]+\S*$/.test(privacyUrl))
    return {mode:'disabled',reason:'Approved HTTPS advertising privacy-policy link is missing'};
  const rewardedId=env.VITE_CHESS_ADS_REWARDED_ID??'';
  if(!liveUnitPattern.test(rewardedId)||rewardedId===M4_TEST_REWARDED_ID)
    return {mode:'disabled',reason:'Approved real rewarded ad unit is missing'};
  return {mode:'live',rewardedId,privacyUrl,reason:'Native rewarded ads may be offered after UMP review'};
}

export function isNaturalAdBreak({screen,outcome,online}={}){
  return screen==='result' && typeof outcome==='string' && outcome.trim().length>0 && !online;
}

export function isValidNativeReward(reward){
  return Boolean(reward&&typeof reward==='object' &&
    typeof reward.type==='string'&&reward.type.trim().length>0 &&
    typeof reward.amount==='number'&&Number.isFinite(reward.amount)&&
    reward.amount>0&&reward.amount<=1000000);
}

export function readSupporterReward(raw){
  if(raw===null||raw===undefined)return null;
  const data=JSON.parse(raw);
  if(!data||data.version!==1||data.kind!=='supporter-crest'||
      !Number.isSafeInteger(data.earnedAt)||data.earnedAt<=0 ||
      Object.keys(data).sort().join(',')!=='earnedAt,kind,version'){
    throw new Error('Invalid local supporter record. Existing bytes must be preserved.');
  }
  return data;
}

export async function commitSupporterReward(storage,now=()=>Date.now()){
  const original=storage.getItem(M4_SUPPORTER_KEY);
  const existing=readSupporterReward(original);
  if(existing)return {awarded:false,persisted:storage.durable!==false};
  if(storage.durable===false)throw Error('Cannot persist a supporter badge on this device');
  const earnedAt=Math.floor(now());
  if(!Number.isSafeInteger(earnedAt)||earnedAt<=0)throw Error('Invalid local reward timestamp');
  storage.setItem(M4_SUPPORTER_KEY,JSON.stringify({version:1,kind:'supporter-crest',earnedAt}));
  try{
    await storage.flush();
    if(storage.durable===false)throw Error('Storage became volatile during reward commit');
    return {awarded:true,persisted:true};
  }catch(err){
    try{
      if(original===null)storage.removeItem(M4_SUPPORTER_KEY);
      else storage.setItem(M4_SUPPORTER_KEY,original);
      if(storage.durable!==false)await storage.flush();
    }catch{/* Preserve uncertainty, never claim reward saved. */}
    throw new Error('Supporter badge could not be confirmed saved',{cause:err});
  }
}
