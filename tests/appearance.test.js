import test from 'node:test';
import assert from 'node:assert/strict';
import {ANIMATED_THEMES,BOARD_THEMES,PIECE_THEMES,applyBoardTheme,applyPieceTheme} from '../src/appearance.js';
import {renderPieceArt} from '../src/piece-art.js';

function fakeDocument(){
  const classes=new Set();
  const root={dataset:{},classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}};
  return {
    root,classes,
    document:{
      baseURI:'http://localhost:5173/',documentElement:root,
      createElement:tag=>({tag,attributes:{},setAttribute(name,value){this.attributes[name]=value;}}),
    },
    cell:()=>({classes:new Set(),children:[],classList:{add(...names){names.forEach(name=>this.owner.classes.add(name));}},append(child){this.children.push(child);}}),
  };
}

test('five animated board and piece choices coexist with the original choices',()=>{
  assert.equal(new Set(BOARD_THEMES.map(x=>x.id)).size,BOARD_THEMES.length);
  assert.equal(new Set(PIECE_THEMES.map(x=>x.id)).size,PIECE_THEMES.length);
  assert.equal(ANIMATED_THEMES.length,5);
  for(const name of ANIMATED_THEMES){
    assert.ok(BOARD_THEMES.some(x=>x.id===name));
    assert.ok(PIECE_THEMES.some(x=>x.id===name));
  }
});

test('selection applies safely and adds an aura only for animated artwork',()=>{
  const original=globalThis.document;
  const fake=fakeDocument();
  globalThis.document=fake.document;
  const makeCell=()=>{
    const cell=fake.cell();cell.classList.owner=cell;return cell;
  };
  const names={k:'King',n:'Knight'};
  try{
    applyBoardTheme('ember');applyPieceTheme('ember');
    assert.equal(fake.root.dataset.chTheme,'ember');
    assert.equal(fake.root.dataset.chPieces,'ember');
    assert.ok(fake.classes.has('ch-animated-pieces'));
    const fire=makeCell();renderPieceArt(fire,{color:'w',type:'n'},names);
    assert.deepEqual([...fire.classes],['has-piece','piece-white','piece-n']);
    assert.deepEqual(fire.children.map(x=>x.tag),['span','img']);
    assert.match(fire.children[1].src,/piece_white_knight\.svg$/);
    assert.equal(fire.children[0].attributes['aria-hidden'],'true');

    applyBoardTheme('unknown');applyPieceTheme('classic');
    assert.equal(fake.root.dataset.chTheme,'maple');
    assert.equal(fake.root.dataset.chPieces,'classic');
    assert.equal(fake.classes.has('ch-animated-pieces'),false);
    const classic=makeCell();renderPieceArt(classic,{color:'b',type:'k'},names);
    assert.deepEqual(classic.children.map(x=>x.tag),['img']);
    assert.match(classic.children[0].src,/piece_black_king\.svg$/);
  }finally{globalThis.document=original;}
});
