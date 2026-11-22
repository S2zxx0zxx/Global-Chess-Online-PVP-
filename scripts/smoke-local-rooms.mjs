import assert from 'node:assert/strict';

const origin = new URL(process.env.CHESS_LOCAL_WORKER ?? 'http://127.0.0.1:8787');
if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1') {
  throw new Error('This smoke test creates data only on a loopback Worker');
}

async function request(path, {body, credential, status = 200} = {}) {
  const response = await fetch(new URL(path, origin), {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(body === undefined ? {} : {'Content-Type':'application/json'}),
      ...(credential ? {Authorization:'Bearer ' + credential} : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, status, 'Unexpected room response status');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  return response.json();
}

const shell = await fetch(origin, {signal:AbortSignal.timeout(10000)});
assert.equal(shell.status, 200);
assert.match(shell.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);

const white = await request('/api/rooms', {body:{}, status:201});
const route = '/api/rooms/' + white.id;
const black = await request(route + '/join', {body:{invite:white.invite}});
assert.equal(white.seat, 'w');
assert.equal(black.seat, 'b');
assert.notEqual(white.credential, black.credential);
await request(route + '/state', {status:401});

const whiteMove = await request(route + '/move', {
  credential:white.credential,
  body:{from:'e2', to:'e4', expectedVersion:black.match.version},
});
const blackReconnect = await request(route + '/state', {credential:black.credential});
assert.deepEqual(blackReconnect.match.moves, [{from:'e2',to:'e4'}]);
assert.equal(blackReconnect.match.version, whiteMove.match.version);

const resignation = await request(route + '/resign', {
  credential:white.credential,
  body:{expectedVersion:whiteMove.match.version},
});
const reconnectedWhite = await request(route + '/state', {credential:white.credential});
const reconnectedBlack = await request(route + '/state', {credential:black.credential});
assert.equal(resignation.match.outcome, 'Black wins by resignation');
assert.deepEqual(reconnectedWhite.match, reconnectedBlack.match);
assert.deepEqual(reconnectedWhite.match, resignation.match);
console.log('Local Worker: static CSP, two seats, legal move, reconnect and authoritative resignation passed');
