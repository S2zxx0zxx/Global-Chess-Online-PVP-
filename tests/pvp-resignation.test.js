import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,startMatch,applyResign,applyMove} from '../server/match.js';
import worker,{Room} from '../server/worker.js';

test('private match resignation is server-owned, turn-independent, and idempotent',()=>{
  const match=startMatch(createMatch('quick'),1000);
  assert.equal(match.version,1);
  const rejected=applyResign(match,'b',{expectedVersion:0},1600);
  assert.equal(rejected.error,'Position changed');
  assert.equal(rejected.match.version,1);
  const granted=applyResign(match,'b',{expectedVersion:1},1600);
  assert.equal(granted.match.outcome,'White wins by resignation');
  assert.equal(granted.match.version,2);
  assert.equal(granted.match.moves.length,0);
  assert.equal(applyResign(granted.match,'w',{expectedVersion:2},1700).error,'Match ended');
  assert.equal(applyMove(granted.match,'w',{expectedVersion:2,from:'e2',to:'e4'},1800).error,'Match ended');
});

test('durable room rejects unauthenticated resign and persists winner across instances',async()=>{
  const records=new Map();
  const storage={transaction:fn=>fn({
    get:key=>structuredClone(records.get(key)),
    put:(key,value)=>records.set(key,structuredClone(value)),
    delete:key=>records.delete(key),
    setAlarm:t=>records.set('alarm',t),
    getAlarm:()=>records.get('alarm')??null,
  })};
  let room=new Room({storage});
  const call=(action,body,credential)=>room.fetch(new Request('https://room/'+action,{
    method:body?'POST':'GET',
    body:body?JSON.stringify(body):undefined,
    headers:credential?{Authorization:'Bearer '+credential}:undefined,
  }));
  const creator=await (await call('create',{id:crypto.randomUUID()})).json();
  const second=await (await call('join',{invite:creator.invite})).json();
  const request={expectedVersion:second.match.version};
  assert.equal((await call('resign',request)).status,401);
  assert.equal((await call('resign',request,'invalid')).status,401);
  const won=await call('resign',request,second.credential);
  assert.equal(won.status,200);
  assert.equal((await won.json()).match.outcome,'White wins by resignation');
  assert.equal((await call('resign',request,creator.credential)).status,409);
  room=new Room({storage});
  const state=await (await call('state',undefined,creator.credential)).json();
  assert.equal(state.match.outcome,'White wins by resignation');
});

test('worker routes authenticated PvP resignation only for valid room UUIDs',async()=>{
  const id='11111111-2222-4333-8444-555555555555';
  let forwarded;
  const env={ROOMS:{getByName:name=>({fetch:async req=>{
    forwarded={id:name,path:new URL(req.url).pathname,auth:req.headers.get('Authorization')};
    return Response.json({ok:true});
  }})}};
  const bad=await worker.fetch(new Request('https://game.test/api/rooms/not-valid/resign',{method:'POST'}),env);
  assert.equal(bad.status,404);
  const accepted=await worker.fetch(new Request('https://game.test/api/rooms/'+id+'/resign',{
    method:'POST',headers:{Authorization:'Bearer secret'},body:'{}',
  }),env);
  assert.equal(accepted.status,200);
  assert.deepEqual(forwarded,{id,path:'/resign',auth:'Bearer secret'});
});
