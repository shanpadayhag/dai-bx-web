import { beforeEach, describe, it, expect } from 'vitest'
import { DB_NAME, __resetForTests } from '~/lib/db'
import { getPreferences, setDefaultSoundId } from './repository'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('getPreferences', () => {
  it('returns the empty default when nothing has been saved', async () => {
    expect(await getPreferences()).toEqual({ id: 'global', defaultSoundId: null })
  })

  it('returns the saved row', async () => {
    await setDefaultSoundId('sound-1')
    expect(await getPreferences()).toEqual({
      id: 'global',
      defaultSoundId: 'sound-1',
    })
  })
})

describe('setDefaultSoundId', () => {
  it('persists the default sound id', async () => {
    await setDefaultSoundId('s1')
    expect((await getPreferences()).defaultSoundId).toBe('s1')
  })

  it('can clear the default by passing null', async () => {
    await setDefaultSoundId('s1')
    await setDefaultSoundId(null)
    expect((await getPreferences()).defaultSoundId).toBeNull()
  })
})
