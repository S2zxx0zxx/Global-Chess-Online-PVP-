// CH-01 v3 screen navigation: offline-only, no router or network dependency.
const views = new Set(['home','play','learn','profile','match']);
let current = 'home';

export function navigate(view, {historyMode = 'push', focus = true} = {}) {
  if (!views.has(view)) throw new Error('Unknown game screen');
  if (view === current && document.documentElement.dataset.view === view) return;
  current = view;
  document.documentElement.dataset.view = view;
  document.dispatchEvent(new CustomEvent('chess-screen-changed',{detail:{view}}));
  document.documentElement.classList.remove('tools-open');
  for (const button of document.querySelectorAll('#bottom-nav [data-nav]')) {
    if (button.dataset.nav === view) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  }
  if (historyMode === 'push') history.pushState({globalChessView:view}, '', location.pathname + location.search);
  if (historyMode === 'replace') history.replaceState({globalChessView:view}, '', location.pathname + location.search);
  if (focus) {
    const id = {home:'lobby-title',play:'play-hub-title',learn:'learn-hub-title',profile:'profile-hub-title',match:'match-area'}[view];
    requestAnimationFrame(() => document.getElementById(id)?.focus({preventScroll:true}));
  }
}

export function bindNavigation() {
  const get = id => document.getElementById(id);
  for (const button of document.querySelectorAll('#bottom-nav [data-nav]')) {
    button.addEventListener('click', () => navigate(button.dataset.nav));
  }
  for (const [id,screen] of [
    ['match-exit','home'],['play-from-home','play'],['learn-from-home','learn'],
    ['profile-from-home','profile'],['open-play-hub','play'],
  ]) {
    const button = get(id);
    if (button) button.addEventListener('click', () => navigate(screen));
  }
  const matchMenu = get('match-menu');
  const matchTools = get('match-tools');
  const closeMatchMenu = () => {
    document.documentElement.classList.remove('tools-open');
    matchMenu.focus({preventScroll:true});
  };
  matchMenu.addEventListener('click', () => {
    if (matchMedia('(min-width:600px)').matches) {
      matchTools.scrollIntoView({block:'nearest'});
      return;
    }
    const opened = document.documentElement.classList.toggle('tools-open');
    if (opened) get('match-menu-close').focus({preventScroll:true});
  });
  get('match-menu-close').addEventListener('click', closeMatchMenu);
  document.addEventListener('keydown', event => {
    if (!document.documentElement.classList.contains('tools-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMatchMenu();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...matchTools.querySelectorAll('button:not([disabled]),select:not([disabled]),a[href]')]
      .filter(item => item.getClientRects().length && getComputedStyle(item).visibility !== 'hidden');
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  get('match-result-trigger').addEventListener('click', () => get('result-open').click());
  get('learn-open').addEventListener('click', () => get('learn').click());
  get('puzzles-open').addEventListener('click', () => {
    get('learn').click();
    const picker = get('lesson-picker');
    const option = [...picker.options].find(option => option.textContent.includes('Capture the queen'));
    if (option) { picker.value=option.value; picker.dispatchEvent(new Event('change')); }
  });
  get('daily-open').addEventListener('click', () => {
    get('learn').click();
    const picker = get('lesson-picker');
    picker.selectedIndex = picker.options.length - 1;
    picker.dispatchEvent(new Event('change'));
  });
  get('profile-settings').addEventListener('click', () => get('settings-open').click());
  get('profile-history').addEventListener('click', () => get('history-button').click());
  get('profile-open').addEventListener('click', () => navigate('profile'));
  get('result-home').addEventListener('click', () => {
    get('result-dialog').close();
    navigate('home');
  });
  get('result-rematch').addEventListener('click', () => navigate('match'));
  window.addEventListener('popstate', event => {
    navigate(views.has(event.state?.globalChessView) ? event.state.globalChessView : 'home', {historyMode:'none'});
  });
  navigate('home',{historyMode:'replace',focus:false});
}
