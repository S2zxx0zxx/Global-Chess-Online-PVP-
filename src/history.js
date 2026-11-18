const key = 'global-chess.history.v1';

export function readHistory(storage) {
  const entries = JSON.parse(storage.getItem(key) ?? '[]');
  if (!Array.isArray(entries)) throw new Error('Invalid match history');
  return entries;
}

export function recordMatch(storage, outcome, snapshot) {
  const entries = readHistory(storage);
  if (entries[0]?.snapshot === snapshot && entries[0]?.outcome === outcome) return;
  storage.setItem(key, JSON.stringify([{outcome, snapshot}, ...entries].slice(0, 50)));
}
