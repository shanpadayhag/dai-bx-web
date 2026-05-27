/**
 * Global preferences data-access. Ported from
 *   client-web-old/.../preferences.repository.ts.
 *
 * Single record at IDB key `'global'`. Returns a default empty row when not
 * yet persisted, so callers never have to handle the missing case.
 */

import { getDb, PREFERENCES_KEY, STORES } from '~/lib/db'
import type { PreferencesRow } from './types'

const empty: PreferencesRow = { id: 'global', defaultSoundId: null }

export const getPreferences = async (): Promise<PreferencesRow> => {
  try {
    const db = await getDb()
    const row = (await db.get(STORES.preferences, PREFERENCES_KEY)) as
      | PreferencesRow
      | undefined
    return row ?? empty
  } catch {
    return empty
  }
}

export const setDefaultSoundId = async (
  soundId: string | null,
): Promise<void> => {
  try {
    const db = await getDb()
    const row: PreferencesRow = { id: 'global', defaultSoundId: soundId }
    await db.put(STORES.preferences, row)
  } catch {
    /* ignore */
  }
}
