// Called AFTER cap sync. Do not inject an AdMob ID into ad-free builds.
// Debug uses Google's documented sample APP ID; live requires owner approval.
import {readFileSync,writeFileSync} from 'node:fs';
import {M4_TEST_APP_ID,M4_TEST_REWARDED_ID} from '../src/monetization-policy.js';

const test=process.env.CHESS_M4_ADS_TEST==='true';
const live=process.env.CHESS_M4_ADS_LIVE==='true';
if(test===live)throw Error('Select exactly one of test mode or live mode for native ads');
const appId=test?M4_TEST_APP_ID:process.env.CHESS_ADMOB_APP_ID??'';
const unit=test?M4_TEST_REWARDED_ID:process.env.CHESS_ADMOB_REWARDED_ID??'';
if(!/^ca-app-pub-\d{16}~\d{10}$/.test(appId)||
   !/^ca-app-pub-\d{16}\/\d{10}$/.test(unit))throw Error('Invalid AdMob application/unit identifiers');
if(live&&(appId===M4_TEST_APP_ID||unit===M4_TEST_REWARDED_ID))
  throw Error('Sample AdMob identifiers must never appear in a live release');
const file='android/app/src/main/AndroidManifest.xml';
let text=readFileSync(file,'utf8');
if(text.includes('com.google.android.gms.ads.APPLICATION_ID'))
  throw Error('AdMob app metadata already exists; refuse to replace it blindly');
if(!/<application\b[^>]*>/.test(text))throw Error('Android application manifest tag missing');
const meta='\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="'+appId+'" />';
text=text.replace(/<application\b[^>]*>/,tag=>tag+meta);
writeFileSync(file,text);
if(!readFileSync(file,'utf8').includes('com.google.android.gms.ads.APPLICATION_ID'))
  throw Error('AdMob manifest installation could not be verified');
console.log(test?'AdMob native SDK configured with Google TEST app and rewarded unit':
                   'AdMob native SDK configured with approved owner production application ID');
