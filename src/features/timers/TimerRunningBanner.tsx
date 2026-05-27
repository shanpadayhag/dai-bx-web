import { Show } from 'solid-js'
import {
  ArrowRight,
  BellOff,
  BellRing,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-solid'
import Button from '~/components/Button'
import { useWorkspace } from '~/state/workspaceContext'

/**
 * Fixed bottom-right banner — appears when at least one run is awaiting the
 * user's attention (`awaitingAdvance` or `completed`). Shows the focused
 * task name, a status icon, and per-state actions. When multiple attention
 * runs exist, prev/next controls + arrow-key navigation cycle through them.
 */

export default function TimerRunningBanner() {
  const ws = useWorkspace()

  const focused = () => ws.timersRunner.focusedRun()
  const isCompleted = (): boolean => focused()?.run.status === 'completed'
  const hasMultiple = (): boolean => (focused()?.total ?? 0) > 1

  const taskName = (): string => {
    const f = focused()
    if (!f) return ''
    return ws.tasks.findTask(f.taskId)?.task.name ?? ''
  }

  const counterLabel = (): string => {
    const f = focused()
    return f ? `${f.index + 1} / ${f.total}` : ''
  }

  const onAdvance = (): void => {
    const f = focused()
    if (f) ws.timersRunner.advance(f.taskId)
  }

  const onCancel = (): void => {
    const f = focused()
    if (f) ws.timersRunner.cancel(f.taskId)
  }

  const onDone = (): void => {
    const f = focused()
    if (f) ws.timersRunner.dismiss(f.taskId)
  }

  const isRinging = (): boolean => {
    const f = focused()
    return !!f && ws.timersRunner.isRinging(f.taskId)
  }

  const onSilence = (): void => {
    const f = focused()
    if (f) ws.timersRunner.silence(f.taskId)
  }

  const onPrev = (): void => {
    if (hasMultiple()) ws.timersRunner.focusPrev()
  }

  const onNext = (): void => {
    if (hasMultiple()) ws.timersRunner.focusNext()
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      onNext()
    }
  }

  return (
    <Show when={focused()}>
      {(f) => (
        <div
          class="fixed bottom-4 right-4 z-50 w-80 rounded-md border-2 border-border bg-background shadow-brutal p-3 space-y-3"
          role="status"
          aria-live="polite"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <div class="flex items-center gap-2.5">
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-border bg-primary text-primary-foreground shadow-brutal-sm">
              <Show when={isCompleted()} fallback={<BellRing size={16} class="motion-safe:animate-pulse" />}>
                <CheckCircle2 size={16} />
              </Show>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
                Timer
              </p>
              <p class="text-sm font-bold tracking-tight truncate leading-tight">
                {taskName()}
              </p>
            </div>
            <Show when={hasMultiple()}>
              <span class="readout text-[0.625rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
                {counterLabel()}
              </span>
            </Show>
          </div>

          <Show when={hasMultiple()}>
            <div class="flex items-center gap-2">
              <Button
                variant="neutral"
                size="icon-sm"
                btnClass="h-8 w-8"
                onClick={onPrev}
                title="Previous timer"
                aria-label="Previous timer"
              >
                <ChevronLeft size={16} />
              </Button>
              <span class="readout flex-1 text-center text-[0.625rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
                {counterLabel()}
              </span>
              <Button
                variant="neutral"
                size="icon-sm"
                btnClass="h-8 w-8"
                onClick={onNext}
                title="Next timer"
                aria-label="Next timer"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </Show>

          <Show when={f().run.status === 'running'}>
            {/* This branch only renders when there's still audio playing from
                a previous step that auto-advanced; without it the user would
                hear a ring with no UI to act on. The two buttons match the
                semantic difference: Silence = hush this ring, keep the
                timer running; Cancel = stop the timer entirely. */}
            <p class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
              Step ringing
            </p>
            <div class="flex gap-2">
              <Button
                size="sm"
                btnClass="flex-1 h-9"
                onClick={onSilence}
              >
                <BellOff size={16} />
                Silence
              </Button>
              <Button
                variant="neutral"
                size="icon-sm"
                btnClass="h-9 w-9"
                onClick={onCancel}
                title="Cancel timer"
                aria-label="Cancel timer"
              >
                <X size={16} />
              </Button>
            </div>
          </Show>

          <Show when={f().run.status === 'awaitingAdvance'}>
            <p class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
              Step complete
            </p>
            <div class="flex gap-2">
              <Button
                variant="success"
                size="sm"
                btnClass="flex-1 h-9"
                onClick={onAdvance}
              >
                <ArrowRight size={16} />
                Next
              </Button>
              <Button
                variant="neutral"
                size="icon-sm"
                btnClass="h-9 w-9"
                onClick={onCancel}
                title="Cancel timer"
                aria-label="Cancel timer"
              >
                <X size={16} />
              </Button>
            </div>
            <Show when={isRinging()}>
              <Button
                variant="neutral"
                size="sm"
                btnClass="w-full h-9"
                onClick={onSilence}
              >
                <BellOff size={16} />
                Silence ring
              </Button>
            </Show>
          </Show>

          <Show when={f().run.status === 'completed'}>
            <p class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
              All done
            </p>
            <Button
              variant="success"
              size="sm"
              btnClass="w-full h-9"
              onClick={onDone}
            >
              <Check size={16} />
              Done
            </Button>
            <Show when={isRinging()}>
              <Button
                variant="neutral"
                size="sm"
                btnClass="w-full h-9"
                onClick={onSilence}
              >
                <BellOff size={16} />
                Silence ring
              </Button>
            </Show>
          </Show>
        </div>
      )}
    </Show>
  )
}
