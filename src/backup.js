import { restoreGame } from './game.js';

export const matchKey = 'global-chess.match.v1';
export const historyKey = 'global-chess.history.v1';

export function exportBackup(storage) {
  return JSON.stringify({
    version: 1,
    match: storage.getItem(matchKey),
    history: JSON.parse(storage.getItem(historyKey) ?? '[]'),
  }, null, 2);
}

export function importBackup(storage, raw) {
  if (raw.length > 2_000_000) throw new Error('Backup too large');
  const {version, match, history} = JSON.parse(raw);
  if (version !== 1 || !(match === null || typeof match === 'string') ||
      !Array.isArray(history) || history.length > 50) throw new Error('Invalid backup');
  const restored = restoreGame(match);
  for (const entry of history) {
    if (!entry || typeof entry.outcome !== 'string' || entry.outcome.length > 100 ||
        typeof entry.snapshot !== 'string') throw new Error('Invalid history entry');
    restoreGame(entry.snapshot);
  }
  const oldHistory = storage.getItem(historyKey);
  storage.setItem(historyKey, JSON.stringify(history));
  try {
    if (match === null) storage.removeItem(matchKey);
    else storage.setItem(matchKey, match);
  } catch (error) {
    if (oldHistory === null) storage.removeItem(historyKey);
    else storage.setItem(historyKey, oldHistory);
    throw error;
  }
  return restored;
}
