import { restoreGame } from './game.js';
import {progressKey,readProgress} from './progression.js';

export const matchKey='global-chess.match.v1';
export const historyKey='global-chess.history.v1';

// v2 adds a validated local-only exercise journal, NOT an online rating.
// Legacy v1 import is supported without erasing this device's current journal.
export function exportBackup(storage) {
  return JSON.stringify({
    version:2,
    match:storage.getItem(matchKey),
    history:JSON.parse(storage.getItem(historyKey)??'[]'),
    progress:readProgress(storage.getItem(progressKey)),
  },null,2);
}

export function previewBackup(raw) {
  if(typeof raw!=='string'||raw.length>2_000_000)throw new Error('Backup too large');
  const payload=JSON.parse(raw);
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Invalid backup');
  const {version,match,history}=payload;
  if(![1,2].includes(version)||!(match===null||typeof match==='string')||
     !Array.isArray(history)||history.length>50)throw new Error('Invalid backup');
  const restored=restoreGame(match);
  for(const entry of history) {
    if(!entry||typeof entry.outcome!=='string'||!entry.outcome.trim()||
       entry.outcome.length>100||typeof entry.snapshot!=='string')throw new Error('Invalid history entry');
    restoreGame(entry.snapshot);
  }
  let progress;
  if(version===2) {
    if(!payload.progress||typeof payload.progress!=='object'||Array.isArray(payload.progress))
      throw new Error('Missing or invalid progression journal');
    const journal=JSON.stringify(payload.progress);
    progress=JSON.stringify(readProgress(journal));
  }
  return {
    match,history,restored,progress,
    summary:{
      historyCount:history.length,
      activePly:restored.game.history().length,
      activeMode:restored.mode,
      hasActiveMatch:match!==null,
      ...(version===2?{exerciseEvents:JSON.parse(progress).events.length}:{}),
    },
  };
}

export function importBackup(storage,raw) {
  const {match,history,restored,progress}=previewBackup(raw);
  const keys=progress===undefined?[historyKey,matchKey]:[historyKey,matchKey,progressKey];
  const previous=new Map(keys.map(k=>[k,storage.getItem(k)]));
  try {
    storage.setItem(historyKey,JSON.stringify(history));
    if(match===null)storage.removeItem(matchKey);
    else storage.setItem(matchKey,match);
    if(progress!==undefined)storage.setItem(progressKey,progress);
  }catch(error) {
    for(const key of keys) {
      try{
        const original=previous.get(key);
        if(original===null)storage.removeItem(key);
        else storage.setItem(key,original);
      }catch{ /* Storage may no longer be writable. Do not report success. */ }
    }
    throw error;
  }
  return restored;
}

/** Only advertise an import as saved after the actual backing transaction. */
export async function importBackupDurably(storage,raw) {
  // Preflight the entire input before touching any live bytes.
  previewBackup(raw);
  if(storage.durable===false)throw new Error('Cannot confirm a durable backup import in this browser');
  const originals=new Map([matchKey,historyKey,progressKey].map(k=>[k,storage.getItem(k)]));
  try{
    const restored=importBackup(storage,raw);
    await storage.flush();
    if(storage.durable===false)throw new Error('Storage became volatile during import');
    return restored;
  }catch(error){
    for(const [key,previous] of originals){
      try{
        if(previous===null)storage.removeItem(key);
        else storage.setItem(key,previous);
      }catch{}
    }
    try{if(storage.durable!==false)await storage.flush();}catch{}
    throw new Error('Backup was not durably restored; existing bytes were preserved when possible',{cause:error});
  }
}
