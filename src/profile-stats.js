import {restoreGame} from './game.js';

// Counts only completed saved matches, never inferred online Elo or currency.
// The current local history store keeps at most 50 entries.
export function summarizeLocalHistory(entries) {
  if (!Array.isArray(entries)) throw new Error('Invalid history');
  const summary = {
    saved:entries.length, computer:0, wins:0, losses:0, draws:0,
    currentWinStreak:0, bestWinStreak:0, winRate:0, skipped:0,
  };
  // History is newest-first; iterate chronologically for streak calculation.
  for (const entry of [...entries].reverse()) {
    try {
      if (!entry || typeof entry.snapshot !== 'string' || typeof entry.outcome !== 'string') {
        throw new Error('Invalid history entry');
      }
      const saved = restoreGame(entry.snapshot);
      if (saved.mode !== 'computer') continue; // No player identity for local pass-and-play.
      const winningSide = entry.outcome.startsWith('White wins') ? 'w'
        : entry.outcome.startsWith('Black wins') ? 'b' : null;
      const draw = entry.outcome.startsWith('Draw');
      if (!winningSide && !draw) {summary.skipped++;continue;}
      summary.computer++;
      if (draw) {summary.draws++;summary.currentWinStreak=0;}
      else if (winningSide === saved.humanSide) {
        summary.wins++;
        summary.currentWinStreak++;
        summary.bestWinStreak = Math.max(summary.bestWinStreak,summary.currentWinStreak);
      } else {summary.losses++;summary.currentWinStreak=0;}
    } catch {summary.skipped++;}
  }
  summary.winRate = summary.computer ? Math.round(100*summary.wins/summary.computer) : 0;
  return summary;
}
