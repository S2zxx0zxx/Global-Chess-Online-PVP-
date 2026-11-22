function disposableEffect(className, square) {
  const effect = document.createElement('span');
  effect.className = className;
  effect.setAttribute('aria-hidden', 'true');
  square.append(effect);
  effect.addEventListener('animationend', event => {
    if (event.target === effect && !event.pseudoElement) effect.remove();
  });
  return effect;
}

// Snapshot the captured art before the board rebuilds. En passant removes
// the pawn from its own square, while impact still happens at the landing.
export function prepareMoveEffect(board, move) {
  if (!board.getClientRects().length || typeof Element.prototype.animate !== 'function' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('ch-reduce-motion')) return;

  const square = name => board.querySelector(`[data-square="${name}"]`);
  const captureSquare = move.isEnPassant?.() ? move.to[0] + move.from[1] : move.to;
  const victim = move.captured
    ? square(captureSquare)?.querySelector('.piece-art')?.cloneNode()
    : null;
  const duration = move.captured ? 245 : 215;

  function slide(from, to) {
    const start = square(from)?.getBoundingClientRect();
    const destination = square(to);
    const art = destination?.querySelector('.piece-art');
    if (!start || !art) return;
    const end = destination.getBoundingClientRect();
    const dx = start.left - end.left;
    const dy = start.top - end.top;
    destination.classList.add('ch-piece-sliding');
    const animation = art.animate([
      { transform: `translate(${dx}px,${dy}px) scale(1.03)` },
      { transform: `translate(${dx * .28}px,${dy * .28 - end.height * .08}px) scale(1.12)`, offset: .62 },
      { transform: 'translateY(2px) scale(1.09,.94)', offset: .87 },
      { transform: 'none' },
    ], { duration, easing: 'cubic-bezier(.2,.68,.35,1)' });
    animation.onfinish = () => destination.classList.remove('ch-piece-sliding');
  }

  return () => {
    const destination = square(move.to);
    if (!destination) return;
    const impactDelay = Math.round(duration * .76);
    if (victim) {
      const victimTile = square(captureSquare);
      if (victimTile) {
        const fade = disposableEffect('ch-captured-echo', victimTile);
        fade.style.setProperty('--impact-delay', `${impactDelay}ms`);
        fade.append(victim);
      }
    }
    slide(move.from, move.to);
    const rank = move.to[1];
    if (move.isKingsideCastle?.()) slide('h' + rank, 'f' + rank);
    if (move.isQueensideCastle?.()) slide('a' + rank, 'd' + rank);
    const impact = disposableEffect(move.captured ? 'ch-capture-impact' : 'ch-landing-glow', destination);
    impact.style.setProperty('--impact-delay', `${impactDelay}ms`);
    if (!move.captured) return;
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('i');
      spark.style.setProperty('--spark-angle', `${i * 45 + 12}deg`);
      spark.style.setProperty('--spark-tip', i % 2 ? '4%' : '16%');
      impact.append(spark);
    }
  };
}
