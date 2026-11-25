/**
 * Audio Alarm Chime Generator using standard Web Audio API
 * No external mp3 files required, works 100% reliably in all modern browsers.
 */

let audioCtx: AudioContext | null = null;
let buzzInterval: NodeJS.Timeout | null = null;
let stopTimeout: NodeJS.Timeout | null = null;
let isMuted: boolean = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a crisp dual-tone quick-commerce order chime (High pitch bell alert)
 */
export function playChimeTone() {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1 (High frequency bell: 880Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2 (Harmonic chime: 1174Hz / D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.35);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn('Audio tone play error:', e);
  }
}

/**
 * EXACT 5-SECOND SINGLE BUZZ RULE:
 * Plays an urgent buzzer chime and automatically terminates after exactly 5000ms.
 */
export function playFiveSecondBuzzAlert() {
  if (isMuted) return;

  // Clear any existing active buzz
  stopAudioAlert();

  // Play immediately
  playChimeTone();

  // Repeat every 1.2s during the 5s window
  buzzInterval = setInterval(() => {
    playChimeTone();
  }, 1200);

  // Hard stop at exactly 5000ms
  stopTimeout = setTimeout(() => {
    stopAudioAlert();
  }, 5000);
}

/**
 * Stop any running sound alert
 */
export function stopAudioAlert() {
  if (buzzInterval) {
    clearInterval(buzzInterval);
    buzzInterval = null;
  }
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
}

/**
 * Unlock Web Audio on user gesture (e.g. Test Sound button)
 */
export function unlockAudio(): boolean {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  playChimeTone();
  return true;
}

/**
 * Toggle sound mute
 */
export function setAudioMuted(muted: boolean) {
  isMuted = muted;
  if (muted) {
    stopAudioAlert();
  }
}

export function isAudioMuted(): boolean {
  return isMuted;
}
