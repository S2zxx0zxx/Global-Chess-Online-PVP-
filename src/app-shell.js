import { lessons, puzzles } from './learning.js';

const byId = id => document.getElementById(id);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The v3 M0 shell intentionally calls existing, tested game commands rather
// than keeping a separate copy of chess state in the presentation layer.
export function mountAppShell({startMatch, historyCount}) {
  const main = document.querySelector('main');
  const lobby = byId('lobby');
  const match = byId('match-area');
  if (!main || !lobby || !match) throw new Error('Missing chess app shell');
  const views = new Set(['home', 'play', 'learn', 'profile', 'match']);
  let view = 'home';

  const hero = element('div', 'ch-hero');
  hero.innerHTML = '<div class="ch-hero-mark" aria-hidden="true">♞ <span>♚</span> ♜</div><p class="ch-eyebrow">THE CLASSIC GAME, REIMAGINED</p><h2>GLOBAL CHESS</h2><p>Play your way. Learn every game.</p>';
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

  const back = element('button','ch-match-home','← Home');
  back.id='ch-match-home';
  back.type='button';
  back.addEventListener('click',()=>go('home'));
  match.prepend(back);

  const setup = element('dialog','ch-setup-dialog');
  setup.id = 'ch-setup-dialog';
  setup.setAttribute('aria-labelledby','ch-setup-title');
  setup.innerHTML='<form method="dialog" id="ch-setup-form"><p class="ch-eyebrow">NEW MATCH</p><h2 id="ch-setup-title">Set your game</h2><label>Play against<select id="ch-setup-opponent"><option value="computer">Computer</option><option value="local">Local friend</option></select></label><label>Time control<select id="ch-setup-time"><option value="untimed">Untimed</option><option value="classic">Classic · 15 minutes</option><option value="quick">Quick · 5 minutes</option></select></label><label id="ch-setup-difficulty-row">Computer difficulty<select id="ch-setup-difficulty"><option value="easy">Beginner</option><option value="standard">Casual</option><option value="hard">Challenging</option></select></label><div class="ch-dialog-actions"><button type="button" id="ch-setup-cancel">Cancel</button><button type="submit" id="ch-setup-start">Start match</button></div></form>';
  main.append(setup);

  const opponent=byId('ch-setup-opponent');
  const time=byId('ch-setup-time');
  const difficulty=byId('ch-setup-difficulty');
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
    difficulty.value=byId('difficulty').value||'standard';
    difficultyRow.hidden=opponent.value!=='computer';
    setup.showModal();
  }
  play.querySelectorAll('[data-setup]').forEach(button =>
    button.addEventListener('click',()=>openSetup(button.dataset.setup)));
  byId('ch-setup-form').addEventListener('submit',event=>{
    event.preventDefault();
    byId('preset').value=time.value;
    byId('difficulty').value=difficulty.value;
    const started=startMatch(opponent.value,time.value,difficulty.value);
    if (started) { setup.close(); go('match'); }
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
  byId('ch-open-lessons').addEventListener('click',()=>openExercises('lessons'));
  byId('ch-open-puzzles').addEventListener('click',()=>openExercises('puzzles'));
  byId('ch-open-daily').addEventListener('click',()=>openExercises('daily'));

  byId('ch-edit-profile').addEventListener('click',()=>byId('profile-open').click());
  byId('ch-profile-history').addEventListener('click',()=>{
    go('match');
    byId('history-button').click();
  });
  byId('ch-profile-settings').addEventListener('click',()=>byId('settings-open').click());

  // The core still owns profile and match state. The shell only reads truthful,
  // already-saved local values; no fake ranks, coins or leaderboard statistics.
  function refreshProfile(){
    let prefs={};
    try{prefs=JSON.parse(localStorage.getItem('global-chess.preferences.v1')||'{}')||{};}catch{}
    byId('ch-profile-name').textContent=typeof prefs.name==='string'&&prefs.name.trim()?prefs.name.trim().slice(0,24):'Guest player';
    byId('ch-profile-avatar').textContent=['♞','♜','♛'].includes(prefs.avatar)?prefs.avatar:'♞';
    const total=historyCount();
    byId('ch-history-total').textContent=total===null?'Unavailable':String(total);
  }
  byId('profile-form').addEventListener('submit',()=>queueMicrotask(refreshProfile));
  function go(next) {
    if (!views.has(next)) throw new Error('Unknown chess view: '+next);
    view=next;
    const root=document.documentElement;
    for(const item of views) root.classList.toggle('ch-view-'+item,item===next);
    lobby.hidden=next!=='home';
    play.hidden=next!=='play';
    learn.hidden=next!=='learn';
    profile.hidden=next!=='profile';
    byId('lobby-resume').hidden=next!=='home'||byId('lobby-resume').hidden;
    for(const tab of nav.querySelectorAll('button')){
      const active=tab.dataset.chView===next;
      tab.setAttribute('aria-current',active?'page':'false');
    }
    if(next==='profile') refreshProfile();
    if(next!=='match') window.scrollTo({top:0,behavior:'instant'});
    if(next==='match') match.focus({preventScroll:true});
  }
  byId('lobby-resume').addEventListener('click',()=>go('match'));
  byId('lobby-online').addEventListener('click',()=>go('match'));
  byId('online-leave').addEventListener('click',()=>go('home'));
  document.documentElement.classList.add('ch-shell-ready');
  go(new URLSearchParams(location.hash.slice(1)).has('invite')?'match':'home');
  return {go,openSetup,get view(){return view;}};
}
