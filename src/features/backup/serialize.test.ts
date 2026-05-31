import { beforeEach, describe, it, expect, vi } from 'vitest'
import type { GroupRow } from '~/features/groups/types'
import type { SoundRow } from '~/features/sounds/types'
import type { PreferencesRow } from '~/features/preferences/types'
import type { AllStores } from './repository'
import { base64ToBytes } from './base64'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION } from './types'

// fake-indexeddb in jsdom round-trips a stored Blob as a plain object (the
// Blob prototype is lost), so reading sound bytes back through the real
// repository is impossible here. Mock readAllStores to hand serialize a real
// Blob — this unit-tests the envelope/encoding logic in isolation. The
// repository's own DB behaviour is covered in repository.test.ts.
const readAllStores = vi.fn<() => Promise<AllStores>>()
vi.mock('./repository', () => ({
  readAllStores: () => readAllStores(),
}))

const { exportBackup } = await import('./serialize')

const AT = '2026-05-31T12:00:00.000Z'

const empty: AllStores = { groups: [], tasks: [], preferences: [], sounds: [] }

beforeEach(() => {
  readAllStores.mockReset()
})

describe('exportBackup', () => {
  it('produces a valid envelope for an empty DB', async () => {
    readAllStores.mockResolvedValue(empty)

    const file = await exportBackup(AT)
    expect(file.format).toBe(BACKUP_FORMAT)
    expect(file.formatVersion).toBe(BACKUP_FORMAT_VERSION)
    expect(file.dbVersion).toBe(3)
    expect(file.exportedAt).toBe(AT)
    expect(file.data).toEqual({
      groups: [],
      tasks: [],
      preferences: [],
      sounds: [],
    })
  })

  it('copies group/preference rows verbatim', async () => {
    const groups: GroupRow[] = [
      { id: 'g1', name: 'Work', order: 2, isOpen: true, isHidden: false },
    ]
    const preferences: PreferencesRow[] = [
      { id: 'global', defaultSoundId: 's1' },
    ]
    readAllStores.mockResolvedValue({ ...empty, groups, preferences })

    const file = await exportBackup(AT)
    expect(file.data.groups[0]).toEqual(groups[0])
    expect(file.data.preferences[0]).toEqual(preferences[0])
  })

  it('base64-encodes sound blobs losslessly', async () => {
    const original = new TextEncoder().encode('audio-payload-123')
    const sound: SoundRow = {
      id: 's1',
      name: 'beep',
      contentType: 'audio/mpeg',
      sizeBytes: original.length,
      createdAt: '2026-05-31T10:00:00.000Z',
      blob: new Blob([original], { type: 'audio/mpeg' }),
    }
    readAllStores.mockResolvedValue({ ...empty, sounds: [sound] })

    const file = await exportBackup(AT)
    expect(file.data.sounds).toHaveLength(1)
    const out = file.data.sounds[0]
    expect(out?.id).toBe('s1')
    expect(out?.contentType).toBe('audio/mpeg')
    expect(Array.from(base64ToBytes(out?.audioBase64 ?? ''))).toEqual(
      Array.from(original),
    )
  })
})
