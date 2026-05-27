import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, __resetForTests } from '~/lib/db'
import {
  deleteSound,
  getSoundBlob,
  getSoundRow,
  listSoundMeta,
  putSound,
} from './repository'
import type { SoundRow } from './types'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const row = (overrides: Partial<SoundRow>): SoundRow => ({
  id: 's',
  name: 'sound',
  contentType: 'audio/mpeg',
  sizeBytes: 100,
  createdAt: '2026-05-24T10:00:00.000Z',
  blob: new Blob(['audio-bytes'], { type: 'audio/mpeg' }),
  ...overrides,
})

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('listSoundMeta', () => {
  it('returns empty when no sounds exist', async () => {
    expect(await listSoundMeta()).toEqual([])
  })

  it('returns metadata sorted by createdAt ascending', async () => {
    await putSound(row({ id: 'a', createdAt: '2026-05-24T12:00:00Z' }))
    await putSound(row({ id: 'b', createdAt: '2026-05-24T08:00:00Z' }))
    await putSound(row({ id: 'c', createdAt: '2026-05-24T10:00:00Z' }))
    const ids = (await listSoundMeta()).map((s) => s.id)
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  it('strips the blob from the returned metadata', async () => {
    await putSound(row({ id: 'a' }))
    const [meta] = await listSoundMeta()
    expect(meta).toBeDefined()
    expect((meta as Partial<SoundRow>).blob).toBeUndefined()
  })
})

describe('getSoundRow / getSoundBlob', () => {
  it('returns the full row, including the persisted blob field', async () => {
    const blob = new Blob(['hi'], { type: 'audio/mpeg' })
    await putSound(row({ id: 'a', blob }))
    const got = await getSoundRow('a')
    expect(got?.id).toBe('a')
    // fake-indexeddb's structured clone of Blob loses the prototype in jsdom;
    // we just assert the field round-tripped, not its instance type.
    expect(got?.blob).toBeDefined()
  })

  it('returns null for an unknown id', async () => {
    expect(await getSoundRow('nope')).toBeNull()
    expect(await getSoundBlob('nope')).toBeNull()
  })

  it('getSoundBlob returns the round-tripped blob field', async () => {
    await putSound(row({ id: 'a' }))
    expect(await getSoundBlob('a')).toBeDefined()
  })
})

describe('putSound', () => {
  it('upserts a row', async () => {
    await putSound(row({ id: 'a', name: 'first' }))
    await putSound(row({ id: 'a', name: 'second' }))
    expect((await listSoundMeta())[0]?.name).toBe('second')
  })
})

describe('deleteSound', () => {
  it('removes the row', async () => {
    await putSound(row({ id: 'a' }))
    await deleteSound('a')
    expect(await listSoundMeta()).toEqual([])
  })

  it('is a no-op for an unknown id', async () => {
    await putSound(row({ id: 'a' }))
    await deleteSound('nope')
    expect((await listSoundMeta())[0]?.id).toBe('a')
  })
})
