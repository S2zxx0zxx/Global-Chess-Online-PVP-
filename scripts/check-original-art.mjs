import {readdirSync,statSync,existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const dist=new URL('../dist/',import.meta.url);
const brand=new URL('brand/',dist);
const old=new URL('chess-assets/',dist);
if(existsSync(old))throw Error('Blocked release: unverified legacy bitmap directory is packaged');
const board=new URL('board-maple-walnut.svg',brand);
if(!existsSync(board)||statSync(board).size<1500)throw Error('Missing original board SVG');
for(const color of ['white','black']){
  for(const type of ['king','queen','rook','bishop','knight','pawn']){
    const path=new URL('pieces/piece_'+color+'_'+type+'.svg',brand);
    if(!existsSync(path)||statSync(path).size<300)throw Error('Missing original chess piece '+path);
  }
}
const jsfiles=readdirSync(new URL('assets/',dist)).filter(s=>s.endsWith('.js'));
for(const file of jsfiles){
  const text=readFileSync(new URL('assets/'+file,dist),'utf8');
  if(text.includes('/chess-assets/'))throw Error('Release JavaScript still references unverified legacy art: '+file);
}
const sw=readFileSync(new URL('sw.js',dist),'utf8');
if(sw.includes('chess-assets/'))throw Error('Service worker still caches unverified legacy art');
console.log('Verified original 2D/3D board + 12 vector pieces; no legacy WebP assets or references shipped');
