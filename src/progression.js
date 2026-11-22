// CH-01 v3 local, offline-only exercise completion journal.
// It is NOT a remotely verified rating or reward currency.
export const progressKey = 'global-chess.progress-events.v1';
export const legacyProgressKey = 'global-chess.learning.v1';
const kinds = new Set(['lesson','puzzle','daily']);
const idPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function readProgress(raw) {
  if (raw === null || raw === undefined) return {version:1,events:[]};
  const obj = JSON.parse(raw);
  if (!obj || obj.version !== 1 || !Array.isArray(obj.events) || obj.events.length > 4096) {
    throw new Error('Invalid local progression data');
  }
  const unique = new Set();
  for (const event of obj.events) {
    if (!event || !kinds.has(event.kind) || typeof event.exerciseId !== 'string' ||
        !idPattern.test(event.exerciseId) ||
        (event.kind === 'daily' && !/^daily-\d{4}-\d{2}-\d{2}$/.test(event.exerciseId)) ||
        (event.kind !== 'daily' && event.exerciseId.startsWith('daily-'))) {
      throw new Error('Invalid exercise journal event');
    }
    const eventId = event.kind + ':' + event.exerciseId;
    if (unique.has(eventId) || Object.keys(event).sort().join(',') !== 'exerciseId,kind') {
      throw new Error('Duplicate or unexpected exercise journal event');
    }
    unique.add(eventId);
  }
  return obj;
}

export function recordExercise(storage, {kind, exerciseId}) {
  if (!kinds.has(kind) || typeof exerciseId !== 'string' || !idPattern.test(exerciseId) ||
      (kind === 'daily' && !/^daily-\d{4}-\d{2}-\d{2}$/.test(exerciseId)) ||
      (kind !== 'daily' && exerciseId.startsWith('daily-'))) {
    throw new Error('Invalid exercise completion');
  }
  const state = readProgress(storage.getItem(progressKey));
  if (state.events.some(e => e.kind === kind && e.exerciseId === exerciseId)) return false;
  if (state.events.length >= 4096) throw new Error('Local progression history full; export your data');
  const updated = {version:1,events:[...state.events,{kind,exerciseId}]};
  storage.setItem(progressKey,JSON.stringify(updated));
  return true;
}

export function migrateLegacyProgress(storage,legacyRaw,lessons,puzzles) {
  if (legacyRaw === null) return 0;
  const items = JSON.parse(legacyRaw);
  if (!Array.isArray(items) || items.length > 4096) throw new Error('Invalid old exercise data');
  const lessonsById = new Set(lessons.map(x=>x.id));
  const puzzlesById = new Set(puzzles.map(x=>x.id));
  let added = 0;
  for(const id of new Set(items)) {
    if (typeof id !== 'string') continue;
    let kind;
    if (lessonsById.has(id)) kind='lesson';
    else if (puzzlesById.has(id)) kind='puzzle';
    else if (/^daily-\d{4}-\d{2}-\d{2}$/.test(id)) kind='daily';
    if (kind && recordExercise(storage,{kind,exerciseId:id})) added++;
  }
  return added;
}

export function progressSummary(state,lessons,puzzles) {
  const events=state.events;
  const completed=new Set(events.map(e=>e.exerciseId));
  const lessonsSolved=lessons.filter(x=>completed.has(x.id)).length;
  const puzzlesSolved=puzzles.filter(x=>completed.has(x.id)).length;
  const dailySolved=events.filter(e=>e.kind==='daily').length;
  // Match previous score semantics, but only from unique witnessed completions.
  const xp=10*(lessonsSolved+puzzlesSolved)+15*dailySolved;
  const achievements=[
    xp>0 && 'First solve',
    puzzlesSolved>=5 && 'Five tactics',
    lessonsSolved===lessons.length && 'Lesson explorer',
    puzzlesSolved===puzzles.length && 'Tactics starter',
    dailySolved>=3 && 'Daily regular',
  ].filter(Boolean);
  return {xp,lessonsSolved,puzzlesSolved,dailySolved,achievements,completed};
}

/**
 * Save a solved exercise exactly once, confirming IndexedDB transaction
 * completion before the UI claims persistent XP. On failure restore the
 * old in-memory journal and retry its prior bytes without erasing evidence.
 * This is local-only progress, not a tamper-resistant online rating.
 */
export async function recordExerciseCommitted(storage, event) {
  const original = storage.getItem(progressKey);
  const wasWritten = recordExercise(storage,event);
  if (!wasWritten) return {awarded:false,persisted:storage.durable !== false};
  if (storage.durable===false) return {awarded:true,persisted:false};
  try {
    await storage.flush();
    if (storage.durable===false) throw new Error('Durable storage became unavailable');
    return {awarded:true,persisted:true};
  } catch (error) {
    try {
      if (original===null)storage.removeItem(progressKey);
      else storage.setItem(progressKey,original);
      if(storage.durable!==false)await storage.flush();
    } catch { /* Fail closed: do not claim rollback was durably completed. */ }
    throw new Error('Progress could not be durably committed', {cause:error});
  }
}

export function currentProgressReport(storage, lessons, puzzles) {
  const state = readProgress(storage.getItem(progressKey));
  const summary=progressSummary(state, lessons, puzzles);
  return {
    ...summary,
    completed:[...summary.completed].filter(id=>lessons.some(x=>x.id===id)||puzzles.some(x=>x.id===id)),
    daily:state.events.filter(e=>e.kind==='daily').map(e=>e.exerciseId),
    persisted:storage.durable!==false,
    invalid:false,
  };
}
