/**
 * Original arcade-screen composition for Global Chess.
 * DOM layout only: game legality, clocks, persistence and online authority
 * remain in their existing domain controllers. No imported third-party assets.
 */
const make=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
};
const img=(src,cls='')=>{
  const el=make('img',cls);
  el.src=src;el.alt='';el.loading='lazy';el.decoding='async';return el;
};
const linkButton=(label,cls,onClick)=>{
  const button=make('button',cls,label);
  button.type='button';button.addEventListener('click',onClick);return button;
};
const chessRank=['r','n','b','q','k','b','n','r'];
const PIECES=Object.freeze({k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'});
export function previewCells(){
  return Array.from({length:64},(_,i)=>{
    const row=Math.floor(i/8),col=i%8;
    const side=row<2?'black':row>5?'white':null;
    const piece= row===0||row===7?chessRank[col]:row===1||row===6?'p':null;
    return Object.freeze({row,col,side,piece:side&&piece?PIECES[piece]:null,light:(row+col)%2===0});
  });
}
export function safeMatchLabel(summary){
  if(!summary||typeof summary!=='object')return 'CHESS ARENA';
  if(summary.online)return 'PRIVATE ONLINE ARENA';
  return summary.mode==='computer'?'VS COMPUTER':summary.mode==='local'?'LOCAL TWO-PLAYER':'CHESS ARENA';
}
function createBoardPreview(){
  const frame=make('div','gc-preview-frame');
  frame.setAttribute('aria-hidden','true');
  const corner=make('div','gc-preview-corners');
  const board=make('div','gc-preview-board');
  for(const cell of previewCells()){
    const square=make('div','gc-preview-square '+(cell.light?'light':'dark'));
    if(cell.piece){
      const piece=img('/brand/pieces/piece_'+cell.side+'_'+cell.piece+'.svg','gc-preview-piece');
      piece.loading='eager';
      square.append(piece);
    }
    board.append(square);
  }
  frame.append(corner,board);
  const plate=make('div','gc-preview-plate');
  plate.append(make('span','', 'THE ROYAL BOARD'),make('span','','64 SQUARES • ENDLESS STRATEGY'));
  frame.append(plate);
  return frame;
}
function textPair(label,description,klass){
  const card=make('div',klass);
  card.append(make('span','gc-card-eyebrow',label),make('strong','',description));
  return card;
}
function addIcon(button,art){
  if(!button)return;
  const icon=img('/brand/royal-'+art+'.svg','gc-mode-icon');
  icon.loading='eager';
  button.prepend(icon);
}
export function mountArcadeShell({lobby,play,learn,profile,match,go,openSetup,getMatchSummary,readSavedHistory,storagePersistent}){
  const hero=lobby.querySelector('.ch-hero');
  const copy=hero?.querySelector('.ch-hero-copy');
  const modes=lobby.querySelector('.mode-cards');
  const more=lobby.querySelector('.ch-home-shortcuts');
  if(!hero||!copy||!modes||!more)throw new Error('Royal arcade requires the existing chess screen IDs');

  // Recompose the home DOM; do not shadow old button IDs or click handlers.
  const homeTop=make('section','gc-home-top');
  homeTop.append(textPair('GLOBAL CHESS • GUEST ARENA','Welcome to your kingdom','gc-home-identity'));
  const profileButton=linkButton('My profile','gc-profile-entry',()=>go('profile'));
  profileButton.prepend(img('/brand/royal-avatar-guardian.svg','gc-profile-entry-icon'));
  homeTop.append(profileButton);
  lobby.prepend(homeTop);

  hero.classList.add('gc-royal-stage');
  copy.prepend(make('p','gc-stage-flag','THE ARENA IS YOURS'));
  const title=copy.querySelector('#lobby-title');
  if(title)title.textContent='Rule the board.';
  copy.append(make('p','gc-stage-description','A new challenge awaits. Play solo, face a friend, or sharpen your next move.'));
  const heroActions=make('div','gc-hero-actions');
  const begin=linkButton('PLAY CHESS','gc-primary-cta',()=>openSetup('computer'));
  begin.append(make('span','gc-cta-chevron','➜'));
  heroActions.append(begin,linkButton('CHALLENGE FRIEND','gc-secondary-cta',()=>document.getElementById('lobby-online')?.click()));
  const resume=document.getElementById('lobby-resume');
  if(resume){resume.classList.add('gc-continue-cta');heroActions.append(resume);}
  copy.append(heroActions);
  const showcase=make('div','gc-stage-showcase');showcase.append(createBoardPreview());hero.append(showcase);

  const sectionIntro=make('div','gc-section-intro');
  sectionIntro.append(textPair('CHOOSE YOUR CHALLENGE','Enter the arena','gc-section-label'));
  sectionIntro.append(make('span','gc-section-aside','YOUR NEXT MOVE STARTS HERE'));
  hero.after(sectionIntro);
  modes.classList.add('gc-battle-modes');
  const battleIcons=[['lobby-classic','classic'],['lobby-quick','rapid'],['lobby-computer','computer'],['lobby-online','online']];
  for(const [id,asset] of battleIcons){
    const btn=document.getElementById(id);
    if(btn){btn.classList.add('gc-battle-card');btn.dataset.gcMode=asset;addIcon(btn,asset);}
  }

  const explore=make('div','gc-explore-heading');
  explore.append(textPair('EXPLORE THE KINGDOM','Grow your game','gc-section-label'));
  explore.append(make('span','gc-section-aside','TRAIN • CUSTOMIZE • PROGRESS'));
  more.before(explore);
  more.classList.add('gc-explore-grid');
  // Move the quick actions below the mode selection instead of above the home hero.
  lobby.append(explore,more);
  const actionArt={daily:'daily',puzzles:'puzzles',achievements:'achievement-win',appearance:'theme-jade'};
  for(const child of more.children) {
    const asset=actionArt[child.dataset.shortcut];
    if(asset){child.classList.add('gc-explore-card');child.prepend(img('/brand/royal-'+asset+'.svg','gc-explore-icon'));}
  }
  const homeFooter=make('div','gc-home-footer');
  homeFooter.append(make('span','gc-live-light','●'),make('span','','OFFLINE CHESS READY'),make('span','gc-footer-divider','•'),make('span','',storagePersistent?'Progress saved on this device':'Temporary session only'));
  lobby.append(homeFooter);

  // Play gets a new illustration-driven screen composition, not recoloured text.
  const playHero=make('div','gc-hub-hero gc-hub-play');
  playHero.append(img('/brand/royal-versus.svg','gc-hub-hero-art'));
  const playCopy=make('div','gc-hub-copy');
  playCopy.append(make('span','gc-hero-kicker','THE NEXT BATTLE'),make('h2','','Your move, champion.'),make('p','','Four ways to play. One goal: improve every match.'));
  playHero.append(playCopy);
  play.prepend(playHero);
  const playGrid=play.querySelector('.ch-mode-grid');
  playGrid?.classList.add('gc-play-grid');
  const playAssets={classic:'classic',quick:'rapid',computer:'computer',local:'local'};
  playGrid?.querySelectorAll('[data-setup]').forEach(button=>{
    const kind=button.dataset.setup;
    button.classList.add('gc-hub-mode-card');
    button.prepend(img('/brand/royal-'+playAssets[kind]+'.svg','gc-hub-mode-art'));
  });
  const onlineCard=linkButton('Invite a friend online','gc-online-entry',()=>document.getElementById('lobby-online')?.click());
  onlineCard.prepend(img('/brand/royal-online.svg','gc-online-entry-icon'));
  playGrid?.after(onlineCard);

  const learnHero=make('div','gc-hub-hero gc-hub-learn');
  learnHero.append(img('/brand/royal-lessons.svg','gc-hub-hero-art'));
  const learnCopy=make('div','gc-hub-copy');
  learnCopy.append(make('span','gc-hero-kicker','THE CHESS ACADEMY'),make('h2','','Train your next victory.'),make('p','','Practice, discover tactics and complete your daily challenge.'));
  learnHero.append(learnCopy);
  learn.prepend(learnHero);
  const lessonArt={ 'ch-open-lessons':'lessons','ch-open-puzzles':'puzzles','ch-open-daily':'daily'};
  learn.querySelectorAll('.ch-learn-tile').forEach(button=>{
    const asset=lessonArt[button.id];
    button.classList.add('gc-academy-card');
    if(asset)button.prepend(img('/brand/royal-'+asset+'.svg','gc-academy-art'));
  });

  const profileHero=make('div','gc-profile-hero');
  profileHero.append(img('/brand/royal-profile-frame.svg','gc-profile-hero-art'));
  const profileCopy=make('div','gc-profile-hero-copy');
  profileCopy.append(make('p','gc-hero-kicker','YOUR CHESS IDENTITY'),make('h2','','Build your legacy.'),make('p','','Your profile, achievements, boards and chess history.'));
  profileHero.append(profileCopy);
  profile.querySelector('#ch-profile-title')?.after(profileHero);
  profile.querySelector('.ch-profile-actions')?.classList.add('gc-profile-hub-grid');

  // Actual match layout gets its own arena identity and contextual live label.
  const ribbon=make('div','gc-match-ribbon');
  const ribbonIcon=img('/brand/royal-board-frame.svg','gc-match-ribbon-icon');
  const ribbonCopy=make('div','gc-match-ribbon-copy');
  const modeLabel=make('span','gc-match-eyebrow','CHESS ARENA');
  const modeName=make('strong','','Every move counts');
  ribbonCopy.append(modeLabel,modeName);
  const gameStatus=make('span','gc-arena-pill','LIVE BOARD');
  ribbon.append(ribbonIcon,ribbonCopy,gameStatus);
  const toolbar=match.querySelector('.ch-match-toolbar');
  toolbar?.after(ribbon);
  match.classList.add('gc-match-arena');
  const black=document.getElementById('black-panel'),white=document.getElementById('white-panel');
  black?.classList.add('gc-arena-player');white?.classList.add('gc-arena-player');
  const refreshRibbon=()=>{
    let summary;
    try{summary=getMatchSummary();}catch{}
    modeLabel.textContent=safeMatchLabel(summary);
    modeName.textContent=summary?.outcome?'Match completed':'Every move counts';
    gameStatus.textContent=summary?.outcome?'RESULT READY':'LIVE BOARD';
    gameStatus.classList.toggle('gc-arena-finished',Boolean(summary?.outcome));
  };
  window.addEventListener('chess-match-view-shown',refreshRibbon);
  window.addEventListener('chess-move-committed',refreshRibbon);
  refreshRibbon();
  return {refreshRibbon};
}
