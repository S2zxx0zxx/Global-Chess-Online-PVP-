import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const run=(env={})=>spawnSync(process.execPath,['scripts/validate-live-ad-config.mjs'],{
  encoding:'utf8',env:{...process.env,...env}
});
const good={
 CHESS_ADMOB_ACCOUNT_APPROVAL:'approved',
 CHESS_AD_PRIVACY_POLICY_SIGNOFF:'approved',
 CHESS_AD_TARGET_AUDIENCE_SIGNOFF:'approved',
 CHESS_AD_PLAY_POLICY_SIGNOFF:'approved',
 CHESS_AD_PRIVACY_URL:'https://chess.example.org/privacy',
 CHESS_ADMOB_APP_ID:'ca-app-pub-1234567890123456~1234567890',
 CHESS_ADMOB_REWARDED_ID:'ca-app-pub-1234567890123456/1234567890',
 CHESS_M4_ADS_TEST:'false',
 VITE_CHESS_ADS_MODE:'live',
};
test('production ad build is denied by default without human/owner sign-offs',()=>{
 assert.notEqual(run({CHESS_M4_ADS_TEST:'false'}).status,0);
});
test('all five live owner inputs and each approval are independently mandatory',()=>{
 for(const key of ['CHESS_ADMOB_ACCOUNT_APPROVAL','CHESS_AD_PRIVACY_POLICY_SIGNOFF',
  'CHESS_AD_TARGET_AUDIENCE_SIGNOFF','CHESS_AD_PLAY_POLICY_SIGNOFF',
  'CHESS_AD_PRIVACY_URL','CHESS_ADMOB_APP_ID','CHESS_ADMOB_REWARDED_ID']){
  const env={...good};delete env[key];
  assert.notEqual(run(env).status,0,key);
 }
 assert.equal(run(good).status,0,run(good).stderr);
});
test('Google demo identifiers and demo flags are forbidden for real ad release',()=>{
 for(const replacement of [
  {CHESS_ADMOB_APP_ID:'ca-app-pub-3940256099942544~3347511713'},
  {CHESS_ADMOB_REWARDED_ID:'ca-app-pub-3940256099942544/5224354917'},
  {CHESS_M4_ADS_TEST:'true'},
  {CHESS_AD_PRIVACY_URL:'http://chess.example.org/privacy'},
 ]){
  assert.notEqual(run({...good,...replacement}).status,0,JSON.stringify(replacement));
 }
});
test('Android debug only installs native ads when explicitly requested',()=>{
 const script=readFileSync('scripts/build-android-debug.sh','utf8');
 assert.match(script,/CHESS_M4_ADS_TEST/);
 assert.match(script,/VITE_CHESS_ADS_MODE=disabled/);
 assert.match(script,/@capacitor-community\/admob@8\.2\.1/);
 const production=readFileSync('scripts/build-android-release.sh','utf8');
 assert.match(production,/validate-live-ad-config\.mjs/);
 assert.match(production,/CHESS_M4_ADS_TEST/);
 assert.match(production,/VITE_CHESS_ADS_MODE=disabled/);
});
