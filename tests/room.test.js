import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/worker.js';

test('invite is single-use and both seats recover the persisted match', async () => {
  const records = new Map();
  const storage = {transaction: fn => fn({
    get: key => structuredClone(records.get(key)),
    put: (key, value) => records.set(key, structuredClone(value)),
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
});
