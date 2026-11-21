import { lessons, puzzles, dailyExercise } from './learning.js';
import { mountScreenRoutes } from './screen-routes.js';

const byId = id => document.getElementById(id);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The v3 M0 shell intentionally calls existing, tested game commands rather
// than keeping a separate copy of chess state in the presentation layer.
export function mountAppShell({startMatch, historyCount, readSavedHistory, writeSavedHistory, getMatchSummary, resignCurrentMatch, pauseCurrentMatch, resumeCurrentMatch, preparePwaUpdate, storagePersistent = true}) {
  const main = document.querySelector('main');
  const lobby = byId('lobby');
  const match = byId('match-area');
  if (!main || !lobby || !match) throw new Error('Missing chess app shell');
  const views = new Set(['home', 'play', 'learn', 'profile', 'match']);
  let view = 'home';
  let screenRoutes;
  if (!storagePersistent) {
    const message = element('p','ch-volatile-warning','Session-only mode: browser storage is unavailable. Chess works, but games and progress will not survive closing this tab.');
    message.setAttribute('role','alert');
    main.prepend(message);
  }

  const hero = element('div', 'ch-hero');
  hero.innerHTML = '<div class="ch-hero-mark"><img class="ch-brand-art" src="/brand/global-chess-emblem.svg" alt="Global Chess emblem"></div><p class="ch-eyebrow">THE CLASSIC GAME, REIMAGINED</p><h2>GLOBAL CHESS</h2><p>Play your way. Learn every game.</p>';
  lobby.insertBefore(hero, lobby.firstChild);

  const play = element('section', 'ch-screen ch-play-hub');
  play.id = 'ch-play-hub';
  play.setAttribute('aria-labelledby', 'ch-play-title');
  play.innerHTML = '<p class="ch-eyebrow">CHOOSE YOUR NEXT MOVE</p><h1 id="ch-play-title">Play chess</h1><p class="ch-support">Select how you want to play. No account required.</p><div class="ch-mode-grid"><button type="button" data-setup="classic" class="ch-mode-card ch-mode-gold"><strong>Classic Chess</strong><small>Play a relaxed match or use a 15-minute clock</small></button><button type="button" data-setup="quick" class="ch-mode-card ch-mode-teal"><strong>Quick Chess</strong><small>5-minute clock, faster decisions</small></button><button type="button" data-setup="computer" class="ch-mode-card"><strong>Vs Computer</strong><small>Offline opponent, three levels</small></button><button type="button" data-setup="local" class="ch-mode-card"><strong>Local Friend</strong><small>Two players on one device</small></button></div>';
  lobby.after(play);

  const learn = element('section', 'ch-screen ch-learn-hub');
  learn.id = 'ch-learn-hub';
  learn.setAttribute('aria-labelledby', 'ch-learn-title');
  learn.innerHTML = '<p class="ch-eyebrow">GROW WITH EVERY MOVE</p><h1 id="ch-learn-title">Learn chess</h1><p class="ch-support">Real interactive practice. Your progress stays on this device.</p><div class="ch-learn-grid"><button type="button" id="ch-open-lessons" class="ch-learn-tile"><span aria-hidden="true">♙</span><strong>Lessons</strong><small>Move, protect and develop your pieces</small></button><button type="button" id="ch-open-puzzles" class="ch-learn-tile"><span aria-hidden="true">♞</span><strong>Puzzles</strong><small>Find the right tactical move</small></button><button type="button" id="ch-open-daily" class="ch-learn-tile"><span aria-hidden="true">♛</span><strong>Daily challenge</strong><small>A new local puzzle each day</small></button></div>';
  play.after(learn);
  byId('ch-open-lessons').append(element('small','ch-count',String(lessons.length)+' lessons'));
  byId('ch-open-puzzles').append(element('small','ch-count',String(puzzles.length)+' puzzles'));

  const profile = element('section', 'ch-screen ch-profile-hub');
  profile.id = 'ch-profile-hub';
  profile.setAttribute('aria-labelledby', 'ch-profile-title');
  profile.innerHTML = '<p class="ch-eyebrow">YOUR LOCAL JOURNEY</p><h1 id="ch-profile-title">Player profile</h1><div class="ch-profile-card"><div class="ch-profile-avatar" id="ch-profile-avatar" aria-hidden="true">♞</div><div><strong id="ch-profile-name">Guest player</strong><small>Local player · saved on this device</small></div></div><div class="ch-profile-stat"><span>Completed matches in history</span><strong id="ch-history-total">0</strong></div><p class="ch-support">Clearing browser data may remove your local progress. Export backups from Match History.</p><div class="ch-profile-actions"><button type="button" id="ch-edit-profile">Edit profile</button><button type="button" id="ch-profile-history">Match history</button><button type="button" id="ch-profile-settings">Settings</button></div>';
  learn.after(profile);

  const nav = element('nav', 'ch-tab-bar');
  nav.id = 'ch-tab-bar';
  nav.setAttribute('aria-label', 'Primary game navigation');
  const navigation = [['home','⌂','Home'],['play','♟','Play'],['learn','◇','Learn'],['profile','♙','Profile']];
  for (const [key,icon,label] of navigation) {
    const tab = element('button','ch-tab');
    tab.type='button';
    tab.dataset.chView=key;
    tab.setAttribute('aria-label',label);
    const glyph=element('span','ch-tab-icon',icon);
    glyph.setAttribute('aria-hidden','true');
    tab.append(glyph,element('span','ch-tab-label',label));
    tab.addEventListener('click', () => go(key));
    nav.append(tab);
  }
  main.append(nav);

  const toolbar=element('div','ch-match-toolbar');
  const back = element('button','ch-match-home','← Home');
  back.id='ch-match-home';
  back.type='button';
  back.addEventListener('click',()=>go('home'));
  const tools=element('button','ch-match-tools','More options');
  tools.id='ch-match-tools';
  tools.type='button';
  tools.setAttribute('aria-expanded','false');
  tools.setAttribute('aria-controls','ch-match-sidebar');
  tools.addEventListener('click',()=>{
    const opened=document.documentElement.classList.toggle('ch-tools-open');
    tools.setAttribute('aria-expanded',String(opened));
    if(opened) byId('ch-match-sidebar').scrollIntoView({block:'nearest'});
  });
  toolbar.append(back,tools);
  match.prepend(toolbar);
  const boardControls=element('div','ch-board-controls');
  match.insertBefore(boardControls,byId('flip-board'));
  boardControls.append(byId('flip-board'),byId('view'));
  document.querySelector('.layout>aside').id='ch-match-sidebar';
  const dock=element('section','ch-match-dock');
  dock.setAttribute('aria-label','Match status and controls');
  for(const id of ['clocks','status','moves','result-open','rematch','claim','online-status','online-invite','online-copy']) {
    dock.append(byId(id));
  }
  match.append(dock);

  const tutorial=element('section','ch-first-move-tip');
  tutorial.id='ch-first-move-tip';
  tutorial.hidden=true;
  tutorial.setAttribute('role','status');
  const tip=element('p','ch-tip-message','Tap a white piece to see its legal moves.');
  const skip=element('button','ch-tip-skip','Skip tutorial');
  skip.type='button';
  tutorial.append(tip,skip);
  match.insertBefore(tutorial,byId('black-panel'));
  const tutorialKey='global-chess.first-move-v1';
  let lessonStep=0;
  function finishTutorial(){
    tutorial.hidden=true;
    lessonStep=0;
    try{localStorage.setItem(tutorialKey,'done');}catch{}
  }
  skip.addEventListener('click',finishTutorial);
  function startTutorial(force=false){
    if(!force){
      try{if(localStorage.getItem(tutorialKey)==='done')return;}catch{}
    }
    lessonStep=1;
    const summary = getMatchSummary();
    const side = summary.mode === 'computer' && summary.playerSide === 'b' ? 'Black' : 'White';
    tip.textContent='Tap a '+side+' piece to see its legal moves.';
    tutorial.dataset.side = side === 'Black' ? 'b' : 'w';
    tutorial.hidden=false;
  }
  byId('board').addEventListener('click',()=>{
    if(tutorial.hidden)return;
    if(lessonStep===1&&byId('board').querySelector('[aria-pressed=true]')){
      lessonStep=2;
      tip.textContent='Now tap a highlighted square to make your move.';
    } else if(lessonStep===2&&byId('moves').children.length){
      finishTutorial();
    }
  });
  window.addEventListener('chess-move-committed', event => {
    // Works equally with mouse, keyboard, touch drag and 3D board moves.
    if (!tutorial.hidden && event.detail?.color === tutorial.dataset.side) finishTutorial();
  });
  const replayTutorial=element('button','ch-tutorial-replay','Replay first-move tutorial');
  replayTutorial.type='button';
  replayTutorial.addEventListener('click',()=>{
    document.documentElement.classList.remove('ch-tools-open');
    tools.setAttribute('aria-expanded','false');
    startTutorial(true);
    match.scrollIntoView({block:'start'});
  });
  byId('ch-match-sidebar').prepend(replayTutorial);

  const setup = element('dialog','ch-setup-dialog');
  setup.id = 'ch-setup-dialog';
  setup.setAttribute('aria-labelledby','ch-setup-title');
  setup.innerHTML='<form method="dialog" id="ch-setup-form"><p class="ch-eyebrow">NEW MATCH</p><h2 id="ch-setup-title">Set your game</h2><label>Play against<select id="ch-setup-opponent"><option value="computer">Computer</option><option value="local">Local friend</option></select></label><label>Time control<select id="ch-setup-time"><option value="untimed">Untimed</option><option value="classic">Classic · 15 minutes</option><option value="quick">Quick · 5 minutes</option></select></label><label id="ch-setup-difficulty-row">Computer difficulty<select id="ch-setup-difficulty"><option value="easy">Beginner</option><option value="standard">Casual</option><option value="hard">Challenging</option></select></label><label>Play as<select id="ch-setup-side"><option value="w">White</option><option value="b">Black</option><option value="random">Random</option></select></label><p class="ch-setup-note">The computer plays the opposite color. Local friends may flip the board during play.</p><div class="ch-dialog-actions"><button type="button" id="ch-setup-cancel">Cancel</button><button type="submit" id="ch-setup-start">Start match</button></div></form>';
  main.append(setup);

  const opponent=byId('ch-setup-opponent');
  const time=byId('ch-setup-time');
  const difficulty=byId('ch-setup-difficulty');
  const playerSide=byId('ch-setup-side');
  const difficultyRow=byId('ch-setup-difficulty-row');
  opponent.addEventListener('change',()=>{difficultyRow.hidden=opponent.value!=='computer';});
  byId('ch-setup-cancel').addEventListener('click',()=>setup.close());
  setup.addEventListener('cancel',()=>{});
  function openSetup(kind='computer') {
    if (kind==='classic'||kind==='quick') {
      time.value=kind;
      opponent.value='local';
    } else {
      time.value=kind==='computer'?'untimed':byId('preset').value;
      opponent.value=kind==='local'?'local':'computer';
    }
    const last=(()=>{try{return JSON.parse(localStorage.getItem('global-chess.setup.v1')||'{}');}catch{return {};}})();
    difficulty.value=['easy','standard','hard'].includes(last.difficulty)?last.difficulty:'easy';
    playerSide.value=['w','b','random'].includes(last.playerSide)?last.playerSide:'w';
    difficultyRow.hidden=opponent.value!=='computer';
    setup.showModal();
  }
  play.querySelectorAll('[data-setup]').forEach(button =>
    button.addEventListener('click',()=>openSetup(button.dataset.setup)));
  document.addEventListener('chess-open-setup',event=>openSetup(event.detail?.format||'computer'));
  document.addEventListener('chess-open-result',()=>go('result'));
  byId('ch-setup-form').addEventListener('submit',event=>{
    event.preventDefault();
    byId('preset').value=time.value;
    byId('difficulty').value=difficulty.value;
    const chosen=playerSide.value==='random'
      ? (crypto.getRandomValues(new Uint8Array(1))[0]%2?'b':'w')
      : playerSide.value;
    const started=startMatch(opponent.value,time.value,difficulty.value,chosen);
    if (started) {
      try{localStorage.setItem('global-chess.setup.v1',JSON.stringify({
        playerSide:playerSide.value,difficulty:difficulty.value,opponent:opponent.value,time:time.value,
      }));}catch{}
      setup.close();go('match');
    }
  });

  function openExercises(kind) {
    byId('learn').click();
    if(kind==='lessons')return;
    const picker=byId('lesson-picker');
    const all=[...lessons,...puzzles];
    const index=kind==='daily'?all.length:lessons.length;
    picker.value=String(index);
    picker.dispatchEvent(new Event('change'));
  }
  byId('ch-open-lessons').addEventListener('click',()=>go('lessons'));
  byId('ch-open-puzzles').addEventListener('click',()=>go('puzzles'));
  byId('ch-open-daily').addEventListener('click',()=>go('daily'));

  byId('ch-edit-profile').addEventListener('click',()=>byId('profile-open').click());
  byId('ch-profile-history').addEventListener('click',()=>go('history'));
  byId('ch-profile-settings').addEventListener('click',()=>go('settings'));

  // The core still owns profile and match state. The shell only reads truthful,
  // already-saved local values; no fake ranks, coins or leaderboard statistics.
  function refreshProfile(){
    let prefs={};
    try{prefs=JSON.parse(localStorage.getItem('global-chess.preferences.v1')||'{}')||{};}catch{}
    byId('ch-profile-name').textContent=typeof prefs.name==='string'&&prefs.name.trim()?prefs.name.trim().slice(0,24):'Guest player';
    const icons={'♞':'/brand/guest-avatar.svg','♜':'/brand/pieces/piece_white_rook.svg','♛':'/brand/pieces/piece_white_queen.svg'};
    const avatar=byId('ch-profile-avatar');
    const icon=document.createElement('img');
    icon.src=icons[prefs.avatar]||icons['♞'];icon.alt='';
    avatar.replaceChildren(icon);
    const frame=(()=>{try{return JSON.parse(localStorage.getItem('global-chess.avatar-frame.v1')||'null');}catch{return null;}})();
    avatar.dataset.frame=['gold','walnut','teal'].includes(frame)?frame:'gold';
    const total=historyCount();
    byId('ch-history-total').textContent=total===null?'Unavailable':String(total);
  }
  byId('profile-form').addEventListener('submit',()=>queueMicrotask(refreshProfile));
  window.addEventListener('chess-profile-changed',refreshProfile);
  function go(next, options = {}) {
    if (!views.has(next)) throw new Error('Unknown chess view: '+next);
    if (!options.fromHistory) {
      // Keep the URL and browser history in step with in-app navigation.
      // On mobile, Back returns to the previous screen without discarding a match.
      try {
        const url = new URL(location.href);
        url.searchParams.set('screen', next);
        const target = url.pathname + url.search + url.hash;
        const replace = options.replace || history.state?.chessView === next;
        history[replace ? 'replaceState' : 'pushState']({ ...history.state, chessView: next }, '', target);
      } catch { /* Standalone/browser-restricted environments keep local navigation. */ }
    }
    if(view==='pause' && next==='match')resumeCurrentMatch();
    view=next;
    const root=document.documentElement;
    for(const item of views) root.classList.toggle('ch-view-'+item,item===next);
    lobby.hidden=next!=='home';
    play.hidden=next!=='play';
    learn.hidden=next!=='learn';
    profile.hidden=next!=='profile';
    screenRoutes?.show(next);
    for(const tab of nav.querySelectorAll('button')){
      const active=tab.dataset.chView===next || (['history','review','progress','achievements','appearance','avatars','settings','data','transfer','update','about'].includes(next)&&tab.dataset.chView==='profile') || (['lessons','lesson','puzzles','puzzle','puzzle-result','daily'].includes(next)&&tab.dataset.chView==='learn');
      tab.setAttribute('aria-current',active?'page':'false');
    }
    if(next==='profile') refreshProfile();
    if(next!=='match') {
      root.classList.remove('ch-tools-open');
      tools.setAttribute('aria-expanded','false');
      window.scrollTo({top:0,behavior:'instant'});
    }
    if(next==='match') match.focus({preventScroll:true});
  }
  byId('lobby-resume').addEventListener('click',()=>{resumeCurrentMatch();go('match');});
  byId('lobby-online').addEventListener('click',()=>go('match'));
  byId('online-leave').addEventListener('click',()=>go('home'));
  screenRoutes=mountScreenRoutes({
    main,go,readHistory:readSavedHistory,writeHistory:writeSavedHistory,getMatchSummary,resignCurrentMatch,pauseCurrentMatch,resumeCurrentMatch,preparePwaUpdate,
    openExercise(exercise){
      byId('learn').click();
      const list=[...lessons,...puzzles,dailyExercise()];
      const picker=byId('lesson-picker');
      const index=list.findIndex(item=>item.id===exercise.id);
      if(index!==-1){picker.value=String(index);picker.dispatchEvent(new Event('change'));}
    },
  });
  for(const route of screenRoutes.routes)views.add(route);
  const profileActions=profile.querySelector('.ch-profile-actions');
  for(const [label,route] of [['Progress','progress'],['Achievements','achievements'],['Avatars & Frames','avatars'],['Appearance','appearance'],['Data & Privacy','data']]){
    const link=element('button','ch-profile-shortcut',label);link.type='button';link.addEventListener('click',()=>go(route));
    profileActions.append(link);
  }
  const more=element('div','ch-home-shortcuts');
  for(const [label,route] of [['Daily Challenge','daily'],['Puzzles','puzzles'],['Achievements','achievements'],['Appearance','appearance']]){
    const link=element('button','ch-home-shortcut',label);link.type='button';link.addEventListener('click',()=>go(route));more.append(link);
  }
  lobby.append(more);
  document.documentElement.classList.add('ch-shell-ready');
  // Read-only deep links let QA visit each ZIP v3 screen without modifying
  // active game state. Invite hashes always take precedence.
  const requested = new URL(location.href).searchParams.get('screen');
  const invite = new URLSearchParams(location.hash.slice(1)).has('invite');
  window.addEventListener('popstate', () => {
    const target = history.state?.chessView ?? new URLSearchParams(location.search).get('screen');
    go(views.has(target) ? target : 'home', {fromHistory:true});
  });
  go(invite ? 'match' : (views.has(requested) ? requested : 'home'), {replace:true});
  return {
    go,openSetup,
    onNewMatch(){go('match');startTutorial();},
    get view(){return view;},
  };
}
