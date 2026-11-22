/** Pure visual categorization. Chess adjudication always comes from the game engine.
 * Unknown finished outcomes display a neutral ornament, not a fabricated win.
 */
export function outcomeArtwork(outcome) {
  if (typeof outcome !== 'string' || !outcome.trim()) return null;
  const normalized=outcome.toLowerCase();
  if (/\b(draw|stalemate|insufficient|repetition|agreement|equal)\b/.test(normalized))
    return '/brand/royal-draw.svg';
  if (/\b(win|wins|won|victory|checkmate|resign|resignation|forfeit)\b/.test(normalized))
    return '/brand/royal-victory.svg';
  return '/brand/royal-versus.svg';
}
