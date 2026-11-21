// Original, opt-in chess interface feedback. No bundled third-party samples.
// Oscillators are intentionally subtle, short-lived and respect reduced motion.
const KEY = 'global-chess.feedback.v1';
const DEFAULTS = Object.freeze({sound:false,haptics:false});
let context;

export function feedbackPreferences(storage) {
  try {
    const actual = storage ?? globalThis.localStorage;
    const raw = JSON.parse(actual.getItem(KEY) || 'null');
    return {
      sound: raw?.sound === true,
      haptics: raw?.haptics === true,
    };
  } catch { return {...DEFAULTS}; }
}

export function setFeedbackPreference(name, enabled, storage) {
  if (!Object.hasOwn(DEFAULTS, name) || typeof enabled !== 'boolean')
    throw new Error('Invalid feedback preference');
  const next = {...feedbackPreferences(storage),[name]:enabled};
  try {
    (storage ?? globalThis.localStorage).setItem(KEY,JSON.stringify(next));
    return true;
  } catch { return false; }
}

export function emitFeedback(type) {
  const options = feedbackPreferences();
  if (!options.sound && !options.haptics) return;
  const silent = typeof document !== 'undefined' && document.hidden;
  if (silent) return;
  if (options.haptics) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(type === 'capture' ? [20,20,35] : type === 'check' ? [30,30,30] : 14);
      }
    } catch { /* Device does not support vibration. */ }
  }
  if (!options.sound || typeof window === 'undefined') return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context ??= new Audio();
    if (context.state !== 'running') {
      // Never force audio playback without a browser-allowed user gesture.
      void context.resume().catch(()=>{});
      return;
    }
    const now=context.currentTime;
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    const shape = {
      move:{frequency:360,to:250,duration:.075,amplitude:.032,type:'triangle'},
      capture:{frequency:245,to:110,duration:.125,amplitude:.045,type:'triangle'},
      check:{frequency:540,to:460,duration:.18,amplitude:.028,type:'sine'},
      success:{frequency:640,to:875,duration:.18,amplitude:.035,type:'sine'},
    }[type] ?? {frequency:360,to:250,duration:.075,amplitude:.028,type:'triangle'};
    oscillator.type=shape.type;
    oscillator.frequency.setValueAtTime(shape.frequency,now);
    oscillator.frequency.exponentialRampToValueAtTime(shape.to,now+shape.duration);
    gain.gain.setValueAtTime(.001,now);
    gain.gain.linearRampToValueAtTime(shape.amplitude,now+.009);
    gain.gain.exponentialRampToValueAtTime(.001,now+shape.duration);
    oscillator.connect(gain);gain.connect(context.destination);
    oscillator.start(now);oscillator.stop(now+shape.duration+.012);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  } catch { /* Audio remains strictly optional. */ }
}
