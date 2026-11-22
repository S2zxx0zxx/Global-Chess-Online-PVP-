/**
 * Midnight Sapphire: original game-front presentation.
 *
 * Existing game engine, progression ledger, save/restore, private room and
 * accessibility remain the only authorities. Never make up ELO, gems, coins,
 * public opponents, or cloud accounts for decoration.
 */
import {summarizeMatches} from './game-stats.js';
import {feedbackPreferences,setFeedbackPreference} from './feedback.js';

const el=id=>document.getElementById(id);
function make(tag,klass='',content){
  const e=document.createElement(tag);
  if(klass)e.className=klass;
  if(content!==undefined)e.textContent=content;
  return e;
}
function picture(src,klass=''){
  const e=make('img',klass);e.src=src;e.alt='';e.decoding='async';return e;
}
function action(label,klass,callback){
  const b=make('button',klass,label);
  b.type='button';b.addEventListener('click',callback);return b;
}
function info(label,value){
  const row=make('div','gs-stat');
  row.append(make('span','',label),make('strong','',String(value)));
  return row;
}
export function sapphireTrainingDisplay(report,goal=15){
  if(!report || report.invalid)return {count:0,goal,percent:0,label:'Progress unavailable',xp:'Unavailable'};
  const raw=Number(report.lessonsSolved||0)+Number(report.puzzlesSolved||0)+Number(report.dailySolved||0);
  const count=Number.isFinite(raw)?Math.max(0,Math.floor(raw)):0;
  return {count,goal,percent:Math.round(Math.min(goal,count)/goal*100),label:count>=goal?'15 challenges completed':'Complete 15 chess challenges',xp:Number.isFinite(report.xp)?String(report.xp):'Unavailable'};
}
export function sapphireMatchStatus(status){
  const s=String(status||'').toLowerCase();
  if(/expired|error|failed|unavailable|unable|invalid/.test(s))return 'ROOM UNAVAILABLE';
  if(/reconnect|connection interrupted|response lost/.test(s))return 'RECONNECTING';
  if(/you are (white|black)|opponent joined|both seats|match ready|match connected/.test(s))return 'MATCH CONNECTED';
  return 'PRIVATE ROOM — INVITE REQUIRED';
}
function pref(){
  try {
    const v=JSON.parse(localStorage.getItem('global-chess.preferences.v1')||'{}');
    return v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  } catch{return {};}
}
function imageForAvatar(avatar){
  return {'♞':'/brand/royal-avatar-guardian.svg','♜':'/brand/royal-avatar-scholar.svg','♛':'/brand/royal-avatar-traveler.svg'}[avatar]||'/brand/royal-avatar-guardian.svg';
}
function addButton(parent,label,art,cb,klass='gs-tile'){
  const b=action(label,klass,cb);
  b.prepend(picture('/brand/royal-'+art+'.svg','gs-tile-icon'));
  parent.append(b);
  return b;
}
function mountProfileDialog({main,go,readSavedHistory,refreshProfile,getProgressReport}){
  const popup=make('dialog','gs-profile-popup');popup.id='gs-profile-popup';
  popup.setAttribute('aria-labelledby','gs-profile-heading');
  const header=make('div','gs-popup-heading');
  const title=make('h2','', 'Player Profile');title.id='gs-profile-heading';
  header.append(title,action('×','gs-popup-close',()=>popup.close()));
  const identity=make('div','gs-popup-identity');
  const avatar=picture('/brand/royal-avatar-guardian.svg','gs-popup-avatar');
  const alias=make('strong','','Guest player');
  const subtitle=make('small','','Local chess identity');
  const edit=action('Edit','gs-icon-edit',()=>{
    popup.close();
    document.dispatchEvent(new Event('chess-edit-profile'));
  });
  const stack=make('div','gs-popup-name');
  stack.append(alias,subtitle);
  identity.append(avatar,stack,edit);
  const statList=make('div','gs-profile-stat-list');
  const buttons=make('div','gs-profile-footer');
  addButton(buttons,'Achievements','achievement-win',()=>{popup.close();go('achievements')});
  addButton(buttons,'Avatars','avatar-guardian',()=>{popup.close();go('avatars')});
  addButton(buttons,'History','history',()=>{popup.close();go('history')});
  popup.append(header,identity,statList,buttons);
  main.append(popup);
  function refresh(){
    refreshProfile();
    const current=pref();
    avatar.src=imageForAvatar(current.avatar);
    alias.textContent=typeof current.name==='string'&&current.name.trim()?current.name.trim().slice(0,24):'Guest player';
    let records=null;
    try{records=readSavedHistory();}catch{}
    const stats=Array.isArray(records)?summarizeMatches(records):null;
    const report=(()=>{try{return getProgressReport();}catch{return null;}})();
    const progress=sapphireTrainingDisplay(report);
    statList.replaceChildren(
      info('Verified games',stats?.completed??'Unavailable'),
      info('Vs computer wins',stats?.wins??'Unavailable'),
      info('Vs computer losses',stats?.losses??'Unavailable'),
      info('Win rate',stats?stats.winRate+'%':'Unavailable'),
      info('Best bot streak',stats?.bestWinStreak??'Unavailable'),
      info('Training XP',progress.xp)
    );
    subtitle.textContent=stats?.invalid?'Some saved records failed validation':'Progress stored on this device';
  }
  const open=()=>{refresh();popup.showModal();};
  popup.addEventListener('click',e=>{if(e.target===popup)popup.close();});
  return {open,refresh};
}
function mountSettings({main,go}){
  const settings=el('settings-dialog');
  settings.classList.add('gs-settings-popup');
  const heading=settings.querySelector('h2');
  if(heading)heading.textContent='Settings';
  const sound=make('div','gs-audio-settings');
  for(const [key,label,description] of [
    ['sound','Move sounds','Optional chess effects'],
    ['haptics','Vibration','Available on supported devices']
  ]){
    const row=make('label','gs-settings-switch');
    const copy=make('span','');
    copy.append(make('strong','',label),make('small','',description));
    const check=make('input');check.type='checkbox';check.dataset.gsPreference=key;
    if(key==='haptics'&&typeof navigator.vibrate!=='function')check.disabled=true;
    if(key==='sound'&&!(window.AudioContext||window.webkitAudioContext))check.disabled=true;
    const notice=make('small','gs-setting-feedback','');
    check.addEventListener('change',()=>{
      if(!setFeedbackPreference(key,check.checked)){
        check.checked=!check.checked;notice.textContent='Cannot save on this device.';
      }else notice.textContent='';
    });
    row.append(copy,check,notice);sound.append(row);
  }
  if(heading)heading.after(sound);
  const links=make('div','gs-settings-links');
  addButton(links,'Appearance','theme-jade',()=>{settings.close();go('appearance')});
  addButton(links,'Privacy & backup','privacy',()=>{settings.close();go('data')});
  addButton(links,'Help & notices','help',()=>{settings.close();go('about')});
  settings.querySelector('form[method=dialog]')?.before(links);
  const sync=()=>{for(const input of sound.querySelectorAll('input'))input.checked=feedbackPreferences()[input.dataset.gsPreference];};
  el('settings-open').addEventListener('click',sync,{capture:true});
  return {open:()=>{sync();el('settings-open').click();}};
}
function installNavigation(nav,go){
  const items=[
    ['appearance','Collection','theme-jade'],
    ['learn','Learn','lessons'],
    ['home','Home','nav-home'],
    ['play','Modes','nav-play'],
    ['profile','Profile','nav-profile'],
  ];
  const nodes=items.map(([route,label,art])=>{
    const tab=make('button','ch-tab gs-nav-tab');
    tab.type='button';tab.dataset.chView=route;tab.setAttribute('aria-label',label);
    tab.append(picture('/brand/royal-'+art+'.svg','gs-nav-icon'),make('span','ch-tab-label',label));
    tab.addEventListener('click',()=>go(route));
    return tab;
  });
  nav.replaceChildren(...nodes);
  nav.classList.add('gs-bottom-nav');
  return nodes;
}
export function mountSapphireShell({lobby,play,learn,profile,match,main,nav,go,openSetup,readSavedHistory,getProgressReport,refreshProfile,getMatchSummary,storagePersistent}){
  const root=document.documentElement;
  root.classList.add('ch-sapphire-ready');
  const profilePopup=mountProfileDialog({main,go,readSavedHistory,refreshProfile,getProgressReport});
  const settingsPopup=mountSettings({main,go});
  installNavigation(nav,go);

  const banner=make('section','gs-top-banner');
  const top=make('div','gs-top-status');
  const settingsBtn=action('Settings','gs-settings-trigger',()=>settingsPopup.open());
  settingsBtn.prepend(picture('/brand/royal-settings.svg','gs-small-icon'));
  const saved=make('span','gs-storage-tag',storagePersistent?'LOCAL SAVE':'SESSION ONLY');
  top.append(settingsBtn,saved);
  const playerLine=make('div','gs-player-header');
  const player=action('','gs-user-chip',()=>profilePopup.open());
  const playerAvatar=picture('/brand/royal-avatar-guardian.svg','gs-user-avatar');
  const playerText=make('span','gs-user-copy');
  const userName=make('strong','','Guest player');
  const userXp=make('small','','0 training XP');
  playerText.append(userName,userXp);player.append(playerAvatar,playerText);
  const practice=action('Training','gs-training-chip',()=>go('learn'));
  practice.prepend(picture('/brand/royal-daily.svg','gs-small-icon'));
  playerLine.append(player,practice);
  const quest=make('div','gs-quest');
  const questTop=make('div','gs-quest-top');
  questTop.append(picture('/brand/royal-achievement-tactics.svg','gs-quest-icon'));
  const label=make('div','gs-quest-copy');
  const questName=make('strong','','Complete 15 chess challenges');
  const questDetail=make('small','','0 / 15 complete');
  label.append(questName,questDetail);
  const questBtn=action('Train','gs-quest-button',()=>go('learn'));
  questTop.append(label,questBtn);
  const bar=make('div','gs-progress-track');
  const fill=make('div','gs-progress-fill');fill.style.width='0%';
  bar.append(fill);
  quest.append(questTop,bar);
  banner.append(top,playerLine,quest);

  // Keep existing board preview; it is decorative art from original game pieces.
  // Move the real game controls instead of creating a second set of handlers.
  const hero=lobby.querySelector('.ch-hero');
  const showcase=hero.querySelector('.gc-stage-showcase');
  const stage=make('section','gs-board-stage');
  const originalCopy=hero.querySelector('.ch-hero-copy');
  originalCopy.hidden=true;
  // Keep legacy guest-greeting and lobby-title IDs connected for the tested profile controller.
  stage.append(originalCopy);
  const stageStars=make('span','gs-stage-orbit','');
  stage.append(stageStars);
  if(showcase)stage.append(showcase);
  const stagedCaption=make('p','gs-board-caption','A new match is waiting.');
  stage.append(stagedCaption);
  const actions=hero.querySelector('.gc-hero-actions');
  const begin=actions?.querySelector('.gc-primary-cta');
  if(begin){begin.replaceChildren(make('span','','PLAY CHESS'),make('span','gs-play-arrow','▶'));begin.classList.add('gs-play-button');}
  const controls=make('div','gs-play-controls');
  if(begin)controls.append(begin);
  const resume=el('lobby-resume');
  if(resume){resume.classList.add('gs-resume-button');controls.append(resume);}
  // Place decorative board first, hero call-to-action after it, modes below the fold.
  const modeHeader=lobby.querySelector('.gc-section-intro');
  lobby.insertBefore(banner,hero);
  hero.replaceWith(stage);
  if(modeHeader)modeHeader.before(controls);
  else stage.after(controls);
  if(actions){
    const challenge=actions.querySelector('.gc-secondary-cta');
    if(challenge){challenge.classList.add('gs-invite-button');controls.append(challenge);}
  }
  lobby.classList.add('gs-sapphire-lobby');
  lobby.querySelector('.mode-cards')?.classList.add('gs-mode-list');
  const explore=lobby.querySelector('.gc-explore-grid');
  explore?.classList.add('gs-collectables');
  const refresh=()=>{
    const p=pref();
    userName.textContent=typeof p.name==='string'&&p.name.trim()?p.name.trim().slice(0,24):'Guest player';
    playerAvatar.src=imageForAvatar(p.avatar);
    let report;
    try{report=getProgressReport();}catch{}
    const training=sapphireTrainingDisplay(report);
    userXp.textContent=training.xp+' training XP';
    questName.textContent=training.label;
    questDetail.textContent=training.count+' / '+training.goal+' completed';
    fill.style.width=training.percent+'%';
  };
  refresh();
  window.addEventListener('chess-profile-changed',refresh);
  window.addEventListener('chess-move-committed',refresh);
  const observer=new MutationObserver(()=>{if(root.classList.contains('ch-view-home'))refresh();});
  observer.observe(root,{attributes:true,attributeFilter:['class']});

  // Matchmaking uses existing real private room flow. Never simulate an
  // available opponent; show actual room status, sharing and cancel controls.
  const room=match.querySelector('.ch-room-panel');
  if(room){
    room.classList.add('gs-private-room');
    const lobbyArt=make('div','gs-pvp-banner');
    lobbyArt.append(picture('/brand/royal-avatar-guardian.svg','gs-pvp-avatar'));
    lobbyArt.append(make('strong','gs-pvp-vs','VS'));
    lobbyArt.append(picture('/brand/royal-online.svg','gs-pvp-avatar'));
    const title=make('p','gs-pvp-title','Invite a real opponent');
    const hint=make('p','gs-pvp-hint','Create a private room, share the invite and play when your friend joins. Public matchmaking is not enabled.');
    room.prepend(lobbyArt,title,hint);
    const status=el('online-status');
    const badge=make('span','gs-pvp-state','PRIVATE ROOM — INVITE REQUIRED');
    status?.after(badge);
    if(status){
      new MutationObserver(()=>{badge.textContent=sapphireMatchStatus(status.textContent);})
        .observe(status,{subtree:true,childList:true,characterData:true});
    }
  }

  // Full app routes already handle data, board appearance, PWA updates,
  // histories and lessons. Only honest, supported actions are visible.
  const playBanner=make('div','gs-subscreen-banner');
  playBanner.append(make('span','gs-subscreen-kicker','SELECT YOUR GAME'),make('h2','','Your next battle'),make('p','','Choose a real chess mode, then customize its settings.'));
  play.prepend(playBanner);
  const learnBanner=make('div','gs-subscreen-banner');
  learnBanner.append(make('span','gs-subscreen-kicker','CHESS ACADEMY'),make('h2','','Train your strategy'),make('p','','Real lessons, puzzles and a daily challenge.'));
  learn.prepend(learnBanner);
  const profileBanner=make('div','gs-subscreen-banner');
  profileBanner.append(make('span','gs-subscreen-kicker','YOUR CHESS LEGACY'),make('h2','','Profile & progression'),make('p','','Local statistics, cosmetics and verified achievements.'));
  profile.prepend(profileBanner);

  return {refresh,profilePopup,settingsPopup};
}
