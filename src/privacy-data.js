import {matchKey,historyKey} from './backup.js';
import {progressKey,legacyProgressKey} from './progression.js';

export const preferencesKey='global-chess.preferences.v1';
export const tutorialKey='global-chess.first-move-coach.v1';
export const privateSeatKey='global-chess.online-seat.v1';

export function exportLocalUserData(storage,local) {
  const optional = key => {
    try{return local.getItem(key);}catch{return null;}
  };
  return JSON.stringify({
    format:'global-chess-local-archive-v1',
    createdAt:new Date().toISOString(),
    note:'Local archive only. This file is not the Import Match Backup format. Never upload it publicly.',
    // The private multiplayer seat credential is deliberately not exported.
    savedMatch:storage.getItem(matchKey),
    savedHistory:storage.getItem(historyKey),
    learningJournal:storage.getItem(progressKey),
    guestPreferences:optional(preferencesKey),
    oldLearningProgress:optional(legacyProgressKey),
    tutorialState:optional(tutorialKey),
  },null,2);
}

export async function deleteLocalUserData(storage,local) {
  // Deletion must be explicit from the UI, not automatic on update or logout.
  for(const key of [matchKey,historyKey,progressKey]) storage.removeItem(key);
  await storage.flush?.(); // Wait for IndexedDB commit before navigating/reloading.
  for(const key of [preferencesKey,legacyProgressKey,tutorialKey,privateSeatKey]) {
    local.removeItem(key);
  }
}
