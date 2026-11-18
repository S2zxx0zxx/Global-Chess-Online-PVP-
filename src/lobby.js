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
    try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Preferences still apply in this session. */ }
    apply();
  }
  function focusBoard() {
    element('match-area').focus();
  }
  for (const preset of ['classic','quick']) {
    element('lobby-' + preset).onclick = () => {
      if (startMatch('local',preset,'standard')) focusBoard();
    };
  }
  element('lobby-computer').onclick = () => {
    if (startMatch('computer',element('preset').value,element('difficulty').value)) focusBoard();
  };
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
  welcome.addEventListener('close', () => { preferences.welcomed = true; persist(); });
  if (!preferences.welcomed && !new URLSearchParams(location.hash.slice(1)).has('invite')) welcome.showModal();
  apply();

  return {
    render({outcome, turn, mode, online, started}) {
      element('lobby-resume').hidden = !started || Boolean(outcome);
      element('result-open').hidden = !outcome;
      element('result-copy').textContent = outcome ?? '';
      element('result-rematch').hidden = online;
      element('black-player').textContent = !online && mode === 'computer' ? 'Computer · Black' : 'Black';
      for (const [label, side] of [['black','b'],['white','w']]) {
        const active = !outcome && started && turn === side;
        element(label + '-panel').classList.toggle('active-player', active);
        element(label + '-turn').textContent = active ? 'To move' : '';
      }
    },
  };
}
