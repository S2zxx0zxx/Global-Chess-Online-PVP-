import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { Room } from '../server/worker.js';

test('invite is single-use and both seats recover the persisted match', async () => {
  const records = new Map();
  const storage = {transaction: fn => fn({
    get: key => structuredClone(records.get(key)),
    put: (key, value) => records.set(key, structuredClone(value)),
    setAlarm: time => records.set('alarm',time),
    getAlarm: () => records.get('alarm') ?? null,
    delete: key => records.delete(key),
  })};
  let room = new Room({storage});
  const call = (action, body, credential) => room.fetch(new Request('https://room/' + action, {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
    headers: credential ? {Authorization:'Bearer ' + credential} : undefined,
  }));
  const white = await (await call('create', {id:crypto.randomUUID()})).json();
  assert.equal((await call('join',{invite:'wrong'})).status,403);
  const black = await (await call('join',{invite:white.invite})).json();
  assert.equal((await call('join',{invite:white.invite})).status,403);
  assert.equal((await call('state')).status,401);
  const command = {expectedVersion:black.match.version,from:'e2',to:'e4'};
  assert.equal((await call('move',command,black.credential)).status,409);
  assert.equal((await call('move',command,white.credential)).status,200);
  room = new Room({storage});
  const recovered = await (await call('state',undefined,black.credential)).json();
  assert.equal(recovered.match.moves[0].to,'e4');
  assert.equal(recovered.credential,undefined);

  let version = recovered.match.version;
  const cycle = [['g8','f6'],['g1','f3'],['f6','g8'],['f3','g1']];
  for (const [index,[from,to]] of [...cycle,...cycle.slice(0,3)].entries()) {
    const credential = index % 2 ? white.credential : black.credential;
    const response = await call('move',{from,to,expectedVersion:version},credential);
    assert.equal(response.status,200);
    version = (await response.json()).match.version;
  }
  const draw = {expectedVersion:version,move:{from:'f3',to:'g1'}};
  assert.equal((await call('claim',draw,black.credential)).status,409);
  const accepted = await call('claim',draw,white.credential);
  assert.equal(accepted.status,200);
  assert.equal((await accepted.json()).match.outcome,'Draw by threefold repetition');
  room = new Room({storage});
  const final = await (await call('state',undefined,black.credential)).json();
  assert.equal(final.match.outcome,'Draw by threefold repetition');
  assert.equal(final.match.moves.at(-1).to,'g8');
  assert.equal((await call('claim',draw,white.credential)).status,409);
});

test('room input limit is enforced before touching room storage', async () => {
  const room = new Room({storage:{
    transaction() { throw new Error('A rejected request must not touch room storage'); },
  }});
  const body = JSON.stringify({invite:'é'.repeat(1100)});
  const response = await room.fetch(new Request('https://room/join',{method:'POST',body}));
  assert.equal(response.status,413);
  const malformed = await room.fetch(new Request('https://room/join',{method:'POST',body:'[]'}));
  assert.equal(malformed.status,400);
});


test('rejected room creation does not allocate a Durable Object', async () => {
  const response = await worker.fetch(new Request('https://chess.test/api/rooms',{method:'POST'}),{
    ROOM_CREATION_LIMIT:{limit:async () => ({success:false})},
    ROOMS:{getByName() { throw new Error('Rate-limited request allocated a room'); }},
  });
  assert.equal(response.status,429);
});


test('room alarms preserve active matches and purge expired room data', async t => {
  const now = 1_800_000_000_000;
  t.mock.method(Date,'now',() => now);
  const records = new Map();
  const room = new Room({storage:{transaction: fn => fn({
    get: key => records.get(key),
    put: (key,value) => records.set(key,value),
    delete: key => records.delete(key),
    getAlarm: () => records.get('alarm') ?? null,
    setAlarm: time => records.set('alarm',time),
  })}});
  const day = 86_400_000;
  const created = await room.fetch(new Request('https://room/create',{
    method:'POST',body:JSON.stringify({id:crypto.randomUUID()}),
  }));
  assert.equal(created.status,201);
  assert.equal(records.get('alarm'),now+day);
  await room.alarm();
  assert.ok(records.has('room'));

  records.delete('alarm');
  const legacy = await room.fetch(new Request('https://room/state'));
  assert.equal(legacy.status,401);
  assert.equal(records.get('alarm'),now+day);

  records.get('room').created = now-day;
  await room.alarm();
  assert.equal(records.has('room'),false);
  await room.alarm();
  assert.equal((await room.fetch(new Request('https://room/state'))).status,404);
});

test('room creation fails closed if its rate limiter is unavailable', async () => {
  const guard = {getByName() {throw new Error('A missing limiter allocated a room');}};
  const req = () => new Request('https://chess.test/api/rooms',{method:'POST'});
  assert.equal((await worker.fetch(req(),{ROOMS:guard})).status,503);
  assert.equal((await worker.fetch(req(),{
    ROOMS:guard,
    ROOM_CREATION_LIMIT:{limit:async () => {throw new Error('Quota service unavailable');}},
  })).status,503);
});

