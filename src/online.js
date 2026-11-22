const storageKey = 'global-chess.online-seat.v1';

export function bindOnline({onMatch, onLeave}) {
  const byId = id => document.getElementById('online-' + id);
  const status = byId('status');
  const invite = byId('invite');
  let session;
  let snapshot;
  let receivedAt;
  let timer;
  let submitting = false;
  let pending = false;
  let generation = 0;

  function savedSeat() {
    for (const read of [() => sessionStorage.getItem(storageKey), () => localStorage.getItem(storageKey)]) {
      try {
        const saved = JSON.parse(read());
        if (saved && typeof saved.id === 'string' && typeof saved.credential === 'string' &&
            ['w','b'].includes(saved.seat)) return saved;
      } catch { /* Try the other store. */ }
    }
    return null;
  }

  async function request(path, body, credential) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (credential) headers.Authorization = 'Bearer ' + credential;
    const response = await fetch('/api/rooms' + path, {
      method: body ? 'POST' : 'GET', headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Private rooms require a connected room server.');
    }
    const data = await response.json();
    if (!response.ok && !data.match) throw new Error(data.error ?? 'Room unavailable.');
    return data;
  }

  function accept(data) {
    if (snapshot && (data.match.version < snapshot.match.version ||
        (data.match.version === snapshot.match.version && data.serverNow < snapshot.serverNow))) return;
    const changed = data.match.version !== snapshot?.match.version;
    snapshot = data;
    receivedAt = performance.now();
    if (changed) onMatch(data.match);
    status.textContent = data.error ?? data.match.outcome ??
      (data.match.turnStartedAt === null ? 'Waiting for your friend…' : 'You are ' + (session.seat === 'w' ? 'White' : 'Black'));
  }

  async function poll() {
    const current = generation;
    try {
      const data = await request('/' + session.id + '/state', undefined, session.credential);
      if (current === generation) accept(data);
    } catch {
      if (current === generation) status.textContent = 'Connection interrupted. Reconnecting…';
    } finally {
      if (current === generation && !snapshot?.match.outcome) timer = setTimeout(poll, document.hidden ? 8000 : 2000);
    }
  }

  function enter(data, saved = data) {
    session = {id:saved.id, credential:saved.credential, seat:saved.seat, invite:saved.invite};
    const encoded = JSON.stringify(session);
    try { sessionStorage.setItem(storageKey,encoded); } catch { /* Current tab can still play. */ }
    try { localStorage.setItem(storageKey,encoded); } catch { /* Tab storage can still resume. */ }
    byId('create').hidden = true;
    byId('rejoin').hidden = true;
    byId('leave').hidden = false;
    if (session.invite) {
      const url = new URL(location.href);
      url.hash = new URLSearchParams({room:session.id, invite:session.invite});
      invite.href = url.href;
      invite.hidden = false;
      byId('copy').hidden = !navigator.clipboard;
    }
    accept(data);
    if (!snapshot.match.outcome) timer = setTimeout(poll, 1000);
  }

  function run(action) {
    return async () => {
      if (pending || session) return;
      pending = true;
      status.textContent = 'Connecting to the room service?';
      try { await action(); }
      catch (error) { status.textContent = error.message; }
      finally { pending = false; }
    };
  }
  byId('create').onclick = run(async () => enter(await request('', {})));
  byId('rejoin').onclick = run(async () => {
    const saved = savedSeat();
    if (!saved) throw new Error('No saved room seat was found.');
    enter(await request('/' + saved.id + '/state', undefined, saved.credential), saved);
  });
  byId('copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(invite.href);
      status.textContent = 'Invite copied.';
    } catch {
      status.textContent = 'Copy the invite using the link.';
    }
  };
  byId('leave').onclick = () => {
    generation++;
    clearTimeout(timer);
    session = snapshot = undefined;
    submitting = false;
    byId('leave').hidden = invite.hidden = byId('copy').hidden = true;
    byId('create').hidden = false;
    byId('rejoin').hidden = !savedSeat();
    status.textContent = '';
    onLeave();
  };

  const params = new URLSearchParams(location.hash.slice(1));
  if (params.has('room') && params.has('invite')) {
    queueMicrotask(run(async () => {
      const data = await request('/' + encodeURIComponent(params.get('room')) + '/join', {invite:params.get('invite')});
      history.replaceState(null, '', location.pathname + location.search);
      enter(data);
    }));
  }
  byId('rejoin').hidden = !savedSeat();

  function canMove(side) {
    return Boolean(snapshot && !submitting && snapshot.match.turnStartedAt !== null &&
      !snapshot.match.outcome && session.seat === side &&
      (snapshot.match.moves.length % 2 ? 'b' : 'w') === side);
  }

  async function submit(action, command) {
    if (!snapshot || !canMove(session.seat)) return;
    submitting = true;
    const current = generation;
    try {
      const data = await request('/' + session.id + '/' + action,
        {...command, expectedVersion:snapshot.match.version}, session.credential);
      if (current === generation) accept(data);
    } catch {
      if (current === generation) status.textContent = 'Server response lost. Checking server position…';
    } finally {
      if (current === generation) submitting = false;
    }
  }

  return {
    get active() {return Boolean(snapshot);},
    get match() {return snapshot?.match;},
    canMove,
    remaining(side) {
      const {match, serverNow} = snapshot;
      const running = match.moves.length % 2 ? 'b' : 'w';
      if (match.outcome || running !== side || match.turnStartedAt === null) return match.clock[side];
      return Math.max(0, match.clock[side] - Math.max(0, serverNow - match.turnStartedAt) - (performance.now() - receivedAt));
    },
    move({from,to,promotion}) { return submit('move',{from,to,promotion}); },
    claim(move) { return submit('claim',{move}); },
  };
}
