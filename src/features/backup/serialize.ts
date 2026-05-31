/**
 * Builds the export envelope: read every store, base64-encode each sound's
 * blob, and assemble a versioned `BackupFile`. Group/task/preference rows are
 * copied verbatim. `exportedAt` is passed in (not read from the clock here) so
 * the function stays pure and testable.
 */

import type { SoundRow } from '~/features/sounds/types'
import { blobToBase64 } from './base64'
import { readAllStores } from './repository'
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  type BackupFile,
  type BackupSound,
} from './types'
import { DB_VERSION } from '~/lib/db'

/** Encode one stored sound (meta + blob) into its base64-carrying backup form. */
const toBackupSound = async (row: SoundRow): Promise<BackupSound> => ({
  id: row.id,
  name: row.name,
  contentType: row.contentType,
  sizeBytes: row.sizeBytes,
  createdAt: row.createdAt,
  audioBase64: await blobToBase64(row.blob),
})

/** Read all stores and assemble the full backup envelope for download. */
export const exportBackup = async (exportedAt: string): Promise<BackupFile> => {
  const { groups, tasks, preferences, sounds } = await readAllStores()
  const backupSounds = await Promise.all(sounds.map(toBackupSound))
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    dbVersion: DB_VERSION,
    exportedAt,
    data: { groups, tasks, preferences, sounds: backupSounds },
  }
}
