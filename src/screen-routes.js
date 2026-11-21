import {Chess} from 'chess.js';
import {lessons,puzzles,dailyExercise} from './learning.js';
import {restoreGame} from './game.js';
import {renderPieceArt} from './piece-art.js';

const el=id=>document.getElementById(id);
const ls=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const mk=(tag,cls='',content)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=content;return x;};
const btn=(title,fn,cls='')=>{const x=mk('button','ch-action '+cls,title);x.type='button';x.addEventListener('click',fn);return x;};
const paragraph=(parent,content,cls='ch-support')=>{const x=mk('p',cls,content);parent.append(x);return x;};
const heading=(parent,group,title,summary,fn)=>{parent.append(btn('← Back',fn,'ch-back-button'));paragraph(parent,group.toUpperCase(),'ch-eyebrow');parent.append(mk('h1','',title));if(summary)paragraph(parent,summary);};
const card=(parent,title,detail,fn,cls='')=>{const x=btn('',fn,'ch-feature-card '+cls);x.append(mk('strong','',title),mk('small','',detail));parent.append(x);return x;};
const ALL=[...lessons,...puzzles];
const KNOWN=new Set(ALL.map(x=>x.id));
const report=()=>{
  const list=ls('global-chess.learning.v1',[]);
  const completed=[...new Set(Array.isArray(list)?list:[])].filter(x=>KNOWN.has(x));
  const daily=[...new Set(Array.isArray(list)?list:[])].filter(x=>/^daily-\d{4}-\d{2}-\d{2}$/.test(x));
  return {completed,daily};
};
const days=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const EXPORT=(data,name,type)=>{
  const url=URL.createObjectURL(new Blob([data],{type}));
  const a=mk('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1800);
};
const appearance=name=>{
  document.documentElement.dataset.chTheme=['maple','walnut','forest'].includes(name)?name:'maple';
};
export const EXTRA_ROUTES=Object.freeze(['menu','pause','result','review','history','lessons','lesson','puzzles','puzzle','puzzle-result','daily','progress','achievements','appearance','settings','data','transfer','recovery','update','about']);

export function mountScreenRoutes({main,go,readHistory,writeHistory,openExercise}){
  const screen=mk('section','ch-screen ch-extra-screen');
  screen.id='ch-extra-screen';screen.hidden=true;
  main.insertBefore(screen,el('ch-tab-bar'));
  let selected=0,exercise=lessons[0],lastSolved=null,fault=false,ply=0;
  appearance(ls('global-chess.appearance.v1','maple'));

  function records(){
    try{const x=readHistory();if(!Array.isArray(x))throw Error('Invalid records');return x;}catch{return null;}
  }
  function show(route){
    screen.hidden=!EXTRA_ROUTES.includes(route);
    if(screen.hidden)return;
    screen.replaceChildren();
    const section=mk('div','ch-extra-body');
    screen.append(section);
    const parents={menu:'match',pause:'match',result:'match',review:'history',history:'profile',lessons:'learn',lesson:'lessons',puzzles:'learn',puzzle:'puzzles','puzzle-result':'puzzles',daily:'learn',progress:'profile',achievements:'profile',appearance:'profile',settings:'profile',data:'settings',transfer:'data',recovery:'match',update:'settings',about:'settings'};
    const title=(group,name,sub)=>heading(section,group,name,sub,()=>go(parents[route]||'home'));
    const group=()=>{const x=mk('div','ch-feature-grid');section.append(x);return x;};
    const stack=()=>{const x=mk('div','ch-button-stack');section.append(x);return x;};

    if(route==='menu'||route==='pause'){
      title('Game session',route==='pause'?'Match interruption':'Match menu','Your board remains in the chess engine. No simulated rewards or opponent.');
      if(route==='pause')paragraph(section,'Visible timed games continue counting down. Local clocks pause when the app is hidden, not when this menu is open.','ch-inline-notice ch-notice-warning');
      const items=group();
      card(items,'Resume match','Return to the chessboard',()=>go('match'));
      card(items,'Flip board','Rotate the viewpoint only',()=>{el('flip-board').click();go('match');});
      card(items,'Save & exit','Return Home without replacing this game',()=>go('home'));
      card(items,'Restart match','Existing confirmation protects unfinished games',()=>{go('match');el('rematch').click();});
      card(items,'Settings','Accessibility and board preferences',()=>go('settings'));
    }
    if(route==='result'){
      const outcome=el('result-copy').textContent.trim();
      title('Match complete',outcome||'Match still in progress','This is the actual game-engine result, not an estimated rating.');
      if(outcome){
        const image=mk('img','ch-celebration');image.src='/brand/victory-confetti.svg';image.alt='';section.append(image);
        const items=stack();
        items.append(btn('Rematch',()=>{go('match');el('rematch').click();},'primary'),btn('Review saved matches',()=>go('history')),btn('Home',()=>go('home')));
      }else section.append(btn('Continue match',()=>go('match'),'primary'));
    }
    if(route==='history'){
      title('Saved locally','Match history','Review your completed games or delete a chosen record with confirmation.');
      const list=records();
      if(list===null){paragraph(section,'History cannot be read. No saved data has been erased.','ch-inline-notice ch-notice-warning');return;}
      if(!list.length){paragraph(section,'No completed matches yet. Your first finished match will appear here.');section.append(btn('Play chess',()=>go('play'),'primary'));return;}
      const filters=mk('select','ch-history-filter');
      filters.setAttribute('aria-label','Filter match history');
      for(const type of ['All','Computer','Local'])filters.add(new Option(type,type));
      section.append(filters);
      const result=mk('div','ch-history-rows');section.append(result);
      const pager=mk('div','ch-pager');section.append(pager);
      let page=0;
      function redraw(){
        const full=records()||[];
        const filtered=full.map((item,i)=>({item,i})).filter(({item})=>{
          if(filters.value==='All')return true;
          try{return restoreGame(item.snapshot).mode===(filters.value==='Computer'?'computer':'local');}catch{return false;}
        });
        const count=Math.max(1,Math.ceil(filtered.length/8));page=Math.min(page,count-1);
        result.replaceChildren();pager.replaceChildren();
        for(const {item,i} of filtered.slice(page*8,page*8+8)){
          const row=mk('div','ch-history-row'),copy=mk('div'),buttons=mk('div','ch-history-buttons');
          copy.append(mk('strong','',item.outcome));
          try{
            const x=restoreGame(item.snapshot);
            copy.append(mk('small','',x.mode==='computer'?'Vs computer':'Local friend'),mk('small','',x.game.history().length+' half-moves'));
          }catch{copy.append(mk('small','ch-error','Unable to load this save'));}
          buttons.append(btn('Review',()=>{selected=i;go('review');}),btn('Delete',()=>{
            if(!confirm('Permanently delete only this recorded match?'))return;
            try{writeHistory(full.filter((_,index)=>index!==i));redraw();}
            catch{paragraph(section,'Delete failed. Existing records were preserved.','ch-inline-notice ch-notice-warning');}
          }));
          row.append(copy,buttons);result.append(row);
        }
        const prev=btn('Previous',()=>{if(page>0){page--;redraw();}});
        const next=btn('Next',()=>{if(page<count-1){page++;redraw();}});
        prev.disabled=page===0;next.disabled=page>=count-1;
        pager.append(prev,mk('span','','Page '+(page+1)+' of '+count),next);
      }
      filters.onchange=()=>{page=0;redraw();};redraw();
    }
    if(route==='review'){
      title('Replay moves','Review game','No unverified Best Move, Brilliant or engine accuracy labels.');
      const entry=records()?.[selected];
      if(!entry){paragraph(section,'Selected match no longer exists.');return;}
      let game;
      try{game=restoreGame(entry.snapshot).game;}catch{paragraph(section,'This record cannot be decoded. Export a backup before changing anything.','ch-inline-notice ch-notice-warning');return;}
      const moves=game.history({verbose:true});
      const board=mk('div','ch-review-stage');section.append(board);
      const status=mk('p','ch-review-state');section.append(status);
      const controls=mk('div','ch-review-controls');section.append(controls);
      ply=0;
      function frame(){
        const snapshot=new Chess();
        for(const move of moves.slice(0,ply))snapshot.move({from:move.from,to:move.to,promotion:move.promotion});
        const grid=mk('div','board ch-review-board');
        for(const [rank,row] of snapshot.board().entries()){
          for(const [col,piece] of row.entries()){
            const cell=mk('span',(rank+col)%2?'dark':'light');
            if(piece)renderPieceArt(cell,piece,{k:'King',q:'Queen',r:'Rook',b:'Bishop',n:'Knight',p:'Pawn'});
            cell.setAttribute('aria-label','abcdefgh'[col]+(8-rank)+(piece?' '+piece.color+piece.type:' empty'));
            grid.append(cell);
          }
        }
        board.replaceChildren(grid);
        status.textContent='Move '+ply+' of '+moves.length+(ply?' · '+moves[ply-1].san:' · Start');
        controls.firstChild.disabled=ply===0;controls.children[1].disabled=ply===0;
        controls.children[2].disabled=ply===moves.length;controls.lastChild.disabled=ply===moves.length;
      }
      controls.append(btn('⏮',()=>{ply=0;frame();}),btn('←',()=>{if(ply>0)ply--;frame();}),btn('→',()=>{if(ply<moves.length)ply++;frame();}),btn('⏭',()=>{ply=moves.length;frame();}));
      const result=entry.outcome.startsWith('White wins')?'1-0':entry.outcome.startsWith('Black wins')?'0-1':'1/2-1/2';
      game.setHeader('Result',result);
      section.append(btn('Export PGN',()=>EXPORT(game.pgn(),'global-chess-match.pgn','application/x-chess-pgn'),'primary'));
      frame();
    }
    if(route==='lessons'||route==='puzzles'){
      const set=route==='lessons'?lessons:puzzles;
      title('Interactive practice',route==='lessons'?'Chess lessons':'Tactical puzzles',route==='lessons'?'Learn piece movement, special moves and tactics.':'Offline positions with validated legal answers.');
      const completed=new Set(report().completed),list=mk('div','ch-feature-list');section.append(list);
      for(const x of set)card(list,x.title,completed.has(x.id)?'Completed · Replay to practice':x.prompt,()=>{exercise=x;go(route==='lessons'?'lesson':'puzzle');},completed.has(x.id)?'ch-done':'');
    }
    if(route==='lesson'||route==='puzzle'){
      const valid=route==='lesson'?lessons:puzzles;
      const x=valid.find(item=>item.id===exercise.id)||valid[0];
      exercise=x;
      title('Playable challenge',x.title,x.prompt);
      paragraph(section,'A real chessboard checks the legal solution. You can retry without losing saved progress.','ch-inline-notice');
      const actions=stack();actions.append(btn('Open interactive board',()=>openExercise(x),'primary'),btn('Back to collection',()=>go(route==='lesson'?'lessons':'puzzles')));
    }
    if(route==='puzzle-result'){
      title(lastSolved?'Correct solution':'Puzzle practice',lastSolved?.title||'No completed puzzle yet',lastSolved?.explanation||'Solve a legal puzzle first to see its verified explanation.');
      const buttons=stack();buttons.append(btn('More puzzles',()=>go('puzzles'),'primary'),btn('Learning hub',()=>go('learn')));
    }
    if(route==='daily'){
      exercise=dailyExercise();
      title('Offline daily practice','Daily challenge · '+days(),exercise.prompt);
      const done=report().daily.includes('daily-'+days());
      paragraph(section,done?'Already completed today. Replaying does not grant duplicate progress.':'The local-day challenge is deterministic and can be played without internet.','ch-inline-notice');
      section.append(btn('Play today’s puzzle',()=>openExercise(exercise),'primary'));
    }
    if(route==='progress'){
      title('Local player record','Your progress','All numbers are derived from saved games and completed exercises.');
      const p=report(),saved=records(),grid=mk('div','ch-stats-grid');section.append(grid);
      for(const [label,value] of [['Completed games',saved===null?'Unavailable':saved.length],['Lessons',p.completed.filter(x=>lessons.some(y=>y.id===x)).length+'/'+lessons.length],['Puzzles',p.completed.filter(x=>puzzles.some(y=>y.id===x)).length+'/'+puzzles.length],['Daily challenges',p.daily.length]]){
        const tile=mk('div','ch-stat');tile.append(mk('strong','',String(value)),mk('span','',label));grid.append(tile);
      }
      section.append(btn('Achievements',()=>go('achievements'),'primary'),btn('Match history',()=>go('history')));
    }
    if(route==='achievements'){
      title('Proven milestones','Achievements','Unlocks are computed from real local records, not simulated leaderboards.');
      const p=report(),seen=new Set(p.completed),count=records()?.length||0;
      const awards=[
        ['First Steps','Complete one practice exercise',p.completed.length>=1],
        ['Chess Basics','Complete all twelve lessons',lessons.every(x=>seen.has(x.id))],
        ['Tactics Starter','Complete all included puzzles',puzzles.every(x=>seen.has(x.id))],
        ['Daily Regular','Practice on three distinct days',p.daily.length>=3],
        ['Match Recorder','Finish a local match',count>0],
      ];
      const list=mk('div','ch-feature-list');section.append(list);
      for(const [name,desc,earned] of awards){
        const row=mk('div','ch-achievement '+(earned?'ch-unlocked':'ch-locked'));
        row.append(mk('span','ch-achievement-symbol',earned?'★':'◇'));
        const copy=mk('div');copy.append(mk('strong','',name),mk('small','',desc));
        row.append(copy,mk('span','ch-achievement-state',earned?'Earned':'Locked'));list.append(row);
      }
    }
    if(route==='appearance'){
      title('Original color treatments','Appearance','Three free chessboard looks. No fabricated shop or currency.');
      const grid=mk('div','ch-theme-grid');section.append(grid);
      for(const [name,title,detail] of [['maple','Classic Maple','Original warm maple'],['walnut','Royal Walnut','Deep brown for evening play'],['forest','Forest Teal','Green and warm ivory']]){
        const tile=mk('button','ch-theme-card'+(ls('global-chess.appearance.v1','maple')===name?' ch-selected':''));tile.type='button';
        tile.append(mk('span','ch-theme-preview ch-preview-'+name),mk('strong','',title),mk('small','',detail));
        tile.onclick=()=>{appearance(name);if(!save('global-chess.appearance.v1',name))paragraph(section,'Theme is temporary because local storage is unavailable.','ch-inline-notice ch-notice-warning');for(const child of grid.children)child.classList.toggle('ch-selected',child===tile);};
        grid.append(tile);
      }
      section.append(mk('h2','ch-section-title','Piece collection'));
      paragraph(section,'Choose between the existing classic artwork and the original SVG Crest set. Both are free.');
      const pieceGrid=mk('div','ch-piece-grid');section.append(pieceGrid);
      for(const [name,label,detail] of [['classic','Classic','Traditional dimensional pieces'],['crest','Royal Crest','Original ivory and oxblood SVG family']]){
        const item=mk('button','ch-piece-card'+(ls('global-chess.pieces.v1','classic')===name?' ch-selected':''));
        item.type='button';
        const preview=mk('img','ch-piece-example');preview.src=name==='crest'?'/brand/pieces/piece_white_knight.svg':'/chess-assets/pieces/white-knight.webp';
        preview.alt='';
        item.append(preview,mk('strong','',label),mk('small','',detail));
        item.onclick=()=>{
          if(!save('global-chess.pieces.v1',name))paragraph(section,'The piece choice will only last this session.','ch-inline-notice ch-notice-warning');
          document.documentElement.dataset.chPieces=name;
          window.dispatchEvent(new Event('chess-appearance-changed'));
          for(const child of pieceGrid.children)child.classList.toggle('ch-selected',child===item);
        };
        pieceGrid.append(item);
      }
      section.append(btn('Return to match',()=>go('match'),'primary'));
    }
    if(route==='settings'){
      title('On-device preferences','Settings','Controls apply immediately. Resetting display settings never deletes matches.');
      const options=mk('div','ch-option-list');section.append(options);
      for(const [name,detail,source] of [['Board coordinates','A–H and 1–8 labels','coordinate-setting'],['High contrast','Brighter board colors','contrast-setting']]){
        const row=mk('label','ch-setting-row'),copy=mk('span');
        copy.append(mk('strong','',name),mk('small','',detail));
        const input=mk('input');input.type='checkbox';input.checked=Boolean(el(source)?.checked);
        input.onchange=()=>{const target=el(source);if(target&&target.checked!==input.checked)target.click();};
        row.append(copy,input);options.append(row);
      }
      const motion=mk('label','ch-setting-row'),label=mk('span');
      label.append(mk('strong','','Reduce animation'),mk('small','','Disable decorative motion; operating system reduced-motion is also respected.'));
      const input=mk('input');input.type='checkbox';input.checked=ls('global-chess.reduce-motion.v1',false)===true;
      input.onchange=()=>{document.documentElement.classList.toggle('ch-reduce-motion',input.checked);save('global-chess.reduce-motion.v1',input.checked);};
      motion.append(label,input);options.append(motion);
      const nav=group();
      card(nav,'Appearance','Choose a board style',()=>go('appearance'));
      card(nav,'Data & privacy','Backups and local saves',()=>go('data'));
      card(nav,'Updates','PWA status and checking',()=>go('update'));
      card(nav,'About & notices','Build information and licenses',()=>go('about'));
      section.append(btn('Restore display defaults',()=>{
        if(!confirm('Restore display settings? Your saved matches stay.'))return;
        for(const source of ['coordinate-setting','contrast-setting'])if(el(source)?.checked)el(source).click();
        save('global-chess.reduce-motion.v1',false);document.documentElement.classList.remove('ch-reduce-motion');
        save('global-chess.appearance.v1','maple');appearance('maple');show('settings');
      }));
    }
    if(route==='data'||route==='transfer'){
      title('Private device storage',route==='data'?'Data & privacy':'Import & export','Clearing your browser data can permanently remove unsynced matches and lessons.');
      paragraph(section,'Global Chess currently stores your local chess progress on this device. No automatic cloud backup or account synchronization is promised.','ch-inline-notice');
      const nav=stack();
      nav.append(btn('Export JSON backup',()=>el('export-backup')?.click(),'primary'),btn('Import JSON backup',()=>el('import-backup')?.click()),btn('View saved games',()=>go('history')));
      if(route==='data')nav.append(btn('More backup information',()=>go('transfer')));
      else paragraph(section,'Import validates match moves and the backup format before replacing the current offline match and history.','ch-inline-notice');
    }
    if(route==='recovery'){
      title('Keep your data safe','Recovery',fault?'The last match save could not be written.':'If a save or asset fails, recover without clearing your board.');
      paragraph(section,'Do not clear browser data before exporting a backup. This screen does not delete or overwrite your saved game.','ch-inline-notice ch-notice-warning');
      const nav=stack();nav.append(btn('Export a backup',()=>el('export-backup')?.click(),'primary'),btn('Return to board',()=>go('match')),btn('Home',()=>go('home')));
    }
    if(route==='update'){
      title('Match-safe upgrades','PWA update','Finish or export your current game before refreshing.');
      const status=paragraph(section,'Use Check for update to look for downloaded assets.','ch-inline-notice');
      section.append(btn('Check for update',async()=>{
        if(!('serviceWorker' in navigator)){status.textContent='Service workers are not available in this browser.';return;}
        try{const reg=await navigator.serviceWorker.getRegistration();
          if(!reg){status.textContent='Offline service worker is not installed.';return;}
          await reg.update();status.textContent=reg.waiting?'New assets are downloaded. Finish your match, then reload the app.':'No downloaded update is waiting. You can keep playing.';
        }catch{status.textContent='Could not check right now. Your offline game remains available.';}
      },'primary'));
    }
    if(route==='about'){
      title('Original premium chess','About & licenses','A locally playable chess game built with established open-source engines.');
      const rows=mk('div','ch-license-list');section.append(rows);
      for(const [name,license,location] of [
        ['chess.js','BSD-2-Clause','https://github.com/jhlywa/chess.js'],
        ['Babylon.js','Apache-2.0','https://github.com/BabylonJS/Babylon.js'],
        ['Havok Babylon integration','MIT','https://github.com/BabylonJS/havok'],
        ['Mating-possibility WASM','MIT','/solver/LICENSE.txt'],
      ]){
        const row=mk('div','ch-license-row');
        row.append(mk('strong','',name),mk('small','',license));
        const link=mk('a','',location);link.href=location;link.target='_blank';link.rel='noopener noreferrer';row.append(link);rows.append(row);
      }
      paragraph(section,'This app does not claim verified online ranks or cloud sync. Formal Privacy Policy and Terms of Use require legal sign-off before public commercial launch.','ch-inline-notice ch-notice-warning');
      section.append(btn('Settings',()=>go('settings'),'primary'));
    }
    section.querySelector('h1')?.setAttribute('tabindex','-1');
  }
  window.addEventListener('chess-storage-error',()=>{
    fault=true;if(el('ch-storage-alert'))return;
    const alert=mk('div','ch-storage-alert','Your last game move could not be saved.');
    alert.id='ch-storage-alert';alert.setAttribute('role','alert');
    alert.append(btn('Recovery',()=>go('recovery'),'primary'),btn('Dismiss',()=>alert.remove()));
    main.prepend(alert);
  });
  window.addEventListener('chess-exercise-solved',event=>{
    if(!event.detail||event.detail.kind==='lesson')return;
    exercise=event.detail;
    lastSolved=event.detail;
    el('learn-dialog')?.close();
    go('puzzle-result');
  });
  if(ls('global-chess.reduce-motion.v1',false))document.documentElement.classList.add('ch-reduce-motion');
  return {routes:EXTRA_ROUTES,show,openExerciseById(x){exercise=x;}};
}
