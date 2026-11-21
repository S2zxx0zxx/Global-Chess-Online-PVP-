const key = 'global-chess.preferences.v1';
const avatars = ['♞','♜','♛'];

function loadPreferences() {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch { /* Guest play remains available. */ }
  return {};
}

export function bindLobby({startMatch, historyCount}) {
  const element = id => document.getElementById(id);
  const preferences = loadPreferences();
  const profile = element('profile-dialog');
  const settings = element('settings-dialog');
  const result = element('result-dialog');
  const welcome = element('welcome-dialog');

  function apply() {
    const name = typeof preferences.name === 'string' ? preferences.name.trim().slice(0,24) : '';
    const avatar = avatars.includes(preferences.avatar) ? preferences.avatar : avatars[0];
    element('guest-greeting').textContent = avatar + '  ' + (name || 'Guest player');
    document.documentElement.classList.toggle('show-coordinates', preferences.coordinates === true);
    document.documentElement.classList.toggle('high-contrast', preferences.contrast === true);
    return {name, avatar};
  }
  function persist() {
    let stored = true;
    try { localStorage.setItem(key, JSON.stringify(preferences)); }
    catch { stored = false; }
    apply();
    return stored;
  }
  function focusBoard() {
    element('match-area').focus();
  }
  // ZIP v3 SCR-04/SCR-05: selecting a mode opens editable match setup,
  // rather than silently starting an arbitrary opponent or player color.
  for (const preset of ['classic','quick']) {
    element('lobby-' + preset).onclick = () =>
      document.dispatchEvent(new CustomEvent('chess-open-setup',{detail:{format:preset}}));
  }
  element('lobby-computer').onclick = () =>
    document.dispatchEvent(new CustomEvent('chess-open-setup',{detail:{format:'computer'}}));
  element('lobby-online').onclick = () => {
    if (!element('online-leave').hidden) return focusBoard();
    element('online-create').click();
    element('online-status').scrollIntoView({block:'nearest'});
  };
  element('lobby-resume').onclick = focusBoard;
  element('profile-open').onclick = () => {
    const {name, avatar} = apply();
    element('guest-name').value = name;
    element('guest-avatar').value = avatar;
    const count = historyCount();
    element('profile-stats').textContent = count === null ? 'Match history unavailable' : 'Saved completed matches: ' + count;
    profile.showModal();
  };
  element('profile-form').onsubmit = event => {
    event.preventDefault();
    preferences.name = element('guest-name').value.trim();
    preferences.avatar = element('guest-avatar').value;
    persist();
    profile.close();
  };
  element('settings-open').onclick = () => {
    element('coordinate-setting').checked = preferences.coordinates === true;
    element('contrast-setting').checked = preferences.contrast === true;
    settings.showModal();
  };
  for (const [id, field] of [['coordinate-setting','coordinates'],['contrast-setting','contrast']]) {
    element(id).onchange = event => {
      preferences[field] = event.target.checked;
      persist();
    };
  }
  element('result-open').onclick = () => result.showModal();
  element('result-rematch').onclick = () => {result.close();element('rematch').click();};
  element('result-history').onclick = () => {result.close();element('history-button').click();};
  welcome.addEventListener('close', () => {
    if (welcome.returnValue !== 'guest') return;
    if (!preferences.localId) {
      preferences.localId = 'guest-' + (typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(value => value.toString(16).padStart(2,'0')).join(''));
    }
    preferences.welcomed = true;
    if (!persist()) window.dispatchEvent(new Event('chess-storage-error'));
  });
  if (!preferences.welcomed && !new URLSearchParams(location.hash.slice(1)).has('invite')) welcome.showModal();
  apply();

  return {
    render({outcome, turn, mode, playerSide = 'w', online, started}) {
      element('lobby-resume').hidden = !started || Boolean(outcome);
      element('result-open').hidden = !outcome;
      element('result-copy').textContent = outcome ?? '';
      element('result-rematch').hidden = online;
      element('black-player').textContent = !online && mode === 'computer' && playerSide === 'w' ? 'Computer · Black' : 'Black';
      element('white-player').textContent = !online && mode === 'computer' && playerSide === 'b' ? 'Computer · White' : 'White';
      for (const [label, side] of [['black','b'],['white','w']]) {
        const active = !outcome && started && turn === side;
        element(label + '-panel').classList.toggle('active-player', active);
        element(label + '-turn').textContent = active ? 'To move' : '';
      }
    },
  };
}
