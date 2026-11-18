import { applyDrawClaim, applyMove, advanceClock, createMatch, startMatch } from './match.js';

const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const token = () => crypto.randomUUID();
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

const maxJsonBytes = 2048;
const roomLifetimeMs = 86_400_000;

async function readRoomInput(request) {
  if (Number(request.headers.get('Content-Length')) > maxJsonBytes) return null;
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const data = new Uint8Array(maxJsonBytes);
  let size = 0;
  try {
    for (;;) {
      const {done,value} = await reader.read();
      if (done) break;
      if (size + value.byteLength > maxJsonBytes) {
        await reader.cancel();
        return null;
      }
      data.set(value,size);
      size += value.byteLength;
    }
    const input = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data.subarray(0,size)));
    return input && typeof input === 'object' && !Array.isArray(input) ? input : undefined;
  } catch {
    return undefined;
  } finally {
    reader.releaseLock();
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/rooms' && request.method === 'POST') {
      const address = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      if (env.ROOM_CREATION_LIMIT && !(await env.ROOM_CREATION_LIMIT.limit({key:address})).success) {
        return json({error:'Too many rooms created. Try again shortly.'},429);
      }
      const id = token();
      return env.ROOMS.getByName(id).fetch(new Request('https://room/create', {
        method: 'POST', body: JSON.stringify({id}),
      }));
    }
    const route = /^\/api\/rooms\/([^/]+)\/(join|state|move|claim)$/.exec(path);
    if (!route || !uuid.test(route[1])) return json({error:'Not found'}, 404);
    const [,id,action] = route;
    if (request.method !== (action === 'state' ? 'GET' : 'POST')) {
      return json({error:'Method not allowed'}, 405);
    }
    return env.ROOMS.getByName(id).fetch(new Request('https://room/' + action, request));
  },
};

export class Room {
  constructor(ctx) {
    this.storage = ctx.storage;
  }

  async alarm() {
    await this.storage.transaction(async transaction => {
      const room = await transaction.get('room');
      if (!room) return;
      const expiresAt = room.created + roomLifetimeMs;
      if (Date.now() < expiresAt) await transaction.setAlarm(expiresAt);
      else await transaction.delete('room');
    });
  }

  async fetch(request) {
    const action = new URL(request.url).pathname.slice(1);
    let input;
    if (action !== 'state') {
      input = await readRoomInput(request);
      if (input === null) return json({error:'Request too large'}, 413);
      if (input === undefined) return json({error:'Invalid request'}, 400);
    }
    const credential = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
    return this.storage.transaction(async transaction => {
      const now = Date.now();
      const room = await transaction.get('room');
      if (action === 'create') {
        if (room) return json({error:'Room already exists'}, 409);
        const state = {id:input.id, invite:token(), w:token(), b:null, match:createMatch(), created:now};
        await transaction.put('room', state);
        await transaction.setAlarm(now + roomLifetimeMs);
        return json({id:state.id, invite:state.invite, seat:'w', credential:state.w, match:state.match, serverNow:now}, 201);
      }
      if (!room) return json({error:'Room unavailable'}, 404);
      const expiresAt = room.created + roomLifetimeMs;
      if (now >= expiresAt) {
        await transaction.delete('room');
        return json({error:'Room unavailable'}, 404);
      }
      if (await transaction.getAlarm() === null) await transaction.setAlarm(expiresAt);
      if (action === 'join') {
        if (!room.invite || input.invite !== room.invite) return json({error:'Invalid invite'}, 403);
        if (room.b) return json({error:'Room full'}, 409);
        room.b = token();
        room.invite = null;
        room.match = startMatch(room.match, now);
        await transaction.put('room', room);
        return json({id:room.id, seat:'b', credential:room.b, match:room.match, serverNow:now});
      }
      const seat = credential && (credential === room.w ? 'w' : credential === room.b ? 'b' : null);
      if (!seat) return json({error:'Seat authorization required'}, 401);
      const update = action === 'move'
        ? applyMove(room.match, seat, input, now)
        : action === 'claim'
          ? applyDrawClaim(room.match, seat, input, now)
          : {match:advanceClock(room.match, now)};
      if (update.match !== room.match) {
        room.match = update.match;
        await transaction.put('room', room);
      }
      return json({id:room.id, seat, ...update, serverNow:now}, update.error ? 409 : 200);
    });
  }
}
