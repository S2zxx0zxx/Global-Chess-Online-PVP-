// GC-B01-T08 permanent regression-gate guard. Source-level contract, not physical
// Android QA or proof of a deployed commercial game. No extra dependencies.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const MANIFEST='docs/execution/GC-B01-T08_REGRESSION_BASELINE.v1.json';
const requireOk=(ok,reason)=>{if(!ok)throw Error('[GC-B01-T08] '+reason);};

export function readRegressionSources(root=ROOT){
  const read=path=>readFileSync(join(root,path),'utf8');
  const manifest=JSON.parse(read(MANIFEST));
  const source={manifest,packageJson:read('package.json'),ledger:read('docs/execution/GC_EXECUTION_LEDGER.md'),
    workflow:read('.github/workflows/verify.yml'),
    androidDebug:read('.github/workflows/android-debug.yml'),
    signing:read('.github/workflows/android-signing-smoke.yml'),
    androidProduction:read('.github/workflows/android-production-release.yml'),
    browser:read('scripts/smoke-browser.mjs'),availableFiles:new Set()};
  for(const p of [...manifest.mandatory_workflow_files,...manifest.mandatory_script_files,
    ...Object.values(manifest.coverage).flatMap(x=>x.required_tests)]){
    if(existsSync(join(root,p)))source.availableFiles.add(p);
  }
  return source;
}

export function verifyRegressionSources(src){
  const {manifest:m}=src;
  const includes=(text,needle,label)=>requireOk(text.includes(needle),label+' missing: '+needle);
  requireOk(m.id==='GC-B01-T08-REGRESSION-FREEZE-v1.0','Unexpected baseline manifest');
  requireOk(m.baseline.canonical_at_start==='3389c3f3cb3b7bd3235a47e80817cb0d44591574','Wrong T07 merged source baseline');
  requireOk(m.baseline.prior_ci_attempt_1==='FAILED_INTERMITTENT_CHROMIUM_STATE_WAIT','Prior browser CI flake missing');
  requireOk(m.baseline.prior_ci_attempt_2==='SUCCESS_125_OF_125','Prior exact-head successful retry missing');
  requireOk(Object.keys(m.coverage).length===10,'Must retain ten scoped regression categories');
  for(const [category,info] of Object.entries(m.coverage)){
    requireOk(info.required_tests.length>0,category+' has no tests');
    for(const p of info.required_tests)requireOk(src.availableFiles.has(p),category+' missing coverage file '+p);
  }
  for(const f of [...m.mandatory_workflow_files,...m.mandatory_script_files]){
    requireOk(src.availableFiles.has(f),'Required gate missing: '+f);
  }
  const pkg=JSON.parse(src.packageJson);
  requireOk(pkg.type==='module'&&pkg.scripts?.test==='node --test'&&pkg.scripts?.build==='vite build','ESM/test/build contract altered');
  requireOk(pkg.scripts?.['check:architecture']==='node scripts/check-architecture-contract.mjs','Architecture check removed');
  requireOk(pkg.scripts?.['check:regressions']==='node scripts/check-regression-baseline.mjs','Regression check command missing');
  const core=src.workflow;
  for(const step of m.required_core_CI_steps)includes(core,'- name: '+step,'Core CI');
  for(const cmd of ['npm ci --no-audit --no-fund','npm run check:architecture',
    'node scripts/verify-source-tracker.mjs','npm run check:regressions','npm test',
    'npm run build','node scripts/check-original-art.mjs','node scripts/validate-learning-pack.mjs',
    'node scripts/check-bundle-budget.js','node scripts/smoke-browser.mjs',
    'node scripts/prepare-worker-solver.js','node scripts/smoke-local-rooms.mjs']){
    includes(core,cmd,'Core CI');
  }
  includes(core,"contents: read",'Core least-privilege permissions');
  includes(core,'integration/global-chess-v3','Canonical PR/push triggers');
  includes(core,'if: always()','Browser artifact retention on failure');

  for(const [name,workflow,build] of [
    ['Android debug',src.androidDebug,'bash scripts/build-android-debug.sh'],
    ['Android signing',src.signing,'bash scripts/build-android-release.sh']]){
    for(const snippet of ['npm ci --no-audit --no-fund','npm test',
      'node scripts/verify-source-tracker.mjs','npm run check:regressions',
      'npm run check:architecture',"platforms;android-36",build]){
      includes(workflow,snippet,name);
    }
    includes(workflow,'contents: read',name+' permission');
  }
  includes(src.androidDebug,'app-debug.apk','Android debug output');
  for(const val of ['ephemeral.jks','ci-test-signed-aab-NOT-FOR-PLAY','keytool -genkeypair']){
    includes(src.signing,val,'Disposable-signing proof');
  }
  const prod=src.androidProduction;
  for(const value of ['workflow_dispatch:','environment: android-production-approval',
    'GAME_UPLOAD_KEYSTORE_B64','GAME_UPLOAD_STORE_PASSWORD','GAME_UPLOAD_KEY_ALIAS',
    'GAME_UPLOAD_KEY_PASSWORD','Fail before build if any required signing secret is absent']){
    includes(prod,value,'Production manual/signing gate');
  }
  requireOk(!/^\s{2}(push|pull_request):/m.test(prod),'Production Android build accidentally auto-triggered');
  requireOk(!src.browser.includes("for (const [from,to] of [['a2','a4']"),
    'Browser promotion timing race (bulk unawaited move clicks) reintroduced');
  includes(src.browser,'committed promotion setup move','Browser promotion click acknowledged per move');
  includes(src.browser,"stage = 'browser state'",'Labeled timeout diagnostics');
  requireOk(m.policy.original_main_branch_protection==='T03_BLOCKED_EXTERNAL'&&m.policy.batch01_gate==='NOT_ELIGIBLE',
    'T03/B01 no-GO exception disappeared');
  includes(src.ledger,'GC-B01-T03','T03 task ledger link');
  includes(src.ledger,'BLOCKED_EXTERNAL','T03 unresolved source note');
  includes(src.ledger,'GC-B01-GATE','Batch gate ledger link');
  requireOk(m.verification_required.canonical_exact_head_core_success,'Postmerge CI gate removed');
  requireOk(m.policy.release_go==='NO_GO','Release gate falsely promoted');
  return {categories:Object.keys(m.coverage).length,requiredCoreSteps:m.required_core_CI_steps.length,
    nodeTestModules:new Set(Object.values(m.coverage).flatMap(x=>x.required_tests)).size,
    androidBuilds:['debug','ephemeral-signing'],productionApproval:'manual_only',
    knownBrowserFlake:'tracked_and_guarded',playPublication:'NOT_APPROVED'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log('[GC-B01-T08] Regression gates PASS',JSON.stringify(verifyRegressionSources(readRegressionSources())));}
  catch(error){console.error(error);process.exitCode=1;}
}
