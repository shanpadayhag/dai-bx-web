/**
 * Parses and validates untrusted backup-file text before any data is touched.
 * Pure: no IndexedDB access, no side effects. Returns a discriminated result so
 * callers can surface the reason and leave existing data untouched on failure.
 *
 * Validation gates, in order: well-formed JSON → object → correct `format` →
 * compatible `formatVersion` → the four `data` arrays present → basic per-record
 * field presence. Anything else is rejected, never coerced.
 */

import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  type BackupFile,
  type ValidationResult,
} from './types'

const NOT_A_BACKUP = "This doesn't look like a DaiBX backup."
const INCOMPATIBLE =
  'This backup was made by a newer version of DaiBX and can’t be imported.'
const DAMAGED = 'This backup file is damaged or incomplete.'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isString = (value: unknown): value is string => typeof value === 'string'

/** Every record in a store must at least be an object carrying a string `id`. */
const allHaveStringId = (rows: unknown[]): boolean =>
  rows.every((row) => isRecord(row) && isString(row.id))

const soundsValid = (rows: unknown[]): boolean =>
  rows.every(
    (row) =>
      isRecord(row) &&
      isString(row.id) &&
      isString(row.contentType) &&
      isString(row.audioBase64),
  )

/** Parse + validate file text. Never throws; failures come back as `ok: false`. */
export const parseAndValidate = (text: string): ValidationResult => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: NOT_A_BACKUP }
  }

  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) {
    return { ok: false, reason: NOT_A_BACKUP }
  }

  if (parsed.formatVersion !== BACKUP_FORMAT_VERSION) {
    return { ok: false, reason: INCOMPATIBLE }
  }

  const data = parsed.data
  if (!isRecord(data)) return { ok: false, reason: DAMAGED }

  const { groups, tasks, preferences, sounds } = data
  if (
    !Array.isArray(groups) ||
    !Array.isArray(tasks) ||
    !Array.isArray(preferences) ||
    !Array.isArray(sounds)
  ) {
    return { ok: false, reason: DAMAGED }
  }

  if (
    !allHaveStringId(groups) ||
    !allHaveStringId(tasks) ||
    !allHaveStringId(preferences) ||
    !soundsValid(sounds)
  ) {
    return { ok: false, reason: DAMAGED }
  }

  return { ok: true, file: parsed as unknown as BackupFile }
}
