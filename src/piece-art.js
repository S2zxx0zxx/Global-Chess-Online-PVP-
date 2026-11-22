import {ANIMATED_THEMES,pieceTheme} from './appearance.js';

export function renderPieceArt(cell, piece, names) {
  if (!piece) return;
  const image = document.createElement('img');
  const side = piece.color === 'w' ? 'white' : 'black';
  let selected = document.documentElement.dataset.chPieces;
  try {
    if (!selected) selected = JSON.parse(localStorage.getItem('global-chess.pieces.v1'));
  }
  catch { /* Storage-disabled guests can still see classic pieces. */ }
  const style = pieceTheme(selected);
  cell.classList.add('has-piece','piece-'+side,'piece-'+piece.type);
  if (ANIMATED_THEMES.includes(style)) {
    const aura = document.createElement('span');
    aura.className = 'ch-piece-aura';
    aura.setAttribute('aria-hidden','true');
    cell.append(aura);
  }
  image.src = new URL('./brand/pieces/piece_' + side + '_' + names[piece.type].toLowerCase() + '.svg', document.baseURI).href;
  image.className = 'piece-art' + (style === 'crest' ? ' ch-piece-crest' : style === 'classic' ? ' ch-piece-classic' : '');
  image.alt = '';
  image.draggable = false;
  cell.append(image);
}
