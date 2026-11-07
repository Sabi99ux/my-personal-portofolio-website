const STORAGE_KEY = 'feedback';

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let enabled = false;
let audio: AudioContext | null = null;

/** A short synthesized blip. No audio files, nothing to load, silent unless the visitor opted in. */
function blip(frequency: number, seconds: number, gain: number) {
  if (!enabled) return;
  const Context = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Context) return;
  audio ??= new Context();
  if (audio.state === 'suspended') void audio.resume();

  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + seconds);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(amp).connect(audio.destination);
  osc.start(now);
  osc.stop(now + seconds);
}

const buzz = (ms: number) => {
  if (enabled) navigator.vibrate?.(ms);
};

export const feedback = {
  /** Reads the saved preference. Call once on mount. */
  init(): boolean {
    try {
      enabled = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      enabled = false;
    }
    return enabled;
  },
  set(on: boolean) {
    enabled = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {
      /* private mode: preference just won't persist */
    }
    if (on) feedback.press(); // created inside the click that enabled it, so the browser allows audio
  },
  /** Hovering something interactive. */
  tick() {
    blip(1900, 0.03, 0.025);
    buzz(4);
  },
  /** Pressing something. */
  press() {
    blip(520, 0.07, 0.05);
    buzz(10);
  },
};
