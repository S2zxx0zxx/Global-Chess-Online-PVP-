import { applyMove, advanceClock, createMatch, startMatch } from './match.js';

const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const token = () => crypto.randomUUID();
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/rooms' && request.method === 'POST') {
      const id = token();
      return env.ROOMS.getByName(id).fetch(new Request('https://room/create', {
        method: 'POST', body: JSON.stringify({id}),
      }));
    }
    const route = /^\/api\/rooms\/([^/]+)\/(join|state|move)$/.exec(path);
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

  async fetch(request) {
    const action = new URL(request.url).pathname.slice(1);
    let input;
    if (action !== 'state') {
      const raw = await request.text();
      if (raw.length > 2048) return json({error:'Request too large'}, 413);
      try { input = JSON.parse(raw); } catch { return json({error:'Invalid request'}, 400); }
      if (!input || typeof input !== 'object') return json({error:'Invalid request'}, 400);
    }
    const credential = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
    return this.storage.transaction(async transaction => {
      const now = Date.now();
      const room = await transaction.get('room');
      if (action === 'create') {
        if (room) return json({error:'Room already exists'}, 409);
        const state = {id:input.id, invite:token(), w:token(), b:null, match:createMatch(), created:now};
        await transaction.put('room', state);
        return json({id:state.id, invite:state.invite, seat:'w', credential:state.w, match:state.match, serverNow:now}, 201);
      }
      if (!room || now - room.created >= 86_400_000) return json({error:'Room unavailable'}, 404);
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
        : {match:advanceClock(room.match, now)};
      if (update.match !== room.match) {
        room.match = update.match;
        await transaction.put('room', room);
      }
      return json({id:room.id, seat, ...update, serverNow:now}, update.error ? 409 : 200);
    });
  }
}
