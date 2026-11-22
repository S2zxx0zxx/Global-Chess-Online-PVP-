import test from 'node:test';
import assert from 'node:assert/strict';
import { asObjects, parseCSV, readSourceTracker, verifySourceTracker } from '../scripts/verify-source-tracker.mjs';

const original=readSourceTracker();

test('602 exact original source tasks map provisionally into 10 master batches without fabricated acceptance',()=>{
  const result=verifySourceTracker(original);
  assert.equal(result.tasks,602);
  assert.equal(result.originalV2,418);
  assert.equal(result.refinementsV3,184);
  assert.equal(result.phases,25);
  assert.equal(result.verifiedSourceTasks,0);
  assert.equal(Object.keys(result.counts).length,10);
});

test('23 source gates, 30 screens, 60 tests and 40 assets remain distinct pending acceptance',()=>{
  const result=verifySourceTracker(original);
  assert.deepEqual([result.sourceGates,result.sourceScreens,result.sourceTests,result.sourceAssets],[23,30,60,40]);
  assert.ok(original.testRows.some(x=>x.test_id==='RULE-001'));
  assert.ok(original.screenRows.some(x=>x.screen_id==='SCR-29'));
  assert.ok(original.gateRows.some(x=>x.gate_id==='G22-P3'));
});

test('CSV reader preserves quoted commas, multi-line cells and escaping',()=>{
  assert.deepEqual(parseCSV('name,description\nx,"quoted, value"\ny,"line 1\nline 2"\nz,"double ""quotes"""\n'),[
    ['name','description'],['x','quoted, value'],['y','line 1\nline 2'],['z','double "quotes"']]);
  assert.deepEqual(asObjects('id,desc\n1,"comma, here"\n'),[{id:'1',desc:'comma, here'}]);
});

test('duplicate original task IDs and phase mismatches fail closed',()=>{
  const duplicate=structuredClone(original); duplicate.taskRows[1].task_id=duplicate.taskRows[0].task_id;
  assert.throws(()=>verifySourceTracker(duplicate),/Duplicate ID/);
  const phase=structuredClone(original);phase.taskRows[0].phase_id='99';
  assert.throws(()=>verifySourceTracker(phase),/Phase\/ID mismatch/);
});

test('unverified source work cannot silently become accepted without SHA URL reviewer and date',()=>{
  const falseCompletion=structuredClone(original);
  falseCompletion.taskRows[0].acceptance_verification='VERIFIED';
  assert.throws(()=>verifySourceTracker(falseCompletion),/VERIFIED without exact SHA/);
  falseCompletion.taskRows[0].verified_commit_sha='a'.repeat(40);
  assert.throws(()=>verifySourceTracker(falseCompletion),/VERIFIED without evidence link/);
  falseCompletion.taskRows[0].verified_evidence_url='https://github.com/example/run';
  assert.throws(()=>verifySourceTracker(falseCompletion),/VERIFIED without reviewer/);
});

test('mapping changes must be versioned, never silently relabel original task or hide UNMAPPED',()=>{
  const bad=structuredClone(original);bad.taskRows[0].batch_candidate='GC-B99';
  assert.throws(()=>verifySourceTracker(bad),/invalid\/unmapped batch/);
  const changedSource=structuredClone(original);
  changedSource.taskRows[0].task_id='CH-00-999';
  assert.throws(()=>verifySourceTracker(changedSource),/Batch registry count disagreement|Origin registry count disagreement|original|Phase|Duplicate|Bad/);
});

test('missing gate, source screen or provenance attestation blocks promotion',()=>{
  const gates=structuredClone(original);gates.gateRows.pop();
  assert.throws(()=>verifySourceTracker(gates),/Wrong source registry rows/);
  const screen=structuredClone(original);screen.screenRows.pop();
  assert.throws(()=>verifySourceTracker(screen),/Wrong source registry rows/);
  const forged=structuredClone(original);forged.manifest.source_provenance.xlsx_sha256='0'.repeat(64);
  assert.throws(()=>verifySourceTracker(forged),/Original source SHA mismatch/);
});

test('T03 and batch NO-GO remain explicit while T08 is TODO',()=>{
  const lost=structuredClone(original);lost.ledgerText=lost.ledgerText.replaceAll('BLOCKED_EXTERNAL','RESOLVED');
  assert.throws(()=>verifySourceTracker(lost),/Unresolved T03 lost/);
  const t08=structuredClone(original);t08.ledgerText=t08.ledgerText.replace('GC-B01-T08\` | TODO','GC-B01-T08\` | DONE');
  // This text might occur twice in the history; target immutable ledger row directly.
  t08.ledgerText=t08.ledgerText.replaceAll('GC-B01-T08\` | TODO','GC-B01-T08\` | DONE');
  assert.throws(()=>verifySourceTracker(t08),/T08 started before T07 closed/);
});
