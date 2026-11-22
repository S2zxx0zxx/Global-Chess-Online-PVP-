// Called immediately after cap sync, BEFORE expensive Gradle compilation.
// 'npm install --no-save' previously produced an APK but no native plugins:
// both Back/lifecycle and AdMob must now be present in the generated registry.
import {readFileSync,existsSync} from 'node:fs';

const path='android/app/src/main/assets/capacitor.plugins.json';
if(!existsSync(path))throw Error('Capacitor plugin registry missing. Refuse misleading native build.');
const registered=JSON.parse(readFileSync(path,'utf8'));
if(!Array.isArray(registered))throw Error('Unexpected native plugin registry shape');
const names=new Set(registered.map(item=>item?.pkg).filter(x=>typeof x==='string'));
console.log('Native plugin packages detected:',[...names].join(', ')||'(none)');
if(!names.has('@capacitor/app'))throw Error('Capacitor App lifecycle plugin was NOT registered; Android Back would be broken');
const adEnabled=process.env.CHESS_M4_ADS_TEST==='true'||process.env.CHESS_M4_ADS_LIVE==='true';
if(adEnabled&&!names.has('@capacitor-community/admob'))
  throw Error('Native AdMob/UMP plugin was NOT registered; do not claim usable rewarded ads');
if(!adEnabled&&names.has('@capacitor-community/admob'))
  throw Error('Ad-free APK unexpectedly bundles native AdMob SDK');
const gradle='android/capacitor.settings.gradle';
const settings=existsSync(gradle)?readFileSync(gradle,'utf8'):'';
if(!settings.includes('capacitor-app'))throw Error('Android App plugin not linked in Gradle');
if(adEnabled&&!settings.includes('capacitor-community-admob'))
  throw Error('AdMob SDK not linked in Gradle');
console.log('Registered native Capacitor App'+(adEnabled?' + AdMob/UMP':' (ad-free)')+' plugins verified before build');
