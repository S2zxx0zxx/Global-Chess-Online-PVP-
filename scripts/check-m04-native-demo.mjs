// Static packaging gate. Does NOT claim that a physical user has consented.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {M4_TEST_APP_ID,M4_TEST_REWARDED_ID} from '../src/monetization-policy.js';

const manifest='android/app/src/main/AndroidManifest.xml';
if(!existsSync(manifest))throw Error('Android manifest missing');
const xml=readFileSync(manifest,'utf8');
if(!xml.includes('com.google.android.gms.ads.APPLICATION_ID') ||
   !xml.includes(M4_TEST_APP_ID))
  throw Error('Android native demo AdMob app ID is missing');
const plugins='android/app/src/main/assets/capacitor.plugins.json';
if(!existsSync(plugins))throw Error('Capacitor native plugin registry missing');
const classes=readFileSync(plugins,'utf8');
if(!/com\.getcapacitor\.community\.admob|AdMob/i.test(classes))
  throw Error('Native AdMob Capacitor plugin not registered');
const out='android/app/build/outputs/apk/debug/app-debug.apk';
if(!existsSync(out))throw Error('Native M04 demo APK missing');
const jsdir='dist/assets';
const assets=readdirSync(jsdir).filter(x=>x.endsWith('.js'));
const bundle=assets.map(x=>readFileSync(jsdir+'/'+x,'utf8')).join('');
if(!bundle.includes(M4_TEST_REWARDED_ID))
  throw Error('Demo mode did not include the official Google rewarded TEST unit');
console.log('Verified Android demo SDK registration, Google test app ID, rewarded unit and built APK.');
