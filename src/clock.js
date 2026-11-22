export const presets = Object.freeze({ untimed: null, quick: 300_000, classic: 900_000 });

export function startClock(preset) {
  const duration = presets[preset];
  return Number.isFinite(duration) ? { w: duration, b: duration } : null;
}

export function remainingClock(clock, side, elapsed) {
  return { ...clock, [side]: Math.max(0, clock[side] - Math.max(0, elapsed)) };
}

export function validClock(clock) {
  return clock === null || (clock && ['w', 'b'].every(side =>
    Number.isFinite(clock[side]) && clock[side] >= 0 && clock[side] <= presets.classic));
}
