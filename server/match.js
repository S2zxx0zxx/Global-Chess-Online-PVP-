import { restoreGame, result, timeoutResult, claimableDraw, intendedDraw } from '../src/game.js';
import { presets } from '../src/clock.js';

export function createMatch(preset = 'quick') {
  const duration = presets[preset];
  if (!Number.isFinite(duration)) throw new Error('Unsupported online time control');
  return { version: 0, moves: [], clock: {w:duration,b:duration}, turnStartedAt:null, outcome:null };
}

export function startMatch(match, now) {
  if (match.turnStartedAt !== null || match.outcome) throw new Error('Match already started');
  return {...match, turnStartedAt: now, version: match.version + 1};
}

export function applyResign(match, seat, command, now) {
  const current = advanceClock(match, now);
  if (current.outcome) return {match:current, error:'Match ended'};
  if (current.turnStartedAt === null) return {match:current, error:'Waiting for opponent'};
  if (seat !== 'w' && seat !== 'b') return {match:current, error:'Invalid seat'};
  if (command?.expectedVersion !== current.version) return {match:current, error:'Position changed'};

  const running = current.moves.length % 2 ? 'b' : 'w';
  const elapsed = Math.max(0, now - current.turnStartedAt);
  return {match:{
    ...current,
    clock:{...current.clock, [running]:current.clock[running] - elapsed},
    outcome:seat === 'w' ? 'Black wins by resignation' : 'White wins by resignation',
    version:current.version + 1,
  }};
}

export function advanceClock(match, now) {
  if (match.turnStartedAt === null || match.outcome) return match;
  const side = match.moves.length % 2 ? 'b' : 'w';
  if (now - match.turnStartedAt < match.clock[side]) return match;
  return {
    ...match,
    clock: {...match.clock, [side]:0},
    outcome: timeoutResult(restoreGame(JSON.stringify({version:1,mode:'local',moves:match.moves})).game, side),
    version: match.version + 1,
  };
}

export function applyMove(match, seat, command, now) {
  const current = advanceClock(match, now);
  if (current.outcome) return {match:current, error:'Match ended'};
  if (current.turnStartedAt === null) return {match:current, error:'Waiting for opponent'};
  if (!command || command.expectedVersion !== current.version) {
    return {match:current, error:'Position changed'};
  }
  const {game} = restoreGame(JSON.stringify({version:1,mode:'local',moves:current.moves}));
  if (game.turn() !== seat) return {match:current, error:'Not your turn'};
  const {from,to,promotion} = command;
  if (typeof from !== 'string' || typeof to !== 'string' ||
      !/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to) ||
      (promotion !== undefined && !['q','r','b','n'].includes(promotion))) {
    return {match:current, error:'Invalid move'};
  }
  try {
    game.move({from,to,promotion});
  } catch {
    return {match:current, error:'Illegal move'};
  }
  const elapsed = Math.max(0, now - current.turnStartedAt);
  return {match:{
    ...current,
    moves:[...current.moves,{from,to,promotion}],
    clock:{...current.clock,[seat]:current.clock[seat]-elapsed},
    turnStartedAt:Math.max(now,current.turnStartedAt),
    outcome:result(game),
    version:current.version+1,
  }};
}


export function applyDrawClaim(match, seat, command, now) {
  const current = advanceClock(match, now);
  if (current.outcome) return {match:current, error:'Match ended'};
  if (current.turnStartedAt === null) return {match:current, error:'Waiting for opponent'};
  if (command?.expectedVersion !== current.version) return {match:current, error:'Position changed'};
  const {game} = restoreGame(JSON.stringify({version:1,mode:'local',moves:current.moves}));
  if (game.turn() !== seat) return {match:current, error:'Not your turn'};
  const reason = command.move === undefined ? claimableDraw(game) : intendedDraw(game, command.move);
  if (!reason) return {match:current, error:'This position does not qualify for a draw claim'};
  const elapsed = Math.max(0, now - current.turnStartedAt);
  return {match:{
    ...current,
    clock:{...current.clock,[seat]:current.clock[seat]-elapsed},
    outcome:'Draw by ' + reason,
    version:current.version+1,
  }};
}
