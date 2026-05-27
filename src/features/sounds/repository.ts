/**
 * Sounds data-access. Ported from client-web-old/.../sounds.repository.ts.
 * The IDB store holds `SoundRow` (meta + blob). `listSoundMeta` strips the
 * blob so the UI only loads the lightweight metadata; blobs are fetched on
 * demand via `getSoundBlob` for playback.
 */

import { getDb, STORES } from '~/lib/db'
import type { SoundMeta, SoundRow } from './types'

const toMeta = (row: SoundRow): SoundMeta => ({
  id: row.id,
  name: row.name,
  contentType: row.contentType,
  sizeBytes: row.sizeBytes,
  createdAt: row.createdAt,
})

export const listSoundMeta = async (): Promise<SoundMeta[]> => {
  try {
    const db = await getDb()
    const rows = (await db.getAll(STORES.sounds)) as SoundRow[]
    rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return rows.map(toMeta)
  } catch {
    return []
  }
}

export const getSoundRow = async (id: string): Promise<SoundRow | null> => {
  try {
    const db = await getDb()
    const row = (await db.get(STORES.sounds, id)) as SoundRow | undefined
    return row ?? null
  } catch {
    return null
  }
}

export const getSoundBlob = async (id: string): Promise<Blob | null> => {
  const row = await getSoundRow(id)
  return row?.blob ?? null
}

export const putSound = async (row: SoundRow): Promise<void> => {
  try {
    const db = await getDb()
    await db.put(STORES.sounds, row)
  } catch {
    /* ignore */
  }
}

export const deleteSound = async (id: string): Promise<void> => {
  try {
    const db = await getDb()
    await db.delete(STORES.sounds, id)
  } catch {
    /* ignore */
  }
}
