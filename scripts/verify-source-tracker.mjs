// GC-B01-T07: strict, dependency-free provenance and acceptance ledger guard.
// Current source row status is historical, not proof of present implementation.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const DIR='docs/execution/';
export const FILES=Object.freeze({
  tasks:DIR+'GC_B01_T07_602_TASK_SOURCE_BATCH_MAP.csv',
  gates:DIR+'GC_B01_T07_23_SOURCE_RELEASE_GATES.csv',
  screens:DIR+'GC_B01_T07_30_SOURCE_SCREENS.csv',
  tests:DIR+'GC_B01_T07_60_SOURCE_TEST_CASES.csv',
  assets:DIR+'GC_B01_T07_40_SOURCE_ASSETS.csv',
  manifest:DIR+'GC_B01_T07_602_TASK_SOURCE_MANIFEST.json',
  ledger:DIR+'GC_EXECUTION_LEDGER.md',
});

export function parseCSV(source){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(quoted){if(c==='"'&&source[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}
    else if(c==='"')quoted=true;
    else if(c===','){row.push(cell);cell='';}
    else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw Error('Unterminated quoted CSV field');
  if(cell||row.length){row.push(cell);rows.push(row)}
  return rows;
}
export function asObjects(text){
  const [head,...rows]=parseCSV(text);if(!head)throw Error('CSV header missing');
  if(new Set(head).size!==head.length)throw Error('Duplicate CSV header');
  return rows.map((cells,i)=>{
    if(cells.length!==head.length)throw Error('CSV row '+(i+2)+' has '+cells.length+' cells not '+head.length);
    return Object.fromEntries(head.map((name,j)=>[name,cells[j]]));
  });
}
function check(condition, message){if(!condition)throw Error('[GC-B01-T07] '+message)}
export function verifySourceTracker({manifest,taskRows,gateRows,screenRows,testRows,assetRows,ledgerText}){
  const ids=new Set(),batches=new Set(Array.from({length:10},(_,i)=>'GC-B'+String(i+1).padStart(2,'0')));
  const origins={},methods={},counts={},phases=new Set();let independentlyVerified=0;
  check(manifest.registry_version==='GC-B01-T07-SOURCE-INVENTORY-v1.0','Manifest version changed');
  check(manifest.source_provenance.original_zip_internal_and_standalone_xlsx_byte_identical===true,'Original source attestation missing');
  check(manifest.source_provenance.xlsx_sha256==='df4a520e4d72e6592d96ac3960ac00e90b5d459ddc5288e056f63662a0ffbcd8','Original source SHA mismatch');
  check(taskRows.length===602,'Expected 602 original task records');
  for(const [i,r] of taskRows.entries()){
    check(/^CH-\d{2}-\d{3}$/.test(r.task_id),'Bad task ID at row '+i);
    check(!ids.has(r.task_id),'Duplicate ID '+r.task_id);ids.add(r.task_id);
    check(r.phase_id===r.task_id.slice(3,5),'Phase/ID mismatch '+r.task_id);
    check(r.source_row_number===String(i+1),'Unexpected original row ordering '+r.task_id);
    check(['P0','P1','P2','P3'].includes(r.priority),'Invalid priority '+r.task_id);
    check(r.task.trim()&&r.acceptance_evidence.trim(),'Missing original source contract '+r.task_id);
    check(r.status==='NOT_STARTED','Original historical status modified '+r.task_id);
    check(['V2_UPLOADED_PRESERVED','V3_REFERENCE_REFINEMENT'].includes(r.origin),'Unexpected provenance '+r.task_id);
    check(batches.has(r.batch_candidate),'Source task has invalid/unmapped batch '+r.task_id);
    check(r.batch_assignment_status==='PROVISIONAL_BATCH_CANDIDATE','Batch assignment falsely approved '+r.task_id);
    check(r.master_atomic_task_id==='UNASSIGNED_ATOMIC_TASK','Atomic task was guessed without a reviewed mapping '+r.task_id);
    check(['SOURCE_PHASE_CROSSWALK','ASSET_WORKSTREAM','SCREEN_CONTRACT_WORKSTREAM'].includes(r.mapping_method),'Missing rule for '+r.task_id);
    check(['NOT_VERIFIED','VERIFIED'].includes(r.acceptance_verification),'Invalid acceptance state '+r.task_id);
    if(r.acceptance_verification==='VERIFIED'){
      independentlyVerified++;
      check(/^[0-9a-f]{40}$/.test(r.verified_commit_sha),'VERIFIED without exact SHA '+r.task_id);
      check(/^https:\/\//.test(r.verified_evidence_url),'VERIFIED without evidence link '+r.task_id);
      check(Boolean(r.verified_reviewer&&r.verified_at_utc),'VERIFIED without reviewer/date '+r.task_id);
    }
    origins[r.origin]=(origins[r.origin]||0)+1;
    methods[r.mapping_method]=(methods[r.mapping_method]||0)+1;
    counts[r.batch_candidate]=(counts[r.batch_candidate]||0)+1;
    phases.add(r.phase_id);
  }
  const digest=text=>createHash('sha256').update(text,'utf8').digest('hex');
  const idsFingerprint=digest(taskRows.map(r=>r.task_id).join('\n'));
  const textFingerprint=digest(taskRows.map(r=>[r.task_id,r.task,r.acceptance_evidence].join('\t')).join('\n'));
  check(idsFingerprint===manifest.source_provenance.original_task_id_sha256,
    'Original source task IDs fingerprint mismatch');
  check(textFingerprint===manifest.source_provenance.original_task_text_acceptance_sha256,
    'Original source task/acceptance fingerprint mismatch');
  const expect=(actual,want,label)=>check(JSON.stringify(Object.fromEntries(Object.entries(actual).sort()))===
    JSON.stringify(Object.fromEntries(Object.entries(want).sort())),label+' registry count disagreement');
  expect(origins,{V2_UPLOADED_PRESERVED:418,V3_REFERENCE_REFINEMENT:184},'Origin');
  expect(counts,manifest.candidate_batch_counts,'Batch');
  expect(methods,manifest.mapping_method_counts,'Mapping method');
  check(phases.size===25 && [...phases].every(x=>x in manifest.source_phase_to_batch_candidate),'Missing source phase');
  check(independentlyVerified===manifest.original_source_counts.current_row_level_verified_acceptance,
    'Verified rows require signed manifest/evidence update');
  const registryChecks=[
    [gateRows,'gate_id',23], [screenRows,'screen_id',30],[testRows,'test_id',60],[assetRows,'filename',40],
  ];
  for(const [arr,key,size] of registryChecks){
    check(arr.length===size,'Wrong source registry rows for '+key);
    check(new Set(arr.map(x=>x[key])).size===size,'Duplicate '+key);
    check(arr.every(x=>x.verification_state==='NOT_VERIFIED'),'Source registry falsely accepted '+key);
    check(arr.every(x=>x.release_gate_signoff==='NOT_APPROVED'),'Source registry falsely approved '+key);
  }
  check(manifest.covered_gate_ids.every(id=>gateRows.some(x=>x.gate_id===id)), 'Missing original G0–G22 gates');
  check(manifest.covered_screen_ids.every(id=>screenRows.some(x=>x.screen_id===id)), 'Missing SCR-00–29');
  check(gateRows.every(x=>x.status==='NOT_STARTED'),'Source gate historical status altered');
  check(screenRows.every(x=>x.status==='NOT_STARTED'),'Source screen historical status altered');
  check(testRows.every(x=>x.status==='NOT_RUN'),'Source test historical status altered');
  check(assetRows.every(x=>x.status==='NOT_CREATED'),'Source asset historical status altered');
  const rowStatus=id=>{
    const match=ledgerText.match(new RegExp('^\\|\\s*`'+id+'`\\s*\\|\\s*([^|]+)\\|','m'));
    return match?.[1]?.trim() ?? null;
  };
  const t03=rowStatus('GC-B01-T03'),t07=rowStatus('GC-B01-T07'),t08=rowStatus('GC-B01-T08'),gate=rowStatus('GC-B01-GATE');
  check(t03!==null&&t07!==null&&t08!==null&&gate!==null,'Required T03/T07/T08/B01 gate ledger row missing');
  if(!t03.startsWith('DONE'))check(!gate.startsWith('BATCH_GO'),'Cannot mark B01 GO when T03 remains unresolved');
  if(!t08.startsWith('TODO'))check(t07.startsWith('DONE'),'T08 progression cannot predate T07 evidence closure');
  if(gate.startsWith('BATCH_GO')){
    check(t03.startsWith('DONE')&&t07.startsWith('DONE')&&t08.startsWith('DONE'),'B01 GO requires T03, T07 and T08 closed');
    check(ledgerText.includes('BATCH_GO_APPROVED')&&ledgerText.includes('reviewer'),'B01 GO needs explicit reviewer signoff');
  }
  return {tasks:taskRows.length,phases:phases.size,sourceGates:gateRows.length,
    sourceScreens:screenRows.length,sourceTests:testRows.length,sourceAssets:assetRows.length,
    originalV2:origins.V2_UPLOADED_PRESERVED,refinementsV3:origins.V3_REFERENCE_REFINEMENT,
    provisionalBatchLinks:taskRows.length,verifiedSourceTasks:independentlyVerified,counts};
}
export function readSourceTracker(root=ROOT){
  const text=k=>readFileSync(resolve(root,FILES[k]),'utf8');
  return {
    manifest:JSON.parse(text('manifest')),taskRows:asObjects(text('tasks')),
    gateRows:asObjects(text('gates')),screenRows:asObjects(text('screens')),
    testRows:asObjects(text('tests')),assetRows:asObjects(text('assets')),
    ledgerText:text('ledger'),
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const result=verifySourceTracker(readSourceTracker()); console.log('[GC-B01-T07] PASS',JSON.stringify(result));}
  catch(e){console.error(e);process.exitCode=1;}
}
