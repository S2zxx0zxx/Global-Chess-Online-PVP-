import test from 'node:test';
import assert from 'node:assert/strict';
import { readRegressionSources, verifyRegressionSources } from '../scripts/check-regression-baseline.mjs';
const original=readRegressionSources();

test('T08 freezes 10 core/regression categories and exact T07 source baseline',()=>{
  const a=verifyRegressionSources(original);
  assert.equal(a.categories,10);
  assert.equal(a.requiredCoreSteps,14);
  assert.equal(a.productionApproval,'manual_only');
  assert.equal(a.playPublication,'NOT_APPROVED');
});

test('disabling source-tracker provenance validator blocks core build',()=>{
  const x=structuredClone({...original,availableFiles:[...original.availableFiles]});
  x.availableFiles=new Set(x.availableFiles);
  x.workflow=x.workflow.replace('node scripts/verify-source-tracker.mjs','echo skip-source-integrity');
  assert.throws(()=>verifyRegressionSources(x),/Core CI missing/);
});

test('dropping legal chess or persisted save coverage is rejected',()=>{
  const a=structuredClone({...original,availableFiles:[...original.availableFiles]});
  a.availableFiles=new Set(a.availableFiles);
  a.availableFiles.delete('tests/game.test.js');
  assert.throws(()=>verifyRegressionSources(a),/LEGAL_CHESS missing coverage/);
  const b=structuredClone({...original,availableFiles:[...original.availableFiles]});
  b.availableFiles=new Set(b.availableFiles);
  b.availableFiles.delete('tests/backup.test.js');
  assert.throws(()=>verifyRegressionSources(b),/SAVE_BACKUP_RECOVERY missing coverage/);
});

test('removing legal-move authoritative Workers smoke blocks release engineering',()=>{
  const a=structuredClone({...original,availableFiles:[...original.availableFiles]});
  a.availableFiles=new Set(a.availableFiles);
  a.workflow=a.workflow.replace('node scripts/smoke-local-rooms.mjs','echo skip-room-authorization');
  assert.throws(()=>verifyRegressionSources(a),/Core CI missing/);
});

test('runtime frontend can not drop PWA, original art or 3D bundle checks silently',()=>{
  for(const command of ['npm run build','node scripts/check-original-art.mjs','node scripts/check-bundle-budget.js']){
    const x=structuredClone({...original,availableFiles:[...original.availableFiles]});
    x.availableFiles=new Set(x.availableFiles);
    x.workflow=x.workflow.replace(command,'echo skipped');
    assert.throws(()=>verifyRegressionSources(x),/Core CI missing/);
  }
});

test('Android debug and disposable-key AAB retain cross-platform Node gates',()=>{
  const a=structuredClone({...original,availableFiles:[...original.availableFiles]});
  a.availableFiles=new Set(a.availableFiles);
  a.androidDebug=a.androidDebug.replace('npm test','echo skip-tests');
  assert.throws(()=>verifyRegressionSources(a),/Android debug missing/);
  const b=structuredClone({...original,availableFiles:[...original.availableFiles]});
  b.availableFiles=new Set(b.availableFiles);
  b.signing=b.signing.replace('node scripts/verify-source-tracker.mjs','echo bypass');
  assert.throws(()=>verifyRegressionSources(b),/Android signing missing/);
});

test('production signing cannot be automated or removed from approved environment',()=>{
  const a=structuredClone({...original,availableFiles:[...original.availableFiles]});
  a.availableFiles=new Set(a.availableFiles);
  a.androidProduction='  push:\n'+a.androidProduction;
  assert.throws(()=>verifyRegressionSources(a),/accidentally auto-triggered/);
  const b=structuredClone({...original,availableFiles:[...original.availableFiles]});
  b.availableFiles=new Set(b.availableFiles);
  b.androidProduction=b.androidProduction.replace('environment: android-production-approval','environment: default');
  assert.throws(()=>verifyRegressionSources(b),/Production manual\/signing gate/);
});

test('re-introducing unawaited bulk promotion synthetic input is caught',()=>{
  const x=structuredClone({...original,availableFiles:[...original.availableFiles]});
  x.availableFiles=new Set(x.availableFiles);
  x.browser=x.browser+"\nfor (const [from,to] of [['a2','a4']]) { /* unsafe bulk */ }\n";
  assert.throws(()=>verifyRegressionSources(x),/promotion timing race/);
});

test('unreviewed GO and removal of required regression scripts fail closed',()=>{
  const a=structuredClone({...original,availableFiles:[...original.availableFiles]});
  a.availableFiles=new Set(a.availableFiles);
  a.manifest.policy.release_go='GO';
  assert.throws(()=>verifyRegressionSources(a),/Release gate falsely promoted/);
  const b=structuredClone({...original,availableFiles:[...original.availableFiles]});
  b.availableFiles=new Set(b.availableFiles);
  b.availableFiles.delete('scripts/check-regression-baseline.mjs');
  assert.throws(()=>verifyRegressionSources(b),/Required gate missing/);
});
