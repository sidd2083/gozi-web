/**
 * Audio Alarm Chime Generator using standard Web Audio API
 * No external mp3 files required, works 100% reliably in all modern browsers.
 */

let audioCtx: AudioContext | null = null;
let chimeInterval: NodeJS.Timeout | null = null;
let isMuted: boolean = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
 * Start repeating alarm for new incoming 'placed' orders until acknowledged
 */
export function startContinuousOrderAlert() {
  if (chimeInterval) return; // already chiming
  playChimeTone();
  chimeInterval = setInterval(() => {
    playChimeTone();
  }, 3500); // repeat every 3.5 seconds
}

/**
 * Stop alarm when order is accepted or muted
 */
export function stopContinuousOrderAlert() {
  if (chimeInterval) {
    clearInterval(chimeInterval);
    chimeInterval = null;
  }
}

/**
 * Toggle sound mute
 */
export function setAudioMuted(muted: boolean) {
  isMuted = muted;
  if (muted) {
    stopContinuousOrderAlert();
  }
}

export function isAudioMuted(): boolean {
  return isMuted;
}
