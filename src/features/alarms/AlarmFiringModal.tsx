import { Show, createEffect } from 'solid-js'
import { BellRing, Check, X } from 'lucide-solid'
import Button from '~/components/Button'
import { useWorkspace } from '~/state/workspaceContext'
import { formatAlarmTime } from './lib/alarmFormat'

/**
 * Global modal that appears whenever the alarms scheduler reports a firing
 * alarm. Done completes the associated task and dismisses; Dismiss only
 * dismisses. Backdrop click does not close (this is an attention-required UX
 * — the user has to commit one way or the other).
 */

export default function AlarmFiringModal() {
  const ws = useWorkspace()
  let dialogRef: HTMLDialogElement | undefined

  createEffect(() => {
    if (!dialogRef) return
    const open = ws.alarmsScheduler.firing() !== null
    if (open && !dialogRef.open) dialogRef.showModal()
    else if (!open && dialogRef.open) dialogRef.close()
  })

  const firingTime = (): string => {
    const iso = ws.alarmsScheduler.firing()?.task.alarm?.firesAt
    if (!iso) return ''
    return formatAlarmTime(iso).replace(/^(Today|Tomorrow) /, '')
  }

  const onDone = (): void => {
    const f = ws.alarmsScheduler.firing()
    if (!f) return
    void ws.tasks.toggleCompletion(f.groupId, f.task.id)
    ws.alarmsScheduler.dismiss()
  }

  const onDismiss = (): void => {
    ws.alarmsScheduler.dismiss()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Alarm firing"
      // m-auto: restore native <dialog> centering (Tailwind v4 preflight wipes
      // out `margin: auto` from the user-agent dialog style).
      class="m-auto rounded-md border-2 border-border bg-background shadow-brutal p-0 backdrop:bg-foreground/80 max-w-md max-h-[calc(100vh-2rem)]"
    >
      <Show when={ws.alarmsScheduler.firing()}>
        {(firing) => (
          <div class="w-full max-w-md p-6 space-y-5">
            <div class="flex items-center gap-4">
              <span class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground border-2 border-border shadow-brutal">
                <BellRing size={28} class="motion-safe:animate-pulse" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
                  Alarm fired
                </p>
                <Show when={firingTime()}>
                  <p class="readout text-2xl font-bold leading-none mt-1">
                    {firingTime()}
                  </p>
                </Show>
              </div>
            </div>

            <h2 class="text-xl font-bold tracking-tight break-words leading-snug">
              {firing().task.name}
            </h2>

            <div class="flex gap-2">
              <Button variant="success" size="lg" btnClass="flex-1" onClick={onDone}>
                <Check size={20} />
                Done
              </Button>
              <Button variant="neutral" size="lg" btnClass="flex-1" onClick={onDismiss}>
                <X size={20} />
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Show>
    </dialog>
  )
}
