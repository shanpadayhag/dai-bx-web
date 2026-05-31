/**
 * Backup envelope types. A backup file is a single self-contained JSON object
 * carrying every IndexedDB store. Group/task/preference rows are stored
 * verbatim; sound blobs are base64-encoded (JSON can't carry binary) and
 * rebuilt into `Blob`s on import.
 */

import type { GroupRow } from '~/features/groups/types'
import type { TaskRow } from '~/features/tasks/types'
import type { PreferencesRow } from '~/features/preferences/types'
import type { SoundMeta } from '~/features/sounds/types'

/** Fixed literal that identifies a DaiBX backup — the first validation gate. */
export const BACKUP_FORMAT = 'daibx-backup'

/** Bump only on an incompatible envelope change. A reader only accepts its own. */
export const BACKUP_FORMAT_VERSION = 1

/** A sound stripped of its `Blob`, with the bytes carried as base64 instead. */
export interface BackupSound extends SoundMeta {
  audioBase64: string
}

/** The whole-app backup envelope, serialized to one `.json` file. */
export interface BackupFile {
  format: typeof BACKUP_FORMAT
  formatVersion: typeof BACKUP_FORMAT_VERSION
  dbVersion: number
  exportedAt: string
  data: {
    groups: GroupRow[]
    tasks: TaskRow[]
    preferences: PreferencesRow[]
    sounds: BackupSound[]
  }
}

/** Result of parsing + validating untrusted file text. Pure, no DB access. */
export type ValidationResult =
  | { ok: true; file: BackupFile }
  | { ok: false; reason: string }
