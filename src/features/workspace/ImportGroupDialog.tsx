import { Show, createEffect, createSignal } from 'solid-js'
import { Upload } from 'lucide-solid'
import type { ImportResult } from '~/features/import/types'

/**
 * Native `<dialog>`-backed import dialog. The user picks a `.json` file; on
 * selection we read its text and hand it to `onImport` (the workspace context
 * action). A validation failure shows an inline error and keeps the dialog open
 * for retry; success shows a confirmation line, then auto-closes after a beat.
 *
 * Mirrors `ManageGroupsModal` for the open/close effect and backdrop dismiss.
 */

const AUTO_CLOSE_MS = 1000

interface Props {
  show: boolean
  onImport: (text: string) => Promise<ImportResult>
  onClose: () => void
}

export default function ImportGroupDialog(props: Props) {
  let dialogRef: HTMLDialogElement | undefined
  let inputRef: HTMLInputElement | undefined
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)
  const [busy, setBusy] = createSignal(false)

  const reset = (): void => {
    setError(null)
    setSuccess(null)
    setBusy(false)
    if (inputRef) inputRef.value = ''
  }

  createEffect(() => {
    if (!dialogRef) return
    if (props.show && !dialogRef.open) {
      reset()
      dialogRef.showModal()
    } else if (!props.show && dialogRef.open) {
      dialogRef.close()
    }
  })

  const handleBackdropClick = (event: MouseEvent): void => {
    if (event.target === dialogRef) props.onClose()
  }

  const handleFile = async (file: File): Promise<void> => {
    setBusy(true)
    setError(null)
    setSuccess(null)
    let text: string
    try {
      text = await file.text()
    } catch {
      setBusy(false)
      setError('Could not read the file. Please try again.')
      return
    }
    const result = await props.onImport(text)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      if (inputRef) inputRef.value = ''
      return
    }
    const noun = result.taskCount === 1 ? 'task' : 'tasks'
    setSuccess(`Imported "${result.groupName}" with ${result.taskCount} ${noun}.`)
    setTimeout(() => props.onClose(), AUTO_CLOSE_MS)
  }

  const onChange = (event: Event): void => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => props.onClose()}
      onClick={handleBackdropClick}
      aria-label="Import a group from JSON"
      class="m-auto rounded-md border-2 border-border bg-background shadow-brutal p-0 backdrop:bg-foreground/40 max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]"
    >
      <div class="flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-4 p-4">
        <span class="text-xs font-bold tracking-[0.1em] uppercase text-foreground">
          Import group
        </span>

        <p class="text-sm font-medium text-muted-foreground -mt-2">
          Choose a JSON file with a group name and its tasks. A new group is
          added to the bottom of your list.
        </p>

        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-secondary-background py-8 px-4 text-center transition-colors hover:bg-foreground/5"
          aria-disabled={busy()}
        >
          <Upload size={24} class="text-foreground" aria-hidden="true" />
          <span class="text-sm font-semibold tracking-tight text-foreground">
            {busy() ? 'Importing…' : 'Choose a .json file'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            class="sr-only"
            disabled={busy()}
            onChange={onChange}
          />
        </label>

        <Show when={error()}>
          <p
            role="alert"
            class="rounded-md border-2 border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
          >
            {error()}
          </p>
        </Show>

        <Show when={success()}>
          <p
            role="status"
            class="rounded-md border-2 border-success bg-success/10 px-3 py-2 text-sm font-semibold text-success"
          >
            {success()}
          </p>
        </Show>
      </div>
    </dialog>
  )
}
