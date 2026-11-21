export function renderPieceArt(cell, piece, names) {
  if (!piece) return;
  const image = document.createElement('img');
  const side = piece.color === 'w' ? 'white' : 'black';
  let crest = false;
  try { crest = localStorage.getItem('global-chess.pieces.v1') === 'crest'; }
  catch { /* Storage-disabled guests can still see classic pieces. */ }
  image.src = crest
    ? new URL('./brand/pieces/piece_' + side + '_' + names[piece.type].toLowerCase() + '.svg', document.baseURI).href
    : new URL('./chess-assets/pieces/' + side + '-' + names[piece.type].toLowerCase() + '.webp', document.baseURI).href;
  image.className = 'piece-art';
  image.alt = '';
  image.draggable = false;
  cell.append(image);
}
