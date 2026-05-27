import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, __resetForTests } from '~/lib/db'
import { createSoundsStore, type SoundsStore } from './store'
import { listSoundMeta } from './repository'
import { getPreferences } from '~/features/preferences/repository'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const audioFile = (name: string, type = 'audio/mpeg', size = 100): File =>
  new File([new ArrayBuffer(size)], name, { type })

let store: SoundsStore

beforeEach(async () => {
  await __resetForTests()
  await wipe()
  store = createSoundsStore()
})

describe('initial state', () => {
  it('starts empty with loaded=false', () => {
    expect(store.state.sounds).toEqual([])
    expect(store.state.defaultSoundId).toBeNull()
    expect(store.state.loaded).toBe(false)
    expect(store.hasSounds()).toBe(false)
  })
})

describe('load', () => {
  it('hydrates sounds + default from IndexedDB and sets loaded=true', async () => {
    const a = await store.addSound(audioFile('a.mp3'))
    if (a) await store.setDefault(a.id)
    const fresh = createSoundsStore()
    await fresh.load()
    expect(fresh.state.loaded).toBe(true)
    expect(fresh.state.sounds.map((s) => s.id)).toEqual([a?.id])
    expect(fresh.state.defaultSoundId).toBe(a?.id)
  })
})

describe('addSound', () => {
  it('persists an audio file, derives the name from the filename without extension', async () => {
    const meta = await store.addSound(audioFile('alarm-bell.mp3'))
    expect(meta?.name).toBe('alarm-bell')
    expect(store.state.sounds[0]?.name).toBe('alarm-bell')
    expect((await listSoundMeta()).map((s) => s.name)).toEqual(['alarm-bell'])
  })

  it('rejects non-audio files', async () => {
    const result = await store.addSound(
      new File(['x'], 'note.txt', { type: 'text/plain' }),
    )
    expect(result).toBeNull()
    expect(store.state.sounds).toEqual([])
  })

  it('falls back to "Sound" when the filename is empty', async () => {
    const file = new File([new ArrayBuffer(64)], '', { type: 'audio/mpeg' })
    const meta = await store.addSound(file)
    expect(meta?.name).toBe('Sound')
  })

  it('preserves leading-dot filenames verbatim (Angular parity: ".mp3" stays ".mp3")', async () => {
    const meta = await store.addSound(audioFile('.mp3'))
    expect(meta?.name).toBe('.mp3')
  })
})

describe('setDefault', () => {
  it('persists the default to preferences', async () => {
    const a = await store.addSound(audioFile('a.mp3'))
    if (!a) throw new Error('addSound failed')
    await store.setDefault(a.id)
    expect(store.state.defaultSoundId).toBe(a.id)
    expect((await getPreferences()).defaultSoundId).toBe(a.id)
  })

  it('can clear the default by passing null', async () => {
    const a = await store.addSound(audioFile('a.mp3'))
    if (!a) throw new Error('addSound failed')
    await store.setDefault(a.id)
    await store.setDefault(null)
    expect(store.state.defaultSoundId).toBeNull()
  })
})

describe('removeSound', () => {
  it('removes the sound', async () => {
    const a = await store.addSound(audioFile('a.mp3'))
    if (!a) throw new Error('addSound failed')
    await store.removeSound(a.id)
    expect(store.state.sounds).toEqual([])
    expect(await listSoundMeta()).toEqual([])
  })

  it('clears the default when the default sound is removed', async () => {
    const a = await store.addSound(audioFile('a.mp3'))
    const b = await store.addSound(audioFile('b.mp3'))
    if (!a || !b) throw new Error('addSound failed')
    await store.setDefault(a.id)
    await store.removeSound(a.id)
    expect(store.state.defaultSoundId).toBeNull()
    expect((await getPreferences()).defaultSoundId).toBeNull()
    expect(store.state.sounds.map((s) => s.id)).toEqual([b.id])
  })
})

describe('getBlob', () => {
  it('returns the persisted blob (round-tripped through IDB)', async () => {
    const a = await store.addSound(audioFile('a.mp3', 'audio/mpeg', 64))
    if (!a) throw new Error('addSound failed')
    expect(await store.getBlob(a.id)).toBeDefined()
  })

  it('returns null for an unknown id', async () => {
    expect(await store.getBlob('missing')).toBeNull()
  })
})
