/**
 * Web Audio playback layer for alarms and timers (T12).
 *
 * Inspired by client-web-old/.../alarm-sound.ts but switched from
 * HTMLAudioElement to a shared `AudioContext` + decoded `AudioBuffer`s for
 * lower latency and overlapping playback (alarms can fire while a timer is
 * running, etc.).
 *
 * Conventions:
 *   - One process-wide AudioContext, lazily created.
 *   - `primeAudio()` resumes the context — call it on the first user gesture
 *     and again from any UI that's about to play.
 *   - Decoded buffers are cached so the hot-path default sound only decodes
 *     once. The cache is keyed by the caller-provided soundId.
 *   - When no real sound resolves, an oscillator-based beep stands in.
 *   - Every `play*` function returns a `SoundHandle` with an idempotent
 *     `stop()` — necessary because alarms / timers race with each other.
 */

let cachedContext: AudioContext | null = null

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  cachedContext ??= new Ctor()
  return cachedContext
}

/** Resume the AudioContext if a previous gesture left it suspended. */
export const primeAudio = async (): Promise<void> => {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') await ctx.resume()
}

/** Decode a Blob into a playable AudioBuffer. Returns null on failure. */
export const decodeBlob = async (blob: Blob): Promise<AudioBuffer | null> => {
  const ctx = getContext()
  if (!ctx) return null
  try {
    const arrayBuffer = await blob.arrayBuffer()
    return await ctx.decodeAudioData(arrayBuffer)
  } catch {
    return null
  }
}

export interface SoundHandle {
  stop: () => void
}

const NOOP_HANDLE: SoundHandle = { stop: () => undefined }

/** Play a decoded AudioBuffer via a fresh BufferSource. */
export const playBuffer = (
  buffer: AudioBuffer,
  opts: { loop?: boolean } = {},
): SoundHandle => {
  const ctx = getContext()
  if (!ctx) return NOOP_HANDLE
  if (ctx.state === 'suspended') void ctx.resume()

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = opts.loop ?? true
  source.connect(ctx.destination)
  source.start()

  let stopped = false
  return {
    stop: (): void => {
      if (stopped) return
      stopped = true
      try {
        source.stop()
      } catch {
        /* already ended */
      }
    },
  }
}

/**
 * Oscillator-based beep fallback. Used when no real sound resolves. Ported
 * envelope (880 Hz sine, 30 cycles of 0.6 s with attack/decay shaping) from
 * the Angular implementation for audio parity.
 */
export const playBeep = (): SoundHandle => {
  const ctx = getContext()
  if (!ctx) return NOOP_HANDLE
  if (ctx.state === 'suspended') void ctx.resume()

  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  gain.connect(ctx.destination)

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 880
  osc.connect(gain)

  const start = ctx.currentTime
  osc.start(start)

  const beat = 0.6
  const cycles = 30
  for (let i = 0; i < cycles; i++) {
    const t = start + i * beat
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.05)
    gain.gain.setValueAtTime(0.4, t + beat * 0.5)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.6)
  }
  osc.stop(start + cycles * beat)

  let stopped = false
  return {
    stop: (): void => {
      if (stopped) return
      stopped = true
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        osc.stop(ctx.currentTime + 0.05)
      } catch {
        /* already ended */
      }
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Buffer cache

const bufferCache = new Map<string, AudioBuffer>()
const inflight = new Map<string, Promise<AudioBuffer | null>>()

/**
 * Get the AudioBuffer for a sound id, decoding via `fetchBlob` if necessary.
 * Caches the result; subsequent calls return the same buffer without
 * re-decoding. Concurrent calls share one in-flight decode.
 */
export const getBufferFor = async (
  soundId: string,
  fetchBlob: (id: string) => Promise<Blob | null>,
): Promise<AudioBuffer | null> => {
  const cached = bufferCache.get(soundId)
  if (cached) return cached

  const pending = inflight.get(soundId)
  if (pending) return pending

  const promise = (async (): Promise<AudioBuffer | null> => {
    const blob = await fetchBlob(soundId)
    if (!blob) return null
    const buf = await decodeBlob(blob)
    if (buf) bufferCache.set(soundId, buf)
    return buf
  })()
  inflight.set(soundId, promise)
  try {
    return await promise
  } finally {
    inflight.delete(soundId)
  }
}

/** Forget a single cached buffer (use when the sound is deleted or replaced). */
export const clearBufferCache = (soundId: string): void => {
  bufferCache.delete(soundId)
  inflight.delete(soundId)
}

/** Forget every cached buffer. Test-only or full-reset paths. */
export const clearAllBufferCache = (): void => {
  bufferCache.clear()
  inflight.clear()
}

// ────────────────────────────────────────────────────────────────────────────
// High-level resolution

export interface ResolveSoundOpts {
  /** The sound the task itself selected, or null. */
  specifiedId: string | null
  /** The global default sound, or null. */
  defaultId: string | null
  /** Looks up a Blob by id (typically `ws.sounds.getBlob`). */
  fetchBlob: (id: string) => Promise<Blob | null>
}

export interface ResolvedSound {
  /** Play and return a stop handle. */
  play: (opts?: { loop?: boolean }) => SoundHandle
  /** Which leg of the resolution chain produced this — useful for telemetry. */
  source: 'specified' | 'default' | 'beep'
}

/**
 * Resolve the sound to play for a given pair of (taskSoundId, defaultId),
 * falling back to the built-in beep if neither has a usable AudioBuffer.
 * Specified id is tried before default; both are decoded through the cache.
 */
export const resolveSound = async (
  opts: ResolveSoundOpts,
): Promise<ResolvedSound> => {
  const candidates: Array<{ id: string; source: 'specified' | 'default' }> = []
  if (opts.specifiedId) candidates.push({ id: opts.specifiedId, source: 'specified' })
  if (opts.defaultId && opts.defaultId !== opts.specifiedId) {
    candidates.push({ id: opts.defaultId, source: 'default' })
  }
  for (const cand of candidates) {
    const buf = await getBufferFor(cand.id, opts.fetchBlob)
    if (buf) {
      return {
        source: cand.source,
        play: (playOpts) => playBuffer(buf, playOpts),
      }
    }
  }
  return {
    source: 'beep',
    play: () => playBeep(),
  }
}

/** Test-only: reset the singleton AudioContext alongside the buffer cache. */
export const __resetAudioForTests = (): void => {
  cachedContext = null
  clearAllBufferCache()
}
