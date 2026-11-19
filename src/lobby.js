import { navigate } from './navigation.js';
const key = 'global-chess.preferences.v1';
const avatars = ['♞','♜','♛'];

function loadPreferences() {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch { /* Guest play remains available. */ }
  return {};
}

export function bindLobby({startMatch, historyCount, historySummary, practiceSummary}) {
  const element = id => document.getElementById(id);
  const preferences = loadPreferences();
  const profile = element('profile-dialog');
  const settings = element('settings-dialog');
  const result = element('result-dialog');
  const welcome = element('welcome-dialog');

  function refreshStats() {
    const count = historyCount();
    element('profile-hub-stats').textContent = count === null ? 'Local match history unavailable.'
      : count + (count === 1 ? ' completed game saved locally.' : ' completed games saved locally.');
    let stats = null;
    try { stats = historySummary(); } catch { /* Do not invent missing game statistics. */ }
    for (const [id,value] of [
      ['profile-computer-games',stats?.computer],
      ['profile-wins',stats?.wins],
      ['profile-win-rate',stats ? stats.winRate + '%' : null],
      ['profile-streak',stats?.currentWinStreak],
    ]) element(id).textContent = value ?? '—';
    try {
      const progress=practiceSummary();
      for(const [id,value] of [['profile-xp',progress.xp],['profile-lessons',progress.lessonsSolved],['profile-puzzles',progress.puzzlesSolved],['profile-daily',progress.dailySolved]]) element(id).textContent=String(value);
      element('profile-achievements').textContent = progress.achievements.length ? 'Unlocked: '+progress.achievements.join(' · ') : 'Solve your first exercise to earn your first achievement.';
    } catch {
      element('profile-progress-summary').textContent='Progress needs recovery; existing match history is unaffected.';
      for (const id of ['profile-xp','profile-lessons','profile-puzzles','profile-daily']) element(id).textContent='—';
    }
  }
  function apply() {
    const name = typeof preferences.name === 'string' ? preferences.name.trim().slice(0,24) : '';
    const avatar = avatars.includes(preferences.avatar) ? preferences.avatar : avatars[0];
    element('guest-greeting').textContent = name || 'Guest player';
    element('profile-hub-name').textContent = name || 'Guest player';
    element('profile-hub-avatar').textContent = avatar;
    element('profile-local-id').textContent = preferences.localId ? 'Local ID · ' + preferences.localId.slice(0,8) : 'Guest on this device';
    refreshStats();
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
  // Home hero starts quickly; Play Hub separates format, opponent and side.
  for (const preset of ['classic','quick']) {
    element('lobby-' + preset).onclick = () => {
      if (startMatch('local',preset,'standard','w')) focusBoard();
    };
    element('play-' + preset).onclick = () => {
      element('setup-format').value = preset;
      updateSetup();
      element('play-setup-title').scrollIntoView({block:'nearest',behavior:'smooth'});
    };
  }
  element('lobby-computer').onclick = () => {
    if (startMatch('computer',element('preset').value,element('difficulty').value,'w')) focusBoard();
  };
  element('play-computer').onclick = () => { element('setup-opponent').value = 'computer'; updateSetup(); };
  element('play-local').onclick = () => { element('setup-opponent').value = 'local'; updateSetup(); };
  function updateSetup() {
    const isComputer = element('setup-opponent').value === 'computer';
    element('setup-difficulty').disabled = !isComputer;
    element('setup-side').disabled = !isComputer;
    for (const [button,value] of [['play-classic','classic'],['play-quick','quick']]) {
      element(button).classList.toggle('is-selected',element('setup-format').value === value);
      element(button).setAttribute('aria-pressed',String(element('setup-format').value === value));
    }
    for (const [button,value] of [['play-computer','computer'],['play-local','local']]) {
      element(button).classList.toggle('is-selected',element('setup-opponent').value === value);
      element(button).setAttribute('aria-pressed',String(element('setup-opponent').value === value));
    }
  }
  for (const id of ['setup-format','setup-opponent']) element(id).onchange = updateSetup;
  element('play-setup-form').onsubmit = event => {
    event.preventDefault();
    const preset = element('setup-format').value;
    const mode = element('setup-opponent').value;
    const difficulty = element('setup-difficulty').value;
    const rawSide = mode === 'computer' ? element('setup-side').value : 'w';
    const side = rawSide === 'random'
      ? (crypto.getRandomValues(new Uint8Array(1))[0] & 1 ? 'b' : 'w') : rawSide;
    if (!['untimed','classic','quick'].includes(preset) || !['computer','local'].includes(mode) ||
        !['easy','standard','hard'].includes(difficulty) || !['w','b'].includes(side)) {
      element('play-setup-title').textContent = 'Please choose a valid match setup';
      return;
    }
    if (startMatch(mode,preset,difficulty,side)) focusBoard();
  };
  updateSetup();
  element('lobby-online').onclick = () => {
    if (!element('online-leave').hidden) return focusBoard();
    element('online-create').click();
    element('online-status').scrollIntoView({block:'nearest'});
  };
  element('lobby-resume').onclick = () => {
    navigate('match');
    focusBoard();
  };
  const openProfile = () => {
    const {name, avatar} = apply();
    element('guest-name').value = name;
    element('guest-avatar').value = avatar;
    const count = historyCount();
    element('profile-stats').textContent = count === null ? 'Match history unavailable' : 'Saved completed matches: ' + count;
    profile.showModal();
  };
  element('profile-open').onclick = openProfile;
  element('profile-edit').onclick = openProfile;
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
  document.addEventListener('chess-screen-changed',event => {
    if(event.detail?.view === 'profile') refreshStats();
  });
  element('result-open').onclick = () => result.showModal();
  element('result-rematch').onclick = () => {result.close();element('rematch').click();};
  element('result-history').onclick = () => {result.close();element('history-button').click();};
  welcome.addEventListener('close', () => {
    if (!preferences.localId) preferences.localId = crypto.randomUUID();
    preferences.welcomed = true;
    persist();
  });
  if (!preferences.welcomed && !new URLSearchParams(location.hash.slice(1)).has('invite')) welcome.showModal();
  apply();

  return {
    render({outcome, turn, mode, online, started, humanSide = 'w'}) {
      refreshStats();
      element('lobby-resume').hidden = !started || Boolean(outcome);
      element('result-open').hidden = !outcome;
      element('result-copy').textContent = outcome ?? '';
      element('result-rematch').hidden = online;
      element('black-player').textContent = !online && mode === 'computer'
        ? (humanSide === 'b' ? 'You · Black' : 'Computer · Black') : 'Black';
      element('white-player').textContent = !online && mode === 'computer'
        ? (humanSide === 'w' ? 'You · White' : 'Computer · White') : 'White';
      for (const [label, side] of [['black','b'],['white','w']]) {
        const active = !outcome && started && turn === side;
        element(label + '-panel').classList.toggle('active-player', active);
        element(label + '-turn').textContent = active ? 'To move' : '';
      }
    },
  };
}
