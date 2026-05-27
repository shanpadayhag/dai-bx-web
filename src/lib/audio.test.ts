import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import {
  __resetAudioForTests,
  clearAllBufferCache,
  clearBufferCache,
  decodeBlob,
  getBufferFor,
  playBeep,
  playBuffer,
  primeAudio,
  resolveSound,
} from './audio'

// jsdom doesn't ship the Web Audio API; we hand-roll a minimal mock with
// enough surface for the unit under test.

class MockAudioBuffer {
  readonly id: string
  constructor(id: string) {
    this.id = id
  }
}

class MockBufferSource {
  buffer: AudioBuffer | null = null
  loop = false
  start = vi.fn()
  stop = vi.fn()
  connect = vi.fn()
}

class MockOscillator {
  type = 'sine'
  frequency = { value: 0 }
  start = vi.fn()
  stop = vi.fn()
  connect = vi.fn()
}

class MockGain {
  gain = {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  }
  connect = vi.fn()
}

class MockAudioContext {
  state: 'suspended' | 'running' = 'running'
  currentTime = 0
  destination = {} as AudioDestinationNode
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  createBufferSource = vi.fn(() => new MockBufferSource())
  createOscillator = vi.fn(() => new MockOscillator())
  createGain = vi.fn(() => new MockGain())
  decodeAudioData = vi.fn(
    async (_arr: ArrayBuffer): Promise<AudioBuffer> =>
      new MockAudioBuffer('decoded') as unknown as AudioBuffer,
  )
}

type WindowWithAudio = Window & {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

let lastContext: MockAudioContext | null = null

beforeEach(() => {
  __resetAudioForTests()
  lastContext = null
  const factory = vi.fn(function FactoryAudioContext() {
    lastContext = new MockAudioContext()
    return lastContext
  })
  ;(window as WindowWithAudio).AudioContext =
    factory as unknown as typeof AudioContext
})

afterEach(() => {
  delete (window as WindowWithAudio).AudioContext
  __resetAudioForTests()
})

const blobFor = (text = 'x'): Blob => new Blob([text], { type: 'audio/mpeg' })

describe('primeAudio', () => {
  it('does nothing when AudioContext is missing', async () => {
    delete (window as WindowWithAudio).AudioContext
    await expect(primeAudio()).resolves.toBeUndefined()
  })

  it('resumes a suspended context', async () => {
    await primeAudio()
    expect(lastContext).not.toBeNull()
    lastContext!.state = 'suspended'
    await primeAudio()
    expect(lastContext!.resume).toHaveBeenCalled()
  })

  it('reuses the same context across calls', async () => {
    await primeAudio()
    const first = lastContext
    await primeAudio()
    expect(lastContext).toBe(first)
  })
})

describe('decodeBlob', () => {
  it('returns null when no AudioContext', async () => {
    delete (window as WindowWithAudio).AudioContext
    expect(await decodeBlob(blobFor())).toBeNull()
  })

  it('decodes via the context', async () => {
    const result = await decodeBlob(blobFor())
    expect(result).toBeTruthy()
    expect(lastContext?.decodeAudioData).toHaveBeenCalledOnce()
  })

  it('returns null when decodeAudioData throws', async () => {
    await decodeBlob(blobFor()) // create context
    lastContext!.decodeAudioData = vi.fn().mockRejectedValue(new Error('bad audio'))
    expect(await decodeBlob(blobFor())).toBeNull()
  })
})

describe('playBuffer', () => {
  it('plays the buffer and returns an idempotent stop handle', () => {
    const buffer = new MockAudioBuffer('b') as unknown as AudioBuffer
    const handle = playBuffer(buffer, { loop: true })
    expect(lastContext?.createBufferSource).toHaveBeenCalledOnce()
    const source = lastContext!.createBufferSource.mock.results[0]!.value as MockBufferSource
    expect(source.buffer).toBe(buffer)
    expect(source.loop).toBe(true)
    expect(source.start).toHaveBeenCalled()

    handle.stop()
    handle.stop()
    expect(source.stop).toHaveBeenCalledOnce()
  })

  it('no-ops when AudioContext is missing', () => {
    delete (window as WindowWithAudio).AudioContext
    const buffer = new MockAudioBuffer('b') as unknown as AudioBuffer
    const handle = playBuffer(buffer)
    expect(() => handle.stop()).not.toThrow()
  })
})

describe('playBeep', () => {
  it('schedules an oscillator with the carrier envelope, returns idempotent stop', () => {
    const handle = playBeep()
    expect(lastContext?.createOscillator).toHaveBeenCalledOnce()
    expect(lastContext?.createGain).toHaveBeenCalledOnce()
    handle.stop()
    handle.stop() // idempotent
    const osc = lastContext!.createOscillator.mock.results[0]!.value as MockOscillator
    expect(osc.stop).toHaveBeenCalled()
  })

  it('no-ops when AudioContext is missing', () => {
    delete (window as WindowWithAudio).AudioContext
    expect(() => playBeep().stop()).not.toThrow()
  })
})

describe('getBufferFor (cache)', () => {
  it('caches the decoded buffer per soundId', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(blobFor())
    const first = await getBufferFor('s1', fetchBlob)
    const second = await getBufferFor('s1', fetchBlob)
    expect(first).toBe(second)
    expect(fetchBlob).toHaveBeenCalledOnce()
    expect(lastContext?.decodeAudioData).toHaveBeenCalledOnce()
  })

  it('shares the in-flight promise across concurrent callers', async () => {
    let resolveBlob!: (b: Blob) => void
    const fetchBlob = vi.fn(
      () =>
        new Promise<Blob>((resolve) => {
          resolveBlob = resolve
        }),
    )
    const a = getBufferFor('s1', fetchBlob)
    const b = getBufferFor('s1', fetchBlob)
    resolveBlob(blobFor())
    const [ra, rb] = await Promise.all([a, b])
    expect(ra).toBe(rb)
    expect(fetchBlob).toHaveBeenCalledOnce()
  })

  it('returns null when the fetch returns null and does not cache', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(null)
    expect(await getBufferFor('missing', fetchBlob)).toBeNull()
    expect(await getBufferFor('missing', fetchBlob)).toBeNull()
    expect(fetchBlob).toHaveBeenCalledTimes(2)
  })

  it('clearBufferCache evicts the entry so the next call re-fetches', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(blobFor())
    await getBufferFor('s1', fetchBlob)
    clearBufferCache('s1')
    await getBufferFor('s1', fetchBlob)
    expect(fetchBlob).toHaveBeenCalledTimes(2)
  })

  it('clearAllBufferCache evicts every entry', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(blobFor())
    await getBufferFor('s1', fetchBlob)
    await getBufferFor('s2', fetchBlob)
    clearAllBufferCache()
    await getBufferFor('s1', fetchBlob)
    await getBufferFor('s2', fetchBlob)
    expect(fetchBlob).toHaveBeenCalledTimes(4)
  })
})

describe('resolveSound', () => {
  it('uses the specified sound when present', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(blobFor())
    const r = await resolveSound({
      specifiedId: 'task-sound',
      defaultId: 'default-sound',
      fetchBlob,
    })
    expect(r.source).toBe('specified')
    expect(fetchBlob).toHaveBeenCalledWith('task-sound')
  })

  it('falls back to the default sound when no specified id', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(blobFor())
    const r = await resolveSound({
      specifiedId: null,
      defaultId: 'default-sound',
      fetchBlob,
    })
    expect(r.source).toBe('default')
    expect(fetchBlob).toHaveBeenCalledWith('default-sound')
  })

  it('falls back to default when the specified id has no usable buffer', async () => {
    const fetchBlob = vi.fn(async (id: string) => (id === 'gone' ? null : blobFor()))
    const r = await resolveSound({
      specifiedId: 'gone',
      defaultId: 'default-sound',
      fetchBlob,
    })
    expect(r.source).toBe('default')
  })

  it('falls back to the beep when neither id resolves', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(null)
    const r = await resolveSound({
      specifiedId: 'a',
      defaultId: 'b',
      fetchBlob,
    })
    expect(r.source).toBe('beep')
    const handle = r.play()
    expect(lastContext?.createOscillator).toHaveBeenCalledOnce()
    handle.stop()
  })

  it('falls back to the beep when both ids are null', async () => {
    const fetchBlob = vi.fn()
    const r = await resolveSound({ specifiedId: null, defaultId: null, fetchBlob })
    expect(r.source).toBe('beep')
    expect(fetchBlob).not.toHaveBeenCalled()
  })

  it('does not consult fetchBlob twice when specified === default', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(blobFor())
    const r = await resolveSound({
      specifiedId: 'same',
      defaultId: 'same',
      fetchBlob,
    })
    expect(r.source).toBe('specified')
    expect(fetchBlob).toHaveBeenCalledOnce()
  })

  it('the returned play() call produces a working stop handle', async () => {
    const fetchBlob = vi.fn().mockResolvedValue(blobFor())
    const r = await resolveSound({
      specifiedId: 's',
      defaultId: null,
      fetchBlob,
    })
    const handle = r.play({ loop: false })
    expect(lastContext?.createBufferSource).toHaveBeenCalledOnce()
    expect(() => handle.stop()).not.toThrow()
  })
})
