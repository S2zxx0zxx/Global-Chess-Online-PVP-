// Mandatory BEFORE a real ad-enabled AAB build. These are human/owner
// gate attestations and IDs, not automatic legal compliance certification.
import {M4_TEST_APP_ID,M4_TEST_REWARDED_ID} from '../src/monetization-policy.js';
const e=process.env;
const demand=(value,why)=>{if(value!== 'approved')throw Error(why+' has not been approved');};
demand(e.CHESS_ADMOB_ACCOUNT_APPROVAL,'AdMob publisher account');
demand(e.CHESS_AD_PRIVACY_POLICY_SIGNOFF,'Privacy policy and Data safety');
demand(e.CHESS_AD_TARGET_AUDIENCE_SIGNOFF,'Play audience/Families treatment');
demand(e.CHESS_AD_PLAY_POLICY_SIGNOFF,'Play ad placement and monetization policy');
if(!/^https:\/\/[^\s/?#]+\.[^\s/?#]+\S*$/.test(e.CHESS_AD_PRIVACY_URL??''))
  throw Error('Public HTTPS privacy policy URL is required for an ad-enabled release');
if(!/^ca-app-pub-\d{16}~\d{10}$/.test(e.CHESS_ADMOB_APP_ID??'') ||
   e.CHESS_ADMOB_APP_ID===M4_TEST_APP_ID)
  throw Error('A valid NON-demo AdMob application ID is required');
if(!/^ca-app-pub-\d{16}\/\d{10}$/.test(e.CHESS_ADMOB_REWARDED_ID??'') ||
   e.CHESS_ADMOB_REWARDED_ID===M4_TEST_REWARDED_ID)
  throw Error('A valid NON-demo AdMob rewarded unit ID is required');
if(e.CHESS_M4_ADS_TEST==='true'||e.VITE_CHESS_ADS_MODE==='test')
  throw Error('A Play release must never include demo ad mode');
console.log('M04 owner-provided ad-build prerequisites present. This is not independent legal approval.');
