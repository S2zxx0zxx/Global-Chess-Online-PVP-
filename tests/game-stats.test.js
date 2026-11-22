import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreGame, serializeGame, savedMatchOutcome } from '../src/game.js';
import { summarizeMatches } from '../src/game-stats.js';

function resigned(mode,playerSide,resignedBy) {
  const {game}=restoreGame();
  game.move('e4');
  const snapshot=serializeGame(game,mode,undefined,null,'easy',undefined,'untimed',playerSide,resignedBy);
  return {snapshot,outcome:savedMatchOutcome(restoreGame(snapshot))};
}

test('true offline bot statistics count wins from the actual human side', () => {
  const humanBlackWin=resigned('computer','b','w');
  const humanWhiteLoss=resigned('computer','w','w');
  const humanWhiteWin=resigned('computer','w','b');
  const localFriend=resigned('local','w','w');
  const stats=summarizeMatches([
    humanBlackWin,humanWhiteLoss,localFriend,humanWhiteWin,
  ]);
  assert.equal(stats.completed,4);
  assert.equal(stats.localGames,1);
  assert.equal(stats.computerGames,3);
  assert.equal(stats.wins,2);
  assert.equal(stats.losses,1);
  assert.equal(stats.draws,0);
  assert.equal(stats.currentWinStreak,1);
  assert.equal(stats.bestWinStreak,1);
  assert.equal(stats.winRate,67);
});

test('tampered outcomes and invalid saves never enter the player score', () => {
  const won=resigned('computer','w','b');
  const bad={...won,outcome:'Black wins by checkmate'};
  const stats=summarizeMatches([bad,{outcome:'Draw',snapshot:'bad'},won]);
  assert.equal(stats.completed,1);
  assert.equal(stats.wins,1);
  assert.equal(stats.invalid,2);
});
