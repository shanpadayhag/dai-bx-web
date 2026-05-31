import { Show, createEffect, createSignal } from 'solid-js'
import { Download, TriangleAlert, Upload, X } from 'lucide-solid'
import Button from '~/components/Button'
import { Card } from '~/components/Card'
import { exportBackup } from './serialize'
import { backupFilename, downloadBackup } from './download'
import { parseAndValidate } from './validate'
import { replaceAllStores } from './repository'
import type { BackupFile } from './types'

/**
 * Settings section for whole-app backup. Export downloads a single dated JSON
 * file with every store (sound blobs base64-encoded); Import validates a chosen
 * file, warns that it replaces all current data, and on confirm applies it in
 * one atomic transaction then reloads. A bad file shows an inline error and
 * leaves existing data untouched. The destructive confirm uses the app's
 * `<dialog>` modal pattern (cf. AlarmFiringModal).
 */

export default function BackupSection() {
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [pending, setPending] = createSignal<BackupFile | null>(null)
  let fileInputRef: HTMLInputElement | undefined
  let dialogRef: HTMLDialogElement | undefined

  createEffect(() => {
    if (!dialogRef) return
    const open = pending() !== null
    if (open && !dialogRef.open) dialogRef.showModal()
    else if (!open && dialogRef.open) dialogRef.close()
  })

  const onExport = async (): Promise<void> => {
    if (busy()) return
    setError(null)
    setBusy(true)
    try {
      const now = new Date()
      const file = await exportBackup(now.toISOString())
      downloadBackup(file, backupFilename(now))
    } catch {
      setError('Export failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const onImportClick = (): void => {
    setError(null)
    fileInputRef?.click()
  }

  const onFileChange = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file || busy()) return
    setError(null)
    let text: string
    try {
      text = await file.text()
    } catch {
      setError("This doesn't look like a DaiBX backup.")
      return
    }
    const result = parseAndValidate(text)
    if (!result.ok) {
      setError(result.reason)
      return
    }
    setPending(result.file)
  }

  const onCancel = (): void => {
    setPending(null)
  }

  const onConfirm = async (): Promise<void> => {
    const file = pending()
    if (!file) return
    setBusy(true)
    try {
      await replaceAllStores(file)
      setPending(null)
      window.location.reload()
    } catch {
      setPending(null)
      setBusy(false)
      setError('Import failed. Your existing data was left unchanged.')
    }
  }

  return (
    <section aria-label="Backup and transfer" class="mt-10">
      <h2 class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground mb-3">
        Backup &amp; transfer
      </h2>
      <Card class="p-5">
        <p class="text-sm font-medium text-muted-foreground max-w-md">
          Export everything, groups, tasks, sounds, and preferences, to a single
          file you keep. Import that file on another device to move your whole
          app across. Importing replaces all data on this device.
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => void onExport()} disabled={busy()}>
            <Download size={16} />
            {busy() ? 'Working…' : 'Export backup'}
          </Button>
          <Button
            variant="neutral"
            onClick={onImportClick}
            disabled={busy()}
          >
            <Upload size={16} />
            Import backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void onFileChange(event)}
            class="hidden"
            data-testid="backup-file-input"
          />
        </div>

        <Show when={error()}>
          {(message) => (
            <p
              role="alert"
              class="mt-4 flex items-start gap-2 rounded-md border-2 border-border bg-destructive/15 px-3 py-2 text-sm font-semibold text-foreground"
            >
              <TriangleAlert size={16} class="mt-0.5 shrink-0 text-destructive" />
              <span>{message()}</span>
            </p>
          )}
        </Show>
      </Card>

      <dialog
        ref={dialogRef}
        aria-label="Confirm import"
        class="m-auto rounded-md border-2 border-border bg-background shadow-brutal p-0 backdrop:bg-foreground/80 max-w-md max-h-[calc(100vh-2rem)]"
        onCancel={(event) => {
          event.preventDefault()
          onCancel()
        }}
      >
        <div class="w-full max-w-md p-6 space-y-5">
          <div class="flex items-center gap-4">
            <span class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground border-2 border-border shadow-brutal">
              <TriangleAlert size={28} />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
                Replace all data
              </p>
              <h3 class="text-xl font-bold tracking-tight leading-snug mt-1">
                Import this backup?
              </h3>
            </div>
          </div>

          <p class="text-sm font-medium text-muted-foreground">
            This will erase every group, task, sound, and preference currently on
            this device and replace them with the backup. This can’t be undone.
          </p>

          <div class="flex gap-2">
            <Button
              variant="destructive"
              size="lg"
              btnClass="flex-1"
              disabled={busy()}
              onClick={() => void onConfirm()}
            >
              <Upload size={20} />
              {busy() ? 'Importing…' : 'Replace everything'}
            </Button>
            <Button
              variant="neutral"
              size="lg"
              btnClass="flex-1"
              disabled={busy()}
              onClick={onCancel}
            >
              <X size={20} />
              Cancel
            </Button>
          </div>
        </div>
      </dialog>
    </section>
  )
}
