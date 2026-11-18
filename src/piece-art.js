export function renderPieceArt(cell, piece, names) {
  if (!piece) return;
  const image = document.createElement('img');
  const side = piece.color === 'w' ? 'white' : 'black';
  image.src = new URL(`./chess-assets/pieces/${side}-${names[piece.type].toLowerCase()}.webp`, document.baseURI).href;
  image.className = 'piece-art';
  image.alt = '';
  image.draggable = false;
  cell.append(image);
}
