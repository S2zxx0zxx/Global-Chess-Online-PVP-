export const BOARD_THEMES = Object.freeze([
  {id:'maple', name:'Classic Maple', detail:'Warm original wood'},
  {id:'walnut', name:'Royal Walnut', detail:'Deep evening wood'},
  {id:'forest', name:'Forest Teal', detail:'Green and warm ivory'},
  {id:'ember', name:'Inferno Throne', detail:'Living embers and a molten crown'},
  {id:'mist', name:'Phantom Court', detail:'Silver smoke over midnight stone'},
  {id:'astral', name:'Astral Crown', detail:'Starlight and royal violet'},
  {id:'frost', name:'Glacier Palace', detail:'Ice blue with a breathing aurora'},
  {id:'emerald', name:'Emerald Sovereign', detail:'Jade light and enchanted gold'},
]);

export const PIECE_THEMES = Object.freeze([
  {id:'classic', name:'Classic', detail:'Traditional pieces with a matte finish'},
  {id:'crest', name:'Royal Crest', detail:'Original ivory and oxblood artwork'},
  {id:'ember', name:'Pyre Guard', detail:'Gold silhouettes with living flame'},
  {id:'mist', name:'Spectral Guard', detail:'Moon silver and rising smoke'},
  {id:'astral', name:'Starborn Guard', detail:'Violet metal and drifting starlight'},
  {id:'frost', name:'Frost Guard', detail:'Glacial blue and a cold halo'},
  {id:'emerald', name:'Jade Guard', detail:'Emerald metal and arcane light'},
]);

export const ANIMATED_THEMES = Object.freeze(['ember','mist','astral','frost','emerald']);
export const boardTheme = value => BOARD_THEMES.some(theme=>theme.id===value) ? value : 'maple';
export const pieceTheme = value => PIECE_THEMES.some(theme=>theme.id===value) ? value : 'classic';

export function applyBoardTheme(value) {
  document.documentElement.dataset.chTheme = boardTheme(value);
}

export function applyPieceTheme(value) {
  const selected = pieceTheme(value);
  document.documentElement.dataset.chPieces = selected;
  document.documentElement.classList.toggle('ch-animated-pieces',ANIMATED_THEMES.includes(selected));
}
