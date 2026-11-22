import { restoreGame, savedMatchOutcome } from './game.js';

// Saved records are untrusted local input. Only legal, internally consistent
// completed games contribute to player stats; local two-player matches do not
// masquerade as personal wins or competitive Elo.
export function summarizeMatches(entries) {
  const stats = {completed:0,localGames:0,computerGames:0,wins:0,losses:0,draws:0,
    currentWinStreak:0,bestWinStreak:0,invalid:0,winRate:0};
  if (!Array.isArray(entries)) return {...stats,invalid:1};
  const computerResults = [];
  for (const entry of entries) {
    try {
      if (!entry || typeof entry.snapshot !== 'string' || typeof entry.outcome !== 'string')
        throw new Error('Bad record');
      const match = restoreGame(entry.snapshot);
      const verifiedOutcome = savedMatchOutcome(match);
      if (!verifiedOutcome || verifiedOutcome !== entry.outcome) throw new Error('Unverified result');
      stats.completed++;
      if (match.mode !== 'computer') {
        stats.localGames++;
        continue;
      }
      stats.computerGames++;
      let label;
      if (verifiedOutcome.startsWith('Draw')) {
        stats.draws++;
        label='draw';
      } else if (verifiedOutcome.startsWith(match.playerSide === 'b' ? 'Black wins' : 'White wins')) {
        stats.wins++;
        label='win';
      } else {
        stats.losses++;
        label='loss';
      }
      computerResults.push(label); // newest first (history records prepend)
    } catch {
      stats.invalid++;
    }
  }
  for (const result of computerResults) {
    if (result !== 'win') break;
    stats.currentWinStreak++;
  }
  let streak=0;
  for (const result of [...computerResults].reverse()) {
    streak = result === 'win' ? streak + 1 : 0;
    stats.bestWinStreak=Math.max(stats.bestWinStreak,streak);
  }
  stats.winRate = stats.computerGames ? Math.round(stats.wins * 100 / stats.computerGames) : 0;
  return stats;
}
