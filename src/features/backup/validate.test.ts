import { describe, it, expect } from 'vitest'
import { parseAndValidate } from './validate'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, type BackupFile } from './types'

const validFile = (): BackupFile => ({
  format: BACKUP_FORMAT,
  formatVersion: BACKUP_FORMAT_VERSION,
  dbVersion: 3,
  exportedAt: '2026-05-31T12:00:00.000Z',
  data: {
    groups: [{ id: 'g1', name: 'Work', order: 0, isOpen: true, isHidden: false }],
    tasks: [],
    preferences: [{ id: 'global', defaultSoundId: null }],
    sounds: [
      {
        id: 's1',
        name: 'beep',
        contentType: 'audio/mpeg',
        sizeBytes: 3,
        createdAt: '2026-05-31T10:00:00.000Z',
        audioBase64: 'YWJj',
      },
    ],
  },
})

const json = (value: unknown): string => JSON.stringify(value)

describe('parseAndValidate', () => {
  it('accepts a well-formed backup', () => {
    const result = parseAndValidate(json(validFile()))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.data.groups[0]?.id).toBe('g1')
  })

  it('accepts an empty-but-valid backup', () => {
    const file = validFile()
    file.data = { groups: [], tasks: [], preferences: [], sounds: [] }
    expect(parseAndValidate(json(file)).ok).toBe(true)
  })

  it('rejects malformed JSON as not-a-backup', () => {
    const result = parseAndValidate('{not json')
    expect(result).toEqual({ ok: false, reason: expect.stringContaining('DaiBX backup') })
  })

  it('rejects a JSON value that is not an object', () => {
    expect(parseAndValidate('42').ok).toBe(false)
    expect(parseAndValidate('null').ok).toBe(false)
  })

  it('rejects a wrong format marker as not-a-backup', () => {
    const file = { ...validFile(), format: 'something-else' }
    const result = parseAndValidate(json(file))
    expect(result).toEqual({
      ok: false,
      reason: expect.stringContaining("doesn't look like a DaiBX backup"),
    })
  })

  it('refuses an incompatible (future) format version', () => {
    const file = { ...validFile(), formatVersion: 2 }
    const result = parseAndValidate(json(file))
    expect(result).toEqual({
      ok: false,
      reason: expect.stringContaining('newer version'),
    })
  })

  it('rejects when a data collection is missing or not an array', () => {
    const file = validFile()
    ;(file.data as unknown as Record<string, unknown>).tasks = 'nope'
    expect(parseAndValidate(json(file))).toEqual({
      ok: false,
      reason: expect.stringContaining('damaged'),
    })
  })

  it('rejects when data is absent entirely', () => {
    const file = { format: BACKUP_FORMAT, formatVersion: BACKUP_FORMAT_VERSION }
    expect(parseAndValidate(json(file)).ok).toBe(false)
  })

  it('rejects a group row missing its id', () => {
    const file = validFile()
    file.data.groups = [{ name: 'no id' } as unknown as BackupFile['data']['groups'][number]]
    expect(parseAndValidate(json(file))).toEqual({
      ok: false,
      reason: expect.stringContaining('damaged'),
    })
  })

  it('rejects a sound row missing audioBase64', () => {
    const file = validFile()
    const sound = file.data.sounds[0]
    if (sound) delete (sound as unknown as Record<string, unknown>).audioBase64
    expect(parseAndValidate(json(file)).ok).toBe(false)
  })
})
