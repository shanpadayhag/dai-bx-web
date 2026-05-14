let context: AudioContext | null = null;
let activeBeepStop: (() => void) | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  return context;
};

export const primeAudio = async (): Promise<void> => {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();
};

export const playBeep = (): void => {
  stopAlarm();
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 880;
  osc.connect(gain);

  const start = ctx.currentTime;
  osc.start(start);

  const beat = 0.6;
  for (let i = 0; i < 30; i++) {
    const t = start + i * beat;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.05);
    gain.gain.setValueAtTime(0.4, t + beat * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.6);
  }

  osc.stop(start + 30 * beat);

  activeBeepStop = () => {
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      /* already stopped */
    }
    activeBeepStop = null;
  };
};

export const playSoundBlob = (blob: Blob, options: { loop?: boolean } = {}): void => {
  stopAlarm();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.loop = options.loop ?? true;
  audio.play().catch(() => {
    /* play may be blocked until user gesture; alarm picker primes context */
  });
  activeAudio = audio;
  activeAudioUrl = url;
};

export interface RunSoundHandle {
  stop: () => void;
}

export const playRunSound = (blob: Blob, opts: { loop?: boolean } = {}): RunSoundHandle => {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.loop = opts.loop ?? true;
  let stopped = false;
  audio.play().catch(() => {
    /* play may be blocked until user gesture; alarm picker primes context */
  });
  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* element may be detached */
    }
    URL.revokeObjectURL(url);
  };
  return { stop };
};

export const playRunBeep = (): RunSoundHandle => {
  const ctx = getContext();
  if (!ctx) return { stop: () => undefined };
  if (ctx.state === 'suspended') void ctx.resume();

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 880;
  osc.connect(gain);

  const start = ctx.currentTime;
  osc.start(start);

  const beat = 0.6;
  const cycles = 30;
  for (let i = 0; i < cycles; i++) {
    const t = start + i * beat;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.05);
    gain.gain.setValueAtTime(0.4, t + beat * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.6);
  }
  osc.stop(start + cycles * beat);

  let stopped = false;
  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      /* already stopped */
    }
  };
  return { stop };
};

export const stopAlarm = (): void => {
  activeBeepStop?.();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
};
