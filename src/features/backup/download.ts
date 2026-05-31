/**
 * Triggers a browser download of a backup envelope as a `.json` file. Thin DOM
 * glue: serialize → Blob → object URL → synthetic anchor click → revoke. The
 * object URL is always revoked, even though the click is synchronous, to avoid
 * leaking it.
 */

import type { BackupFile } from './types'

/** Serialize the envelope and prompt the browser to download it as `filename`. */
export const downloadBackup = (file: BackupFile, filename: string): void => {
  const json = JSON.stringify(file)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Date-stamped backup filename, e.g. `daibx-backup-2026-05-31.json`. */
export const backupFilename = (date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `daibx-backup-${yyyy}-${mm}-${dd}.json`
}
