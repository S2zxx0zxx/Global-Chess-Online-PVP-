export function renderPieceArt(cell, piece, names) {
  if (!piece) return;
  const image = document.createElement('img');
  const side = piece.color === 'w' ? 'white' : 'black';
  let crest = false;
  try {
    const selected = localStorage.getItem('global-chess.pieces.v1');
    crest = selected === 'crest' || selected === '"crest"';
  }
  catch { /* Storage-disabled guests can still see classic pieces. */ }
  // Both finishes use assets authored inside this repository. Earlier WebP
  // pieces have not cleared commercial provenance; never load them at runtime.
  image.src = new URL('./brand/pieces/piece_' + side + '_' + names[piece.type].toLowerCase() + '.svg', document.baseURI).href;
  image.className = 'piece-art ' + (crest ? 'ch-piece-crest' : 'ch-piece-classic');
  image.alt = '';
  image.draggable = false;
  cell.append(image);
}
